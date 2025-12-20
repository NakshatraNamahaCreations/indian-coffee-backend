const express = require('express');
const router = express.Router();
const bidCtrl = require('../Controller/Bid');


router.post('/createbid', bidCtrl.createBid);

router.get('/:id', bidCtrl.getBidById);
router.get('/user/:userId/product/:productId', bidCtrl.getBidByUserAndProduct);
router.patch('/:id', bidCtrl.updateBid);
router.patch('/:id/status', bidCtrl.updateBidStatus);
router.delete('/:id', bidCtrl.deleteBid);
router.get('/user/:userId', bidCtrl.getBidsByUser);


module.exports = router;