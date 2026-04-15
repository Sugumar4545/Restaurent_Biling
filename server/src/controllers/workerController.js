const pool = require('../config/db');

// Get all workers
const getWorkers = async (req, res) => {
  try {
    const { role } = req.query;
    let query = 'SELECT * FROM workers WHERE 1=1';
    const params = [];

    if (role) {
      params.push(role);
      query += ` AND role = $${params.length}`;
    }

    query += ' ORDER BY name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching workers:', err);
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
};

// Get single worker
const getWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM workers WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching worker:', err);
    res.status(500).json({ error: 'Failed to fetch worker' });
  }
};

// Create worker
const createWorker = async (req, res) => {
  try {
    const { name, role, phone } = req.body;
    const result = await pool.query(
      `INSERT INTO workers (name, role, phone) VALUES ($1, $2, $3) RETURNING *`,
      [name, role, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating worker:', err);
    res.status(500).json({ error: 'Failed to create worker' });
  }
};

// Update worker
const updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, phone, is_active } = req.body;
    const result = await pool.query(
      `UPDATE workers SET name = $1, role = $2, phone = $3, is_active = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [name, role, phone, is_active, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating worker:', err);
    res.status(500).json({ error: 'Failed to update worker' });
  }
};

// Delete worker
const deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM workers WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    res.json({ message: 'Worker deleted successfully' });
  } catch (err) {
    console.error('Error deleting worker:', err);
    res.status(500).json({ error: 'Failed to delete worker' });
  }
};

module.exports = {
  getWorkers,
  getWorker,
  createWorker,
  updateWorker,
  deleteWorker,
};
