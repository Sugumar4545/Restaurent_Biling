const express = require('express');
const router = express.Router();
const {
  getDailySales,
  getTopSellingItems,
  getSalesByCategory,
  getHourlySales,
} = require('../controllers/reportController');

router.get('/daily-sales', getDailySales);
router.get('/top-selling', getTopSellingItems);
router.get('/by-category', getSalesByCategory);
router.get('/hourly', getHourlySales);

module.exports = router;
