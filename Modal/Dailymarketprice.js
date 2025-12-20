const mongoose = require("mongoose");

const DailyCategorySchema = new mongoose.Schema({
    dailycategoryName: String,
    price: Number,
});

const CategorySchema = new mongoose.Schema({
    categoryName: String,
    dailyCategories: [DailyCategorySchema],
});

const DailyMarketPriceSchema = new mongoose.Schema(
    {
        date: {
            type: Date,
            required: true,
        },
        userId: String,
        username: String,
        categories: [CategorySchema],
        type: String
    },
    { timestamps: true }
);

module.exports = mongoose.model(
    "DailyMarketPrice",
    DailyMarketPriceSchema
);
