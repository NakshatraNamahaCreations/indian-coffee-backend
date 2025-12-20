const mongoose = require("mongoose");

const weightUnitSchema = new mongoose.Schema(
    {
        weightUnitName: {
            type: String,
            required: true,
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("WeightUnit", weightUnitSchema);
