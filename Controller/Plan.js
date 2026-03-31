const Plan = require("../Modal/Plan");
const fs = require("fs");

const deleteFile = (filePath) => {
    try {
        if (!filePath) return;
        const localPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    } catch (e) { }
};

exports.createPlan = async (req, res) => {
    try {
        const { planName, planDescription, count, subscriptionAdded, price, durationDays, isActive } = req.body;

        if (!planName) {
            return res.status(400).json({ success: false, message: "planName is required" });
        }

        const planImage = req.file ? `/${req.file.path.replace(/\\/g, "/")}` : "";

        const plan = await Plan.create({
            planName,
            planDescription: planDescription || "",
            count: Number(count || 0),
            subscriptionAdded: String(subscriptionAdded) === "true",
            price: Number(price || 0),
            durationDays: Number(durationDays || 30),
            isActive: isActive == null ? true : String(isActive) === "true",
            planImage,
        });

        return res.status(201).json({ success: true, message: "Plan created", data: plan });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.getPlans = async (req, res) => {
    try {
        const plans = await Plan.find().sort({ createdAt: -1 });
        return res.json({ success: true, data: plans });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.getPlanById = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);
        if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

        return res.json({ success: true, data: plan });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.updatePlan = async (req, res) => {
    try {
        const { id } = req.params;

        const oldPlan = await Plan.findById(id);
        if (!oldPlan) return res.status(404).json({ success: false, message: "Plan not found" });

        const {
            planName,
            planDescription,
            count,
            subscriptionAdded,
            price,
            durationDays,
            isActive,
            removeImage,
        } = req.body;

        if (req.file) {
            deleteFile(oldPlan.planImage);
            oldPlan.planImage = `/${req.file.path.replace(/\\/g, "/")}`;
        } else if (String(removeImage) === "true") {
            deleteFile(oldPlan.planImage);
            oldPlan.planImage = "";
        }

        if (planName != null) oldPlan.planName = planName;
        if (planDescription != null) oldPlan.planDescription = planDescription;
        if (count != null) oldPlan.count = Number(count || 0);
        if (subscriptionAdded != null) oldPlan.subscriptionAdded = String(subscriptionAdded) === "true";
        if (price != null) oldPlan.price = Number(price || 0);
        if (durationDays != null) oldPlan.durationDays = Number(durationDays || 30);
        if (isActive != null) oldPlan.isActive = String(isActive) === "true";

        await oldPlan.save();

        return res.json({ success: true, message: "Plan updated", data: oldPlan });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.deletePlan = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);
        if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

        deleteFile(plan.planImage);
        await Plan.deleteOne({ _id: plan._id });

        return res.json({ success: true, message: "Plan deleted" });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.getActivePlans = async (req, res) => {
    try {
        const plans = await Plan.find({ isActive: true }).sort({ price: 1 });
        return res.json({ success: true, data: plans });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
