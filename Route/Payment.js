const express = require("express");
const router = express.Router();
const paymentCtrl = require("../Controller/Payment");

router.post("/createpayment", paymentCtrl.createPayment);
router.get("/getallpayment", paymentCtrl.getAllPayments);
router.get("/getbyid/:id", paymentCtrl.getPaymentById);
router.get("/userpayment/:userId", paymentCtrl.getPaymentsByUserId);
router.put("/updatepayment/:id", paymentCtrl.updatePayment);
router.delete("/deletepayment/:id", paymentCtrl.deletePayment);

module.exports = router;
