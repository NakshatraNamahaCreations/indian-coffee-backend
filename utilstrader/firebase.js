const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID_TRADER,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL_TRADER,
            privateKey: process.env.FIREBASE_PRIVATE_KEY_TRADER.replace(/\\n/g, "\n"),
        }),
    });
}

module.exports = admin;
