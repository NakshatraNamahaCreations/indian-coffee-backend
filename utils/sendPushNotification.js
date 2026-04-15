const admin = require("./firebase");

/**
 * Send a push notification to a Farmer device.
 *
 * @param {string} fcmToken   - Device FCM token
 * @param {string} title      - Notification title
 * @param {string} body       - Notification body
 * @param {object} [data={}]  - Optional key-value data payload (all values must be strings).
 *                              Available as remoteMessage.data in the app for deep-linking.
 */
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
    if (!fcmToken) return;

    // FCM requires all data values to be strings
    const stringData = {};
    for (const [k, v] of Object.entries(data || {})) {
        stringData[k] = String(v);
    }

    const message = {
        token: fcmToken,
        notification: { title, body },
        // data payload — received as remoteMessage.data even when app is killed
        data: stringData,
        android: {
            priority: "high",
            notification: { sound: "default" },
        },
        apns: {
            payload: {
                aps: {
                    sound: "default",
                    contentAvailable: 1,
                },
            },
        },
    };

    try {
        const msgId = await admin.messaging().send(message);
        console.log("✅ Farmer push sent:", msgId);
    } catch (error) {
        console.error("❌ Farmer push error:", error.code, error.message);
    }
};

module.exports = sendPushNotification;
