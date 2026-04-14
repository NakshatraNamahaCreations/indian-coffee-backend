
const fs = require("fs");
const path = require("path");
const Banner = require("../Modal/Farmerbanner");

// ✅ CREATE
exports.createBanner = async (req, res) => {
    try {
        const { title, description, videoUrl } = req.body;

        const banner = new Banner({
            title,
            description,
            imageUrl: req.file ? req.file.path : undefined,  // ✅ Cloudinary URL
            videoUrl: videoUrl || "",
            status: "inactive",
        });

        await banner.save();

        return res.status(201).json({ success: true, data: banner });
    } catch (err) {
        console.error("❌ Farmerbanner createBanner error:", err);  // ✅ Log error
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ✅ GET ALL
exports.getAllBanners = async (req, res) => {
    try {
        const banners = await Banner.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: banners });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ✅ UPDATE (title/description + optionally replace image)
exports.updateBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ success: false, message: "Banner not found" });
        }

        // update fields
        if (typeof req.body.title !== "undefined") banner.title = req.body.title;
        if (typeof req.body.description !== "undefined") banner.description = req.body.description;
        if (typeof req.body.videoUrl !== "undefined") banner.videoUrl = req.body.videoUrl;

        // if new file uploaded => file is on Cloudinary (no local deletion)
        if (req.file) {
            banner.imageUrl = req.file.path;  // ✅ Cloudinary URL
        }

        await banner.save();

        return res.status(200).json({ success: true, data: banner });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ✅ DELETE (file is on Cloudinary — no local deletion needed)
exports.deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ success: false, message: "Banner not found" });
        }

        // ✅ File deletion is handled by Cloudinary — just remove the DB record
        await Banner.findByIdAndDelete(req.params.id);

        return res.status(200).json({ success: true, message: "Banner deleted" });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ✅ TOGGLE STATUS
exports.updateStatus = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ success: false, message: "Banner not found" });
        }

        banner.status = banner.status === "active" ? "inactive" : "active";
        await banner.save();

        return res.status(200).json({
            success: true,
            data: banner,
            message: `Status changed to ${banner.status}`,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ✅ ACTIVE ONLY
exports.getActiveBanners = async (req, res) => {
    try {
        const banners = await Banner.find({ status: "active" }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: banners });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
