// models/DailyMarketCategory.js
const mongoose = require("mongoose");

const dailyMarketCategorySchema = new mongoose.Schema(
    {
        categoryName: {
            type: String,
            required: true,
            trim: true,
        },
        dailycategoryName: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model(
    "DailyMarketCategory",
    dailyMarketCategorySchema
);
