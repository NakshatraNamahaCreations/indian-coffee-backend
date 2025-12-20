const DailyMarketPrice = require("../Modal/Dailymarketprice");

exports.createDailyMarketPrice = async (req, res) => {
    try {
        const { date, userId, username, categories, type } = req.body;

        if (!date || !categories || categories.length === 0) {
            return res.status(400).json({
                message: "Date and categories required",
            });
        }

        const data = new DailyMarketPrice({
            date,
            userId,
            username,
            categories,
            type
        });

        await data.save();

        res.status(201).json({
            success: true,
            message: "Daily market prices saved",
            data,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllDailyMarketPrices = async (req, res) => {
    const data = await DailyMarketPrice.find().sort({ date: -1 });
    res.json({ success: true, data });
};

exports.getAllDailyMarketPricesAdmin = async (req, res) => {
    try {
        const data = await DailyMarketPrice.find({ type: "admin" })
            .sort({ date: -1 });

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("Get Daily Market Price Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
