const admin = require("./firebase");

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
    try {
        if (!fcmToken) return;

        const message = {
            token: fcmToken,
            notification: { title, body },
            data: Object.keys(data).reduce((acc, k) => {
                acc[k] = String(data[k]);
                return acc;
            }, {}),
            android: { priority: "high" },
        };

        const resp = await admin.messaging().send(message);
        console.log("✅ Push sent id:", resp);
        return resp;
    } catch (error) {
        console.error("❌ Push error:", error.code, error.message);

        if (
            error.code === "messaging/registration-token-not-registered" ||
            error.code === "messaging/invalid-registration-token"
        ) {
            console.log("⚠️ Invalid FCM token, remove from DB");
        }

        throw error; // optional: if you want caller to know it failed
    }
};

module.exports = sendPushNotification;
