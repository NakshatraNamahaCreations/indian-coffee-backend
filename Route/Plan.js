const router = require("express").Router();
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
} = require("../Controller/Plan");


const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "uploads/plans";
        ensureDir(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `plan-${Date.now()}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 3 * 1024 * 1024 },
});

router.post("/create", upload.single("planImage"), createPlan);
router.get("/all", getPlans);
router.get("/active", getActivePlans);
router.get("/getbyid/:id", getPlanById);
router.put("/update/:id", upload.single("planImage"), updatePlan);
router.delete("/delete/:id", deletePlan);

module.exports = router;
