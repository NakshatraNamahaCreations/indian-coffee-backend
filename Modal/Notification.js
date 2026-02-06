const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            index: true,
        },

        notificationType: {
            type: String,
            index: true,
        },

        thumbnailTitle: String,

        message: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            enum: ["unread", "read"],
            default: "unread",
            index: true,
        },

        metaData: {
            type: Object,
            default: {},
        },

        notifyTo: {
            type: String,
            enum: ["admin", "customer", "vendor"],
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);


notificationSchema.index({ notifyTo: 1, createdAt: -1 });

notificationSchema.index(
    { createdAt: 1 },
    { expires: 60 * 60 * 24 * 30 }
);

module.exports = mongoose.model("InAppNotification", notificationSchema);
