const DailyMarketPrice = require("../Modal/Dailymarketprice");
const mongoose = require("mongoose");
const Trader = require("../Modal/Trader");

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

exports.getDailyMarketPricesByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const data = await DailyMarketPrice.find({ userId }).sort({ date: -1 });

        return res.json({ success: true, data });
    } catch (err) {
        console.error("getDailyMarketPricesByUser error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch daily market prices",
        });
    }
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

        const startOfToday = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
        );
        const startOfTomorrow = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
        );

        const startOfYesterday = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1, 0, 0, 0)
        );
        const startOfTodayAgain = startOfToday;

        const getMaxPerItemForRange = async (from, to) => {
            return await DailyMarketPrice.aggregate([
                // ✅ your data is type: "admin"
                { $match: { type: "admin", date: { $gte: from, $lt: to } } },

                { $unwind: "$categories" },
                { $unwind: "$categories.dailyCategories" },

                {
                    $project: {
                        date: 1,
                        categoryName: "$categories.categoryName",
                        dailycategoryName: "$categories.dailyCategories.dailycategoryName",
                        price: "$categories.dailyCategories.price",

                        // ✅ THIS IS YOUR TRADER ID (string)
                        userId: "$userId",
                    },
                },

                // ✅ sort so winner per item is first
                { $sort: { price: -1, date: -1 } },

                {
                    $group: {
                        _id: {
                            categoryName: "$categoryName",
                            dailycategoryName: "$dailycategoryName",
                        },
                        price: { $first: "$price" },
                        date: { $first: "$date" },
                        userId: { $first: "$userId" }, // ✅ winning trader userId
                    },
                },

                // ✅ convert string userId -> ObjectId for lookup
                {
                    $addFields: {
                        userObjId: {
                            $convert: {
                                input: "$userId",
                                to: "objectId",
                                onError: null,
                                onNull: null,
                            },
                        },
                    },
                },

                // ✅ fetch trader full data
                {
                    $lookup: {
                        from: "traders", // collection name (check: most likely "traders")
                        localField: "userObjId",
                        foreignField: "_id",
                        as: "trader",
                    },
                },

                // ✅ compute correct display name:
                // company => businessName
                // individual => firstName + lastName
                {
                    $addFields: {
                        trader: { $arrayElemAt: ["$trader", 0] },
                    },
                },
                {
                    $addFields: {
                        traderDisplayName: {
                            $cond: [
                                { $eq: ["$trader.userType", "company"] },
                                "$trader.businessName",
                                {
                                    $trim: {
                                        input: {
                                            $concat: [
                                                { $ifNull: ["$trader.firstName", ""] },
                                                " ",
                                                { $ifNull: ["$trader.lastName", ""] },
                                            ],
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },

                // ✅ final shape (NO traderId, only trader object)
                {
                    $project: {
                        _id: 0,
                        date: 1,
                        categoryName: "$_id.categoryName",
                        dailycategoryName: "$_id.dailycategoryName",
                        price: 1,

                        traderDisplayName: 1,

                        trader: {
                            _id: "$trader._id",
                            userType: "$trader.userType",
                            email: "$trader.email",
                            mobileNumber: "$trader.mobileNumber",
                            country: "$trader.country",
                            state: "$trader.state",
                            district: "$trader.district",
                            townVillage: "$trader.townVillage",
                            pincode: "$trader.pincode",
                            address: "$trader.address",
                            businessName: "$trader.businessName",
                            firstName: "$trader.firstName",
                            lastName: "$trader.lastName",
                            gstNumber: "$trader.gstNumber",
                            status: "$trader.status",
                            createdAt: "$trader.createdAt",
                            updatedAt: "$trader.updatedAt",
                        },
                    },
                },

                { $sort: { price: -1 } },
            ]);
        };

        // ✅ 1) choose latest available date (today → yesterday → latest)
        let usedFrom = startOfToday;
        let usedTo = startOfTomorrow;

        let todayList = await getMaxPerItemForRange(usedFrom, usedTo);

        if (!todayList.length) {
            usedFrom = startOfYesterday;
            usedTo = startOfTodayAgain;
            todayList = await getMaxPerItemForRange(usedFrom, usedTo);
        }

        if (!todayList.length) {
            const latestDoc = await DailyMarketPrice.findOne({ type: "admin" })
                .sort({ date: -1 })
                .select("date");

            if (!latestDoc?.date) {
                return res.status(200).json({
                    success: true,
                    usedDateFrom: null,
                    usedDateTo: null,
                    previousDateFrom: null,
                    previousDateTo: null,
                    todayData: [],
                    previousData: [],
                });
            }

            const d = new Date(latestDoc.date);
            usedFrom = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
            usedTo = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0));
            todayList = await getMaxPerItemForRange(usedFrom, usedTo);
        }

        // ✅ 2) find previous available date BEFORE usedFrom
        const prevDoc = await DailyMarketPrice.findOne({
            type: "admin",
            date: { $lt: usedFrom },
        })
            .sort({ date: -1 })
            .select("date");

        let prevFrom = null;
        let prevTo = null;
        let prevList = [];

        if (prevDoc?.date) {
            const pd = new Date(prevDoc.date);
            prevFrom = new Date(Date.UTC(pd.getUTCFullYear(), pd.getUTCMonth(), pd.getUTCDate(), 0, 0, 0));
            prevTo = new Date(Date.UTC(pd.getUTCFullYear(), pd.getUTCMonth(), pd.getUTCDate() + 1, 0, 0, 0));
            prevList = await getMaxPerItemForRange(prevFrom, prevTo);
        }

        return res.status(200).json({
            success: true,
            usedDateFrom: usedFrom,
            usedDateTo: usedTo,
            previousDateFrom: prevFrom,
            previousDateTo: prevTo,
            todayData: todayList,
            previousData: prevList,
        });
    } catch (error) {
        console.error("getLatestPricesWithChangeAdmin Error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.getLatestAvailableHighestPriceByUserParam = async (req, res) => {
    try {
        const userId = req.params?.userId;

        if (!userId) {
            return res
                .status(400)
                .json({ success: false, message: "userId is required in params" });
        }


        const canBeObjectId = mongoose.Types.ObjectId.isValid(userId);
        const userObjectId = canBeObjectId ? new mongoose.Types.ObjectId(userId) : null;

        const userMatch = canBeObjectId
            ? { $or: [{ userId: userId }, { userId: userObjectId }] }
            : { userId: userId };

        const now = new Date();

        const startOfToday = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
        );
        const startOfTomorrow = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
        );

        const startOfYesterday = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1, 0, 0, 0)
        );

        const getMaxPerItemForRange = async (from, to) => {
            try {
                return await DailyMarketPrice.aggregate([
                    {
                        $match: {
                            ...userMatch,

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
                    { $sort: { maxPrice: -1 } },
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
            } catch (err) {
                console.log("getMaxPerItemForRange error:", err);
                return [];
            }
        };

        let usedFrom = startOfToday;
        let usedTo = startOfTomorrow;

        let todayList = await getMaxPerItemForRange(usedFrom, usedTo);

        if (!todayList.length) {
            usedFrom = startOfYesterday;
            usedTo = startOfToday;
            todayList = await getMaxPerItemForRange(usedFrom, usedTo);
        }

        if (!todayList.length) {
            const latestDoc = await DailyMarketPrice.findOne({
                ...userMatch,
            })
                .sort({ date: -1 })
                .select("date");

            if (!latestDoc?.date) {
                return res.status(200).json({
                    success: true,
                    usedDateFrom: null,
                    usedDateTo: null,
                    previousDateFrom: null,
                    previousDateTo: null,
                    todayData: [],
                    previousData: [],
                    todayDataWithChange: [],
                });
            }

            const d = new Date(latestDoc.date);
            usedFrom = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
            usedTo = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0));

            todayList = await getMaxPerItemForRange(usedFrom, usedTo);
        }

        const prevDoc = await DailyMarketPrice.findOne({
            ...userMatch,
            date: { $lt: usedFrom },
        })
            .sort({ date: -1 })
            .select("date");

        let prevFrom = null;
        let prevTo = null;
        let prevList = [];

        if (prevDoc?.date) {
            const pd = new Date(prevDoc.date);
            prevFrom = new Date(Date.UTC(pd.getUTCFullYear(), pd.getUTCMonth(), pd.getUTCDate(), 0, 0, 0));
            prevTo = new Date(Date.UTC(pd.getUTCFullYear(), pd.getUTCMonth(), pd.getUTCDate() + 1, 0, 0, 0));

            prevList = await getMaxPerItemForRange(prevFrom, prevTo);
        }

        const prevMap = new Map();
        (prevList || []).forEach((x) => {
            const key = `${x.categoryName}||${x.dailycategoryName}`;
            prevMap.set(key, Number(x.price));
        });

        const todayDataWithChange = (todayList || []).map((x) => {
            const key = `${x.categoryName}||${x.dailycategoryName}`;
            const prevPrice = prevMap.has(key) ? prevMap.get(key) : null;

            let change = null;
            let changeType = "new";

            if (prevPrice !== null) {
                change = Number(x.price) - Number(prevPrice);
                if (change > 0) changeType = "up";
                else if (change < 0) changeType = "down";
                else changeType = "same";
            }

            return {
                ...x,
                previousPrice: prevPrice,
                change,
                changeType,
            };
        });

        return res.status(200).json({
            success: true,
            usedDateFrom: usedFrom,
            usedDateTo: usedTo,
            previousDateFrom: prevFrom,
            previousDateTo: prevTo,
            todayData: todayList,
            previousData: prevList,
            todayDataWithChange,
        });
    } catch (error) {
        console.error("getLatestAvailableHighestPriceByUserParam Error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};