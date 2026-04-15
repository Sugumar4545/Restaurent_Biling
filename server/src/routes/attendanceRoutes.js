const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getAttendanceByDate,
  markAbsent,
} = require('../controllers/attendanceController');

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/', getAttendanceByDate);
router.post('/absent', markAbsent);

module.exports = router;
