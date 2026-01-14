const admin = require("./firebaseTrader");

const sendPushNotificationTrader = async (fcmToken, title, body) => {
    if (!fcmToken) return;

    const message = {
        token: fcmToken,
        notification: { title, body },
        android: { priority: "high" },
    };

    try {
        await admin.messaging().send(message);
        console.log("✅ Trader push sent");
    } catch (error) {
        console.error("❌ Trader push error:", error.code);
    }
};

module.exports = sendPushNotificationTrader;
