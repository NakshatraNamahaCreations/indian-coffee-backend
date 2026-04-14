const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

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

const uploadDir = path.join(process.cwd(), "uploads/plans");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `plan-${Date.now()}${ext}`);
    },
});

const upload = multer({ storage, limits: { fileSize: 3 * 1024 * 1024 } });

router.post("/create", upload.single("planImage"), createPlan);
router.get("/all", getPlans);
router.get("/active", getActivePlans);
router.get("/active-farmer", getActiveFarmerPlans);
router.get("/active-trader", getActiveTraderPlans);
router.get("/getbyid/:id", getPlanById);
router.put("/update/:id", upload.single("planImage"), updatePlan);
router.delete("/delete/:id", deletePlan);

module.exports = router;
