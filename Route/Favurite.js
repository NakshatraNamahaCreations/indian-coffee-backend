const express = require('express');
const router = express.Router();
const {
    addToFavorites,
    removeFromFavorites,
    getUserFavorites,
    checkFavoriteStatus
} = require('../Controller/Favurite');

router.post('/addfavorites', addToFavorites);
router.delete('/favorites/:productId', removeFromFavorites);
router.get('/getfavorites/:userId', getUserFavorites);
router.get("/check-favorite", checkFavoriteStatus);

module.exports = router;