const express = require('express');
const router = express.Router();
const { addUser, getUsers, updateUser, deleteUser } = require('../controllers/users');

router.post('/', addUser);
router.get('/', getUsers);
router.get('/:id', updateUser);
router.get('/:id', deleteUser);

module.exports = router;