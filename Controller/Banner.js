const Banner = require("../Modal/Banner");
const { deleteFromCloudinary } = require("../utils/cloudinaryConfig");

// CREATE
exports.createBanner = async (req, res) => {
    try {
        const { title, description, videoUrl } = req.body;

        const banner = new Banner({
            title:       title || "",
            description: description || "",
            imageUrl:    req.file ? req.file.path : undefined,
            videoUrl:    videoUrl || "",
            status:      "inactive",
        });

        await banner.save();
        return res.status(201).json({ success: true, data: banner });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// GET ALL
exports.getAllBanners = async (req, res) => {
    try {
        const banners = await Banner.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: banners });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// UPDATE
exports.updateBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) return res.status(404).json({ success: false, message: "Banner not found" });

        if (req.body.title       !== undefined) banner.title       = req.body.title;
        if (req.body.description !== undefined) banner.description = req.body.description;
        if (req.body.videoUrl    !== undefined) banner.videoUrl    = req.body.videoUrl;

        if (req.file) {
            await deleteFromCloudinary(banner.imageUrl, "image");
            banner.imageUrl = req.file.path;
        }

        await banner.save();
        return res.status(200).json({ success: true, data: banner });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE
exports.deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) return res.status(404).json({ success: false, message: "Banner not found" });

        await deleteFromCloudinary(banner.imageUrl, "image");
        await Banner.findByIdAndDelete(req.params.id);
        return res.status(200).json({ success: true, message: "Banner deleted" });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// TOGGLE STATUS
exports.updateStatus = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) return res.status(404).json({ success: false, message: "Banner not found" });

        banner.status = banner.status === "active" ? "inactive" : "active";
        await banner.save();

        return res.status(200).json({
            success: true,
            data:    banner,
            message: `Status changed to ${banner.status}`,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ACTIVE ONLY
exports.getActiveBanners = async (req, res) => {
    try {
        const banners = await Banner.find({ status: "active" }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: banners });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
