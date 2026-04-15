const pool = require('../config/db');

// Daily sales summary
const getDailySales = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as gross_sales,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COALESCE(SUM(discount_amount), 0) as total_discount,
        COALESCE(SUM(final_amount), 0) as net_sales,
        COUNT(CASE WHEN status = 'Paid' THEN 1 END) as paid_orders,
        COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled_orders,
        COUNT(CASE WHEN order_type = 'dine-in' THEN 1 END) as dine_in_orders,
        COUNT(CASE WHEN order_type = 'parcel' THEN 1 END) as parcel_orders
      FROM orders
      WHERE DATE(created_at) = $1`,
      [targetDate]
    );

    res.json({
      date: targetDate,
      ...result.rows[0],
    });
  } catch (err) {
    console.error('Error fetching daily sales:', err);
    res.status(500).json({ error: 'Failed to fetch daily sales' });
  }
};

// Top selling items
const getTopSellingItems = async (req, res) => {
  try {
    const { date, limit } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const itemLimit = limit || 10;

    const result = await pool.query(
      `SELECT
        oi.item_name,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.price * oi.quantity) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      WHERE DATE(o.created_at) = $1 AND o.status != 'Cancelled'
      GROUP BY oi.item_name
      ORDER BY total_quantity DESC
      LIMIT $2`,
      [targetDate, itemLimit]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching top selling items:', err);
    res.status(500).json({ error: 'Failed to fetch top selling items' });
  }
};

// Sales by category
const getSalesByCategory = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT
        mi.category,
        COUNT(DISTINCT o.order_id) as order_count,
        SUM(oi.quantity) as items_sold,
        SUM(oi.price * oi.quantity) as revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE DATE(o.created_at) = $1 AND o.status != 'Cancelled'
      GROUP BY mi.category
      ORDER BY revenue DESC`,
      [targetDate]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching sales by category:', err);
    res.status(500).json({ error: 'Failed to fetch sales by category' });
  }
};

// Hourly sales breakdown
const getHourlySales = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as order_count,
        COALESCE(SUM(final_amount), 0) as revenue
      FROM orders
      WHERE DATE(created_at) = $1 AND status != 'Cancelled'
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour`,
      [targetDate]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching hourly sales:', err);
    res.status(500).json({ error: 'Failed to fetch hourly sales' });
  }
};

module.exports = {
  getDailySales,
  getTopSellingItems,
  getSalesByCategory,
  getHourlySales,
};
