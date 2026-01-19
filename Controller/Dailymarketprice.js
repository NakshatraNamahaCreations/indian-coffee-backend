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


exports.getLatestAvailableHighestPriceAdmin = async (req, res) => {
    try {
        const now = new Date();

        const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
        const startOfTomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));

        const startOfYesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1, 0, 0, 0));
        const startOfTodayAgain = startOfToday;

        // ✅ For a date range, return max price for each (categoryName + dailycategoryName)
        const getMaxPerItemForRange = async (from, to) => {
            const result = await DailyMarketPrice.aggregate([
                {
                    $match: {
                        type: "admin",
                        date: { $gte: from, $lt: to },
                    },
                },
                { $unwind: "$categories" },
                { $unwind: "$categories.dailyCategories" },
                {
                    $project: {
                        date: 1,
                        categoryName: "$categories.categoryName",
                        dailycategoryName: "$categories.dailyCategories.dailycategoryName",
                        price: "$categories.dailyCategories.price",
                    },
                },

                // ✅ group by item, take max price
                {
                    $group: {
                        _id: {
                            categoryName: "$categoryName",
                            dailycategoryName: "$dailycategoryName",
                        },
                        maxPrice: { $max: "$price" },
                        date: { $first: "$date" },
                    },
                },

                // optional sorting
                { $sort: { maxPrice: -1 } },

                // cleaner output
                {
                    $project: {
                        _id: 0,
                        date: 1,
                        categoryName: "$_id.categoryName",
                        dailycategoryName: "$_id.dailycategoryName",
                        price: "$maxPrice",
                    },
                },
            ]);

            return result || [];
        };

        let usedDateRange = { from: startOfToday, to: startOfTomorrow };
        let data = await getMaxPerItemForRange(usedDateRange.from, usedDateRange.to);

        // ✅ If today not found -> yesterday
        if (!data.length) {
            usedDateRange = { from: startOfYesterday, to: startOfTodayAgain };
            data = await getMaxPerItemForRange(usedDateRange.from, usedDateRange.to);
        }

        // ✅ If yesterday not found -> latest date in DB
        if (!data.length) {
            const latestDoc = await DailyMarketPrice.findOne({ type: "admin" })
                .sort({ date: -1 })
                .select("date");

            if (!latestDoc?.date) {
                return res.status(200).json({
                    success: true,
                    message: "No data found",
                    usedDate: null,
                    data: [],
                });
            }

            const latestDate = new Date(latestDoc.date);
            const start = new Date(Date.UTC(latestDate.getUTCFullYear(), latestDate.getUTCMonth(), latestDate.getUTCDate(), 0, 0, 0));
            const end = new Date(Date.UTC(latestDate.getUTCFullYear(), latestDate.getUTCMonth(), latestDate.getUTCDate() + 1, 0, 0, 0));

            usedDateRange = { from: start, to: end };
            data = await getMaxPerItemForRange(start, end);
        }

        return res.status(200).json({
            success: true,
            usedDateFrom: usedDateRange.from,
            usedDateTo: usedDateRange.to,
            data, // ✅ array: max price per categoryName+dailycategoryName for that date
        });
    } catch (error) {
        console.error("getLatestAvailableHighestPriceAdmin Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

