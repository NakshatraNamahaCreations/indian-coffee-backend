const express = require('express');
const router = express.Router();
const {
    fetchuserIDnotification,
    fetchmarknotification,
    getAllNotifications
} = require('../Controller/Notification');

router.get("/fetch-admin-notifications/:userId", fetchuserIDnotification);
router.patch("/mark-notification-read/:notificationId", fetchmarknotification);
router.get("/all", getAllNotifications);

module.exports = router;