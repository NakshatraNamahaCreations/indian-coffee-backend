// // Controller/Banner.js
// const fs = require("fs");
// const path = require("path");
// const Banner = require("../Modal/Banner");

// // ✅ CREATE
// exports.createBanner = async (req, res) => {
//     try {
//         const { title, description } = req.body;

//         const banner = new Banner({
//             title,
//             description,
//             imageUrl: req.file ? `/uploads/banners/${req.file.filename}` : undefined,
//             status: "inactive",
//         });

//         await banner.save();

//         return res.status(201).json({ success: true, data: banner });
//     } catch (err) {
//         return res.status(500).json({ success: false, message: err.message });
//     }
// };

// // ✅ GET ALL
// exports.getAllBanners = async (req, res) => {
//     try {
//         const banners = await Banner.find().sort({ createdAt: -1 });
//         return res.status(200).json({ success: true, data: banners });
//     } catch (err) {
//         return res.status(500).json({ success: false, message: err.message });
//     }
// };

// // ✅ UPDATE (title/description + optionally replace image)
// exports.updateBanner = async (req, res) => {
//     try {
//         const banner = await Banner.findById(req.params.id);
//         if (!banner) {
//             return res.status(404).json({ success: false, message: "Banner not found" });
//         }

//         // update fields
//         if (typeof req.body.title !== "undefined") banner.title = req.body.title;
//         if (typeof req.body.description !== "undefined") banner.description = req.body.description;

//         // if new file uploaded => delete old file + save new path
//         if (req.file) {
//             if (banner.imageUrl) {
//                 const oldPath = path.join(process.cwd(), banner.imageUrl.replace(/^\//, "")); // remove leading /
//                 if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
//             }
//             banner.imageUrl = `/uploads/banners/${req.file.filename}`;
//         }

//         await banner.save();

//         return res.status(200).json({ success: true, data: banner });
//     } catch (err) {
//         return res.status(500).json({ success: false, message: err.message });
//     }
// };

// // ✅ DELETE (also delete file)
// exports.deleteBanner = async (req, res) => {
//     try {
//         const banner = await Banner.findById(req.params.id);
//         if (!banner) {
//             return res.status(404).json({ success: false, message: "Banner not found" });
//         }

//         if (banner.image) {
//             const filePath = path.join(process.cwd(), banner.image.replace(/^\//, ""));
//             if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//         }

//         await Banner.findByIdAndDelete(req.params.id);

//         return res.status(200).json({ success: true, message: "Banner deleted" });
//     } catch (err) {
//         return res.status(500).json({ success: false, message: err.message });
//     }
// };

// // ✅ TOGGLE STATUS
// exports.updateStatus = async (req, res) => {
//     try {
//         const banner = await Banner.findById(req.params.id);
//         if (!banner) {
//             return res.status(404).json({ success: false, message: "Banner not found" });
//         }

//         banner.status = banner.status === "active" ? "inactive" : "active";
//         await banner.save();

//         return res.status(200).json({
//             success: true,
//             data: banner,
//             message: `Status changed to ${banner.status}`,
//         });
//     } catch (err) {
//         return res.status(500).json({ success: false, message: err.message });
//     }
// };

// // ✅ ACTIVE ONLY
// exports.getActiveBanners = async (req, res) => {
//     try {
//         const banners = await Banner.find({ status: "active" }).sort({ createdAt: -1 });
//         return res.status(200).json({ success: true, data: banners });
//     } catch (err) {
//         return res.status(500).json({ success: false, message: err.message });
//     }
// };



// Controller/Banner.js
const fs = require("fs");
const path = require("path");
const Banner = require("../Modal/Banner");

function safeUnlink(filePath) {
    try {
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) { }
}

// ✅ CREATE
exports.createBanner = async (req, res) => {
    try {
        const { title, description } = req.body;

        // ✅ If image is required, keep this. Otherwise remove it.
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Banner image is required. Field name must be 'image'.",
            });
        }

        const banner = new Banner({
            title: title || "",
            description: description || "",
            imageUrl: `/uploads/banners/${req.file.filename}`,
            status: "inactive",
        });

        await banner.save();

        return res.status(201).json({ success: true, data: banner });
    } catch (err) {
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

        if (typeof req.body.title !== "undefined") banner.title = req.body.title;
        if (typeof req.body.description !== "undefined") banner.description = req.body.description;

        if (req.file) {
            // ✅ delete old image
            if (banner.imageUrl) {
                const oldAbsPath = path.join(process.cwd(), banner.imageUrl.replace(/^\//, ""));
                safeUnlink(oldAbsPath);
            }
            banner.imageUrl = `/uploads/banners/${req.file.filename}`;
        }

        await banner.save();
        return res.status(200).json({ success: true, data: banner });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ✅ DELETE (also delete file)
exports.deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ success: false, message: "Banner not found" });
        }

        // ✅ FIX: use imageUrl (not banner.image)
        if (banner.imageUrl) {
            const fileAbsPath = path.join(process.cwd(), banner.imageUrl.replace(/^\//, ""));
            safeUnlink(fileAbsPath);
        }

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

