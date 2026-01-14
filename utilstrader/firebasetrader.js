const admin = require("firebase-admin");

const traderAdmin =
  admin.apps.find(app => app.name === "traderApp") ||
  admin.initializeApp(
    {
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID_TRADER,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL_TRADER,
        privateKey: process.env.FIREBASE_PRIVATE_KEY_TRADER.replace(/\\n/g, "\n"),
      }),
    },
    "traderApp"
  );

module.exports = traderAdmin;
