const express = require('express');
const { getLists, createList, updateListItems, deleteList } = require('../controllers/listController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Protect all list routes

router.route('/')
  .get(getLists)
  .post(createList);

router.route('/:id/items')
  .put(updateListItems);

router.route('/:id')
  .delete(deleteList);

module.exports = router;
