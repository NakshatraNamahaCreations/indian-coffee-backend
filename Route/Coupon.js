const router = require("express").Router();

const {
    createCoupon,
    getCoupons,
    getCouponById,
    updateCoupon,
    deleteCoupon,
} = require("../Controller/Coupon");

router.post("/create", createCoupon);
router.get("/all", getCoupons);
router.get("/getbyid/:id", getCouponById);
router.put("/update/:id", updateCoupon);
router.delete("/delete/:id", deleteCoupon);

module.exports = router;
