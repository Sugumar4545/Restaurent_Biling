const express = require('express');
const router = express.Router();
const {
  getWorkers,
  getWorker,
  createWorker,
  updateWorker,
  deleteWorker,
} = require('../controllers/workerController');

router.get('/', getWorkers);
router.get('/:id', getWorker);
router.post('/', createWorker);
router.put('/:id', updateWorker);
router.delete('/:id', deleteWorker);

module.exports = router;
