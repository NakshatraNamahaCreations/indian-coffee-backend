const express = require("express");
const router = express.Router();
const controller = require("../Controller/Weightunit");

router.post("/createweightunit", controller.createWeightUnit);
router.get("/getallweightunits", controller.getAllWeightUnits);
router.put("/updateweightunit/:id", controller.updateWeightUnit);
router.delete("/deleteweightunit/:id", controller.deleteWeightUnit);

module.exports = router;
