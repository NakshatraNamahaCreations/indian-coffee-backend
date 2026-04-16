const express = require("express");
const router = express.Router();
const { verifyGst } = require("../Controller/GstVerification");

router.post("/verify", verifyGst);

module.exports = router;
