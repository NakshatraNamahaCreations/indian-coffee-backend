const router = require("express").Router();
const { createCloudinaryUploader } = require("../utils/cloudinaryConfig");

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

// ✅ Cloudinary-backed multer uploader
const upload = createCloudinaryUploader(
    "plans",          // folder
    "image",          // resource_type
    undefined,        // allow all image formats
    3 * 1024 * 1024   // 3MB limit
);

router.post("/create", upload.single("planImage"), createPlan);
router.get("/all", getPlans);
router.get("/active", getActivePlans);
router.get("/active-farmer", getActiveFarmerPlans);
router.get("/active-trader", getActiveTraderPlans);
router.get("/getbyid/:id", getPlanById);
router.put("/update/:id", upload.single("planImage"), updatePlan);
router.delete("/delete/:id", deletePlan);

module.exports = router;
