const Coupon = require("../Modal/Coupon");

exports.createCoupon = async (req, res) => {
    try {
        const { couponName, couponCode, discount, description } = req.body;

        if (!couponName || !couponCode) {
            return res.status(400).json({
                success: false,
                message: "couponName and couponCode are required",
            });
        }

        const doc = await Coupon.create({
            couponName: String(couponName).trim(),
            couponCode: String(couponCode).trim().toUpperCase(),
            discount: Number(discount || 0),
            description: description ? String(description).trim() : "",
        });

        return res.status(201).json({
            success: true,
            message: "Coupon created",
            data: doc,
        });
    } catch (err) {
        if (String(err?.message || "").includes("duplicate key")) {
            return res.status(409).json({ success: false, message: "Coupon code already exists" });
        }
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.getCoupons = async (req, res) => {
    try {
        const docs = await Coupon.find().sort({ createdAt: -1 });
        return res.json({ success: true, data: docs });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.getCouponById = async (req, res) => {
    try {
        const doc = await Coupon.findById(req.params.id);
        if (!doc) return res.status(404).json({ success: false, message: "Coupon not found" });
        return res.json({ success: true, data: doc });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const { couponName, couponCode, discount, description } = req.body;

        const doc = await Coupon.findById(id);
        if (!doc) return res.status(404).json({ success: false, message: "Coupon not found" });

        if (couponName != null) doc.couponName = String(couponName).trim();
        if (couponCode != null) doc.couponCode = String(couponCode).trim().toUpperCase();
        if (discount != null) doc.discount = Number(discount || 0);
        if (description != null) doc.description = String(description).trim();

        await doc.save();

        return res.json({
            success: true,
            message: "Coupon updated",
            data: doc,
        });
    } catch (err) {
        if (String(err?.message || "").includes("duplicate key")) {
            return res.status(409).json({ success: false, message: "Coupon code already exists" });
        }
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteCoupon = async (req, res) => {
    try {
        const doc = await Coupon.findById(req.params.id);
        if (!doc) return res.status(404).json({ success: false, message: "Coupon not found" });

        await Coupon.deleteOne({ _id: doc._id });

        return res.json({ success: true, message: "Coupon deleted" });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
