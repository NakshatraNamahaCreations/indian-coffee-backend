const InAppNotification = require("../Modal/Notification");

exports.fetchuserIDnotification = async (req, res) => {
    try {
        const userId = String(req.params.userId || req.query.userId || "").trim();
        if (!userId) {
            return res.status(400).json({ success: false, message: "userId is required" });
        }

        const page = Math.max(parseInt(req.query.page || "1", 10), 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit || "8", 10), 1), 50);
        const skip = (page - 1) * limit;

        const status = req.query.status ? String(req.query.status).trim() : "";
        const notifyTo = req.query.notifyTo ? String(req.query.notifyTo).trim() : "";
        const baseFilter = { userId };
        if (status) baseFilter.status = status;
        if (notifyTo) baseFilter.notifyTo = notifyTo;

        const unreadFilter = { userId, status: "unread" };
        if (notifyTo) unreadFilter.notifyTo = notifyTo;

        const [items, total, unreadCount] = await Promise.all([
            InAppNotification.find(baseFilter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            InAppNotification.countDocuments(baseFilter),

            InAppNotification.countDocuments(unreadFilter),
        ]);

        return res.status(200).json({
            success: true,
            data: items,
            unreadCount,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: skip + items.length < total,
            },
        });
    } catch (error) {
        console.error("Error fetching user notifications:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.fetchmarknotification = async (req, res) => {
    try {
        const { notificationId } = req.params;

        const updatedNotification = await InAppNotification.findOneAndUpdate(
            { _id: notificationId },
            { $set: { status: "read" } },
            { new: true }
        ).lean();

        if (!updatedNotification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.status(200).json({
            message: "Notification marked as read",
            notification: updatedNotification,
        });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ message: "Server error" });
    }
}

exports.getAllNotifications = async (req, res) => {
    try {
        const notifications = await InAppNotification.find({})
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            message: "All notifications fetched successfully",
            total: notifications.length,
            notifications,
        });
    } catch (error) {
        console.error("Error fetching all notifications:", error);
        res.status(500).json({ message: "Server error" });
    }
};
