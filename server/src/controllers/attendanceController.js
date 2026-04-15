const pool = require('../config/db');

// Mark attendance (check-in)
const checkIn = async (req, res) => {
  try {
    const { worker_id } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Check if already checked in today
    const existing = await pool.query(
      'SELECT * FROM attendance WHERE worker_id = $1 AND date = $2',
      [worker_id, today]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    const result = await pool.query(
      `INSERT INTO attendance (worker_id, date, check_in, status)
       VALUES ($1, $2, NOW(), 'Present') RETURNING *`,
      [worker_id, today]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error checking in:', err);
    res.status(500).json({ error: 'Failed to check in' });
  }
};

// Check-out
const checkOut = async (req, res) => {
  try {
    const { worker_id } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `UPDATE attendance SET check_out = NOW() WHERE worker_id = $1 AND date = $2 RETURNING *`,
      [worker_id, today]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No check-in found for today' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error checking out:', err);
    res.status(500).json({ error: 'Failed to check out' });
  }
};

// Get attendance by date
const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT a.*, w.name, w.role
       FROM attendance a
       JOIN workers w ON a.worker_id = w.id
       WHERE a.date = $1
       ORDER BY w.name`,
      [targetDate]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

// Mark absent
const markAbsent = async (req, res) => {
  try {
    const { worker_id, date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `INSERT INTO attendance (worker_id, date, status)
       VALUES ($1, $2, 'Absent')
       ON CONFLICT DO NOTHING RETURNING *`,
      [worker_id, targetDate]
    );

    res.status(201).json(result.rows[0] || { message: 'Attendance already marked' });
  } catch (err) {
    console.error('Error marking absent:', err);
    res.status(500).json({ error: 'Failed to mark absent' });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getAttendanceByDate,
  markAbsent,
};
