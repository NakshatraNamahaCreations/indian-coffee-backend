const express = require('express');
const router = express.Router();
const {
    fetchuserIDnotification,
    fetchmarknotification
} = require('../Controller/Notification');

router.get("/fetch-admin-notifications/:userId", fetchuserIDnotification);
router.patch("/mark-notification-read/:notificationId", fetchmarknotification);


module.exports = router;