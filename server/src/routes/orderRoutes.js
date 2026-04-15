const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getActiveOrders,
  getOrder,
  updateOrderStatus,
  billOrder,
} = require('../controllers/orderController');

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/active', getActiveOrders);
router.get('/:orderId', getOrder);
router.patch('/:orderId/status', updateOrderStatus);
router.post('/:orderId/bill', billOrder);

module.exports = router;
