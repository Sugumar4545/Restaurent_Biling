const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  getCategories,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateStock,
} = require('../controllers/menuController');

router.get('/', getMenuItems);
router.get('/categories', getCategories);
router.get('/:id', getMenuItem);
router.post('/', createMenuItem);
router.put('/:id', updateMenuItem);
router.delete('/:id', deleteMenuItem);
router.patch('/:id/stock', updateStock);

module.exports = router;
