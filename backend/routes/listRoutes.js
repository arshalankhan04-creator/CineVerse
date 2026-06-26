const express = require('express');
const { 
  getLists, 
  createList, 
  updateListItems, 
  deleteList,
  getPublicList,
  updateListDetails
} = require('../controllers/listController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes (auth bypassed)
router.get('/public/:id', getPublicList);

// Protected routes
router.use(protect);

router.route('/')
  .get(getLists)
  .post(createList);

router.route('/:id/items')
  .put(updateListItems);

router.route('/:id')
  .put(updateListDetails)
  .delete(deleteList);

module.exports = router;
