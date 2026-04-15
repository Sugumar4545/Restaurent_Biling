const pool = require('../config/db');

// Get all menu items
const getMenuItems = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM menu_items WHERE 1=1';
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND name ILIKE $${params.length}`;
    }

    query += ' ORDER BY category, name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching menu items:', err);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
};

// Get menu categories
const getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category FROM menu_items ORDER BY category'
    );
    res.json(result.rows.map((r) => r.category));
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Get single menu item
const getMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM menu_items WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching menu item:', err);
    res.status(500).json({ error: 'Failed to fetch menu item' });
  }
};

// Create menu item
const createMenuItem = async (req, res) => {
  try {
    const { name, price, category, stock_quantity, is_available, image_url } = req.body;
    const result = await pool.query(
      `INSERT INTO menu_items (name, price, category, stock_quantity, is_available, image_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, price, category, stock_quantity || 0, is_available !== false, image_url || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating menu item:', err);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
};

// Update menu item
const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category, stock_quantity, is_available, image_url } = req.body;
    const result = await pool.query(
      `UPDATE menu_items SET name = $1, price = $2, category = $3, stock_quantity = $4,
       is_available = $5, image_url = $6, updated_at = NOW() WHERE id = $7 RETURNING *`,
      [name, price, category, stock_quantity, is_available, image_url, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating menu item:', err);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
};

// Delete menu item
const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM menu_items WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted successfully' });
  } catch (err) {
    console.error('Error deleting menu item:', err);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
};

// Update stock quantity
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_quantity } = req.body;
    const result = await pool.query(
      `UPDATE menu_items SET stock_quantity = $1, updated_at = NOW(),
       is_available = CASE WHEN $1 > 0 THEN true ELSE false END
       WHERE id = $2 RETURNING *`,
      [stock_quantity, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating stock:', err);
    res.status(500).json({ error: 'Failed to update stock' });
  }
};

module.exports = {
  getMenuItems,
  getCategories,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateStock,
};
