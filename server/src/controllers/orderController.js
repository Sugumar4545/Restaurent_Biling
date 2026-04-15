const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Generate order ID
const generateOrderId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// Create a new order
const createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { table_number, items, order_type, special_instructions } = req.body;
    const orderId = generateOrderId();

    // Fetch actual prices from database to prevent price manipulation
    const menuItemIds = items.map(item => item.menu_item_id);
    const menuResult = await client.query(
      `SELECT id, name, price FROM menu_items WHERE id = ANY($1)`,
      [menuItemIds]
    );
    const menuMap = new Map(menuResult.rows.map(row => [row.id, row]));

    // Validate all items exist
    for (const item of items) {
      if (!menuMap.has(item.menu_item_id)) {
        throw new Error(`Menu item not found: ${item.menu_item_id}`);
      }
    }

    // Calculate total using server-side prices
    let totalAmount = 0;
    for (const item of items) {
      const dbItem = menuMap.get(item.menu_item_id);
      totalAmount += parseFloat(dbItem.price) * item.quantity;
    }

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (order_id, table_number, status, total_amount, order_type, special_instructions, final_amount)
       VALUES ($1, $2, 'Pending', $3, $4, $5, $3) RETURNING *`,
      [orderId, table_number, totalAmount, order_type || 'dine-in', special_instructions || '']
    );

    // Create order items and deduct stock
    for (const item of items) {
      const dbItem = menuMap.get(item.menu_item_id);

      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, price, special_instructions)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, item.menu_item_id, dbItem.name, item.quantity, dbItem.price, item.special_instructions || '']
      );

      // Auto-deduct stock with validation to prevent negative stock
      const stockResult = await client.query(
        `UPDATE menu_items SET stock_quantity = stock_quantity - $1,
         is_available = CASE WHEN stock_quantity - $1 > 0 THEN true ELSE false END
         WHERE id = $2 AND stock_quantity >= $1 RETURNING *`,
        [item.quantity, item.menu_item_id]
      );
      if (stockResult.rows.length === 0) {
        throw new Error(`Insufficient stock for item: ${dbItem.name}`);
      }
    }

    await client.query('COMMIT');

    // Fetch complete order with items
    const completeOrder = await pool.query(
      `SELECT o.*, json_agg(
        json_build_object(
          'id', oi.id, 'menu_item_id', oi.menu_item_id, 'item_name', oi.item_name,
          'quantity', oi.quantity, 'price', oi.price, 'special_instructions', oi.special_instructions
        )
      ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.order_id = $1
      GROUP BY o.id, o.order_id, o.table_number, o.status, o.total_amount, o.tax_amount,
               o.discount_amount, o.final_amount, o.order_type, o.special_instructions, o.created_at, o.updated_at`,
      [orderId]
    );

    const order = completeOrder.rows[0];

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('NEW_ORDER', order);
    }

    res.status(201).json(order);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
};

// Get all orders (with optional status filter)
const getOrders = async (req, res) => {
  try {
    const { status, date } = req.query;
    let query = `
      SELECT o.*, json_agg(
        json_build_object(
          'id', oi.id, 'menu_item_id', oi.menu_item_id, 'item_name', oi.item_name,
          'quantity', oi.quantity, 'price', oi.price, 'special_instructions', oi.special_instructions
        )
      ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND o.status = $${params.length}`;
    }

    if (date) {
      params.push(date);
      query += ` AND DATE(o.created_at) = $${params.length}`;
    }

    query += ` GROUP BY o.id, o.order_id, o.table_number, o.status, o.total_amount, o.tax_amount,
               o.discount_amount, o.final_amount, o.order_type, o.special_instructions, o.created_at, o.updated_at
               ORDER BY o.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Get active orders (Pending, Preparing, Ready)
const getActiveOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, json_agg(
        json_build_object(
          'id', oi.id, 'menu_item_id', oi.menu_item_id, 'item_name', oi.item_name,
          'quantity', oi.quantity, 'price', oi.price, 'special_instructions', oi.special_instructions
        )
      ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.status IN ('Pending', 'Preparing', 'Ready')
      GROUP BY o.id, o.order_id, o.table_number, o.status, o.total_amount, o.tax_amount,
               o.discount_amount, o.final_amount, o.order_type, o.special_instructions, o.created_at, o.updated_at
      ORDER BY o.created_at ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching active orders:', err);
    res.status(500).json({ error: 'Failed to fetch active orders' });
  }
};

// Get single order
const getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await pool.query(
      `SELECT o.*, json_agg(
        json_build_object(
          'id', oi.id, 'menu_item_id', oi.menu_item_id, 'item_name', oi.item_name,
          'quantity', oi.quantity, 'price', oi.price, 'special_instructions', oi.special_instructions
        )
      ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.order_id = $1
      GROUP BY o.id, o.order_id, o.table_number, o.status, o.total_amount, o.tax_amount,
               o.discount_amount, o.final_amount, o.order_type, o.special_instructions, o.created_at, o.updated_at`,
      [orderId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE order_id = $2 RETURNING *`,
      [status, orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Fetch complete order with items
    const completeOrder = await pool.query(
      `SELECT o.*, json_agg(
        json_build_object(
          'id', oi.id, 'menu_item_id', oi.menu_item_id, 'item_name', oi.item_name,
          'quantity', oi.quantity, 'price', oi.price, 'special_instructions', oi.special_instructions
        )
      ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.order_id = $1
      GROUP BY o.id, o.order_id, o.table_number, o.status, o.total_amount, o.tax_amount,
               o.discount_amount, o.final_amount, o.order_type, o.special_instructions, o.created_at, o.updated_at`,
      [orderId]
    );

    const order = completeOrder.rows[0];

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('ORDER_STATUS_UPDATE', order);
      if (status === 'Ready') {
        io.emit('ORDER_READY', order);
      }
    }

    res.json(order);
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

// Apply billing (tax/discount) and mark as Paid
const billOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { tax_percent, discount_amount } = req.body;

    // Get current order
    const orderResult = await pool.query('SELECT * FROM orders WHERE order_id = $1', [orderId]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];
    const taxAmount = (order.total_amount * (tax_percent || 0)) / 100;
    const discount = discount_amount || 0;
    const finalAmount = parseFloat(order.total_amount) + taxAmount - discount;

    const result = await pool.query(
      `UPDATE orders SET tax_amount = $1, discount_amount = $2, final_amount = $3,
       status = 'Paid', updated_at = NOW() WHERE order_id = $4 RETURNING *`,
      [taxAmount, discount, finalAmount, orderId]
    );

    // Fetch complete order
    const completeOrder = await pool.query(
      `SELECT o.*, json_agg(
        json_build_object(
          'id', oi.id, 'menu_item_id', oi.menu_item_id, 'item_name', oi.item_name,
          'quantity', oi.quantity, 'price', oi.price, 'special_instructions', oi.special_instructions
        )
      ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.order_id = $1
      GROUP BY o.id, o.order_id, o.table_number, o.status, o.total_amount, o.tax_amount,
               o.discount_amount, o.final_amount, o.order_type, o.special_instructions, o.created_at, o.updated_at`,
      [orderId]
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('ORDER_STATUS_UPDATE', completeOrder.rows[0]);
    }

    res.json(completeOrder.rows[0]);
  } catch (err) {
    console.error('Error billing order:', err);
    res.status(500).json({ error: 'Failed to bill order' });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getActiveOrders,
  getOrder,
  updateOrderStatus,
  billOrder,
};
