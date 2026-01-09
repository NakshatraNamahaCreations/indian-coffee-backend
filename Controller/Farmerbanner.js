const Banner = require("../Modal/Farmerbanner");

exports.createBanner = async (req, res) => {
    try {
        let { title, description, imageUrl } = req.body;

        let banner = new Banner({
            title,
            description,
            imageUrl,
            status: "inactive"   // default status
        });

        await banner.save();

        res.status(201).json({
            success: true,
            data: banner
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


exports.getAllBanners = async (req, res) => {
    try {
        let banners = await Banner.find();
        res.status(200).json({ success: true, data: banners });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateBanner = async (req, res) => {
    try {
        let banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, data: banner });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteBanner = async (req, res) => {
    try {
        await Banner.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Banner deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        let banner = await Banner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ success: false, message: "Banner not found" });
        }

        banner.status = banner.status === "active" ? "inactive" : "active";
        await banner.save();

        res.status(200).json({ success: true, data: banner, message: `Status changed to ${banner.status}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getActiveBanners = async (req, res) => {
    try {
        let banners = await Banner.find({ status: "active" });
        res.status(200).json({ success: true, data: banners });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}; 