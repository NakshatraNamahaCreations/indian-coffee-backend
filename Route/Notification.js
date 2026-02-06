const express = require('express');
const router = express.Router();
const {
    fetchuserIDnotification
} = require('../Controller/Notification');

router.get("/fetch-admin-notifications/:userId", fetchuserIDnotification);


module.exports = router;