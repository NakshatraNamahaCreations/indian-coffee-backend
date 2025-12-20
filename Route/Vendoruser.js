const express = require("express");
const router = express.Router();
const vendorController = require("../Controller/Vendoruser");

router.post("/createvendor", vendorController.createVendor);
router.get("/allvendor", vendorController.getVendors);
router.get("/getbyvendor/:id", vendorController.getVendorById);
router.put("/updatevendor/:id", vendorController.updateVendor);
router.delete("/deletevendor/:id", vendorController.deleteVendor);
router.post("/vendorlogin", vendorController.loginVendor)

module.exports = router;
