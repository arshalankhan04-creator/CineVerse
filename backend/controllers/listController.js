const CustomList = require('../models/CustomList');

// @desc    Get user lists
// @route   GET /api/lists
// @access  Private
exports.getLists = async (req, res) => {
  try {
    const lists = await CustomList.find({ user: req.user.id }).sort('-createdAt');
    res.status(200).json({
      success: true,
      data: lists
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc    Create new list
// @route   POST /api/lists
// @access  Private
exports.createList = async (req, res) => {
  try {
    req.body.user = req.user.id;
    const list = await CustomList.create(req.body);
    res.status(201).json({
      success: true,
      data: list
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// @desc    Update list items (add/remove)
// @route   PUT /api/lists/:id/items
// @access  Private
exports.updateListItems = async (req, res) => {
  try {
    const list = await CustomList.findOne({ _id: req.params.id, user: req.user.id });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    const { item, action } = req.body; // action can be 'add' or 'remove'

    if (action === 'add') {
      // Check if item already exists
      const exists = list.items.some(i => i.tmdbId === item.tmdbId);
      if (!exists) {
        list.items.push(item);
      }
    } else if (action === 'remove') {
      list.items = list.items.filter(i => i.tmdbId !== item.tmdbId);
    }

    await list.save();

    res.status(200).json({
      success: true,
      data: list
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// @desc    Delete list
// @route   DELETE /api/lists/:id
// @access  Private
exports.deleteList = async (req, res) => {
  try {
    const list = await CustomList.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
