const admin = require("./firebase");

const sendPushNotification = async (fcmToken, title, body) => {
    if (!fcmToken) return;

    const message = {
        token: fcmToken,
        notification: {
            title,
            body,
        },
        android: {
            priority: "high",
        },
    };

    try {
        await admin.messaging().send(message);
        console.log("Push sent");
    } catch (error) {
        console.error("Push error:", error.message);
    }
};

module.exports = sendPushNotification;