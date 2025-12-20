const WeightUnit = require("../Modal/Weightunit");

exports.createWeightUnit = async (req, res) => {
    try {
        const { weightUnitName } = req.body;

        if (!weightUnitName) {
            return res.status(400).json({ success: false, message: "Weight unit name is required" });
        }

        const unit = new WeightUnit({ weightUnitName });
        await unit.save();

        res.status(201).json({ success: true, data: unit });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getAllWeightUnits = async (req, res) => {
    try {
        const units = await WeightUnit.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: units });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateWeightUnit = async (req, res) => {
    try {
        const { weightUnitName } = req.body;

        const unit = await WeightUnit.findByIdAndUpdate(
            req.params.id,
            { weightUnitName },
            { new: true }
        );

        res.status(200).json({ success: true, data: unit });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteWeightUnit = async (req, res) => {
    try {
        await WeightUnit.findByIdAndDelete(req.params.id);

        res.status(200).json({ success: true, message: "Weight unit deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
