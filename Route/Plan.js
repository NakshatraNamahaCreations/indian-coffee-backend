const express = require("express");
const router = express.Router();
const { createUploader } = require("../utils/cloudinaryConfig");

const {
    createPlan,
    getPlans,
    getPlanById,
    updatePlan,
    deletePlan,
    getActivePlans,
    getActiveFarmerPlans,
    getActiveTraderPlans,
} = require("../Controller/Plan");

const upload = createUploader("indian_coffee/plans", "image", 3 * 1024 * 1024);

router.post("/create", upload.single("planImage"), createPlan);
router.get("/all", getPlans);
router.get("/active", getActivePlans);
router.get("/active-farmer", getActiveFarmerPlans);
router.get("/active-trader", getActiveTraderPlans);
router.get("/getbyid/:id", getPlanById);
router.put("/update/:id", upload.single("planImage"), updatePlan);
router.delete("/delete/:id", deletePlan);

module.exports = router;
