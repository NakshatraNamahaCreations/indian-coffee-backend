const express = require("express");
const router = express.Router();
const controller = require("../Controller/Dailymarketprice");

router.post("/create", controller.createDailyMarketPrice);
router.get("/getall", controller.getAllDailyMarketPrices);
router.get("/getalladmin", controller.getAllDailyMarketPricesAdmin);


module.exports = router;
