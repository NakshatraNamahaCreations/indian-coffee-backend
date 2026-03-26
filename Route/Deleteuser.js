const express = require('express');
const router = express.Router();

const {
    createUser,
    getUsers,
    getUser,
    updateUser,
    deleteUser
} = require('../Controller/Deleteuser');

router.post('/creteuser', createUser);
router.get('/all', getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;