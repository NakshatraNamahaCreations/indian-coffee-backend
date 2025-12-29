const Payment = require("../Modal/Payment");

exports.createPayment = async (req, res) => {
    try {
        const payment = await Payment.create(req.body);
        res.status(201).json({ success: true, data: payment });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .sort({ createdAt: -1 })
            .populate("userId", "firstName email")
            .populate("productId", "productTitle");

        res.status(200).json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate("userId", "firstName email")
            .populate("productId", "productTitle");

        if (!payment) {
            return res.status(404).json({ success: false, error: "Payment not found" });
        }

        res.status(200).json({ success: true, data: payment });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getPaymentsByUserId = async (req, res) => {
    try {
        const payments = await Payment.find({ userId: req.params.userId })
            .sort({ createdAt: -1 })
            .populate("productId", "productTitle");

        res.status(200).json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updatePayment = async (req, res) => {
    try {
        const payment = await Payment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!payment) {
            return res.status(404).json({ success: false, error: "Payment not found" });
        }

        res.status(200).json({ success: true, data: payment });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deletePayment = async (req, res) => {
    try {
        const payment = await Payment.findByIdAndDelete(req.params.id);

        if (!payment) {
            return res.status(404).json({ success: false, error: "Payment not found" });
        }

        res.status(200).json({ success: true, message: "Payment deleted" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
