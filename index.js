const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const path = require("path");

// Load Cloudinary config at startup so the env-var check runs immediately
require("./utils/cloudinaryConfig");

mongoose
    .connect(process.env.MONGO_URI, {
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
    })
    .then(() =>
        console.log("=============MongoDb Database connected successfuly")
    )
    .catch((err) => console.log("Database Not connected !!!", err));


app.use(cors());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));

const adminRoute = require("./Route/Admin");
const categoryRoute = require("./Route/Category");
const SubcategoryRoute = require("./Route/Subcategory");
const VendorRoute = require("./Route/Vendoruser");
const BannerRoute = require("./Route/Banner");
const Subsubcategory = require("./Route/Subsubcategory")
const WeightunitRoute = require("./Route/Weightunit");
const ProductsRoute = require("./Route/Product");
const DailymarketpriceRoute = require("./Route/Dailymarketprice");
const TraderRoute = require("./Route/Trader");
const BidRoute = require("./Route/Bid");
const DailymarketcategoryRoute = require("./Route/Dailynarketcategory");
const favoriteRoute = require("./Route/Favurite");
const PaymentRoute = require("./Route/Payment");
const farmerRoute = require("./Route/Farmer");
const requirementRoute = require("./Route/Addrequirement");
const farmerbannerRoute = require("./Route/Farmerbanner");
const notificationRoute = require("./Route/Notification");
const planRoute = require("./Route/Plan");
const couponRoute = require("./Route/Coupon");
const traderSubscriptionRoute = require("./Route/TraderSubscription");
const farmerSubscriptionRoute = require("./Route/FarmerSubscription");
const { startResetSellingCron } = require("./corn/resetSellingDaily");
const { startResetMonthlyListingsCron } = require("./corn/resetMonthlyListings");
const deleteuserRoute = require("./Route/Deleteuser");
// tyui
app.use("/api", adminRoute);
app.use("/api", categoryRoute);
app.use("/api", VendorRoute);
app.use("/api", BannerRoute);
app.use("/api", SubcategoryRoute);
app.use("/api", Subsubcategory);
app.use("/api", WeightunitRoute);
app.use("/api", ProductsRoute);
app.use("/api/dailymarket-price", DailymarketpriceRoute);
app.use("/api", TraderRoute);
app.use("/api/bids", BidRoute);
app.use("/api/dailymarket-category", DailymarketcategoryRoute);
app.use("/api/favorite", favoriteRoute);
app.use("/api/payment", PaymentRoute);
app.use("/api/farmer", farmerRoute);
app.use("/api/requirement", requirementRoute);
app.use("/api/farmerbanner", farmerbannerRoute);
app.use("/api/notification", notificationRoute);
app.use("/api/plan", planRoute);
app.use("/api/coupon", couponRoute);
app.use("/api/trader-subscription", traderSubscriptionRoute);
app.use("/api/farmer-subscription", farmerSubscriptionRoute);
app.use("/api/deleteuser", deleteuserRoute);


startResetSellingCron();
startResetMonthlyListingsCron();

const PORT = process.env.PORT || 8000;
require("./corn/unlockProduct");

app.get("/test", (req, res) => {
    res.status(200).json({ message: "Welcome to Suman Back end" });
});

// ─── Cloudinary credential test (open in browser to verify) ──────────────────
// Visit: https://indian-coffee-backend-1.onrender.com/test-cloudinary
app.get("/test-cloudinary", async (_req, res) => {
    try {
        const { cloudinary } = require("./utils/cloudinaryConfig");
        const cfg = cloudinary.config();

        // Show which env vars are loaded (without revealing the secret)
        const envStatus = {
            CLOUDINARY_CLOUD_NAME:   process.env.CLOUDINARY_CLOUD_NAME  || "❌ NOT SET",
            CLOUDINARY_API_KEY:      process.env.CLOUDINARY_API_KEY     || "❌ NOT SET",
            CLOUDINARY_API_SECRET:   process.env.CLOUDINARY_API_SECRET  ? "✅ SET (hidden)" : "❌ NOT SET",
        };

        // Actually ping Cloudinary — this uses the credentials to make a real API call
        const pingResult = await cloudinary.api.ping();

        return res.json({
            success:     true,
            message:     "✅ Cloudinary credentials are CORRECT and working!",
            cloud_name:  cfg.cloud_name,
            env:         envStatus,
            ping:        pingResult,
        });
    } catch (err) {
        const { cloudinary } = require("./utils/cloudinaryConfig");
        return res.status(500).json({
            success:  false,
            message:  "❌ Cloudinary credentials are WRONG — " + err.message,
            fix:      "Go to Render → your service → Environment → update the 3 Cloudinary vars → Manual Deploy",
            env: {
                CLOUDINARY_CLOUD_NAME:  process.env.CLOUDINARY_CLOUD_NAME  || "NOT SET",
                CLOUDINARY_API_KEY:     process.env.CLOUDINARY_API_KEY     || "NOT SET",
                CLOUDINARY_API_SECRET:  process.env.CLOUDINARY_API_SECRET  ? "SET (hidden)" : "NOT SET",
            },
        });
    }
});

// ─── Global error handler (must be last) ─────────────────────────────────────
app.use((err, req, res, next) => {
    console.error("❌ Error:", err.message);

    // File-size exceeded
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, message: "File is too large." });
    }

    // Any multer error
    if (err.name === "MulterError") {
        return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    }

    // Cloudinary "Invalid Signature" → credentials mismatch on Render
    if (err.message && err.message.includes("Invalid Signature")) {
        console.error("🔑  Cloudinary signature mismatch — check CLOUDINARY_API_SECRET on Render and redeploy.");
        return res.status(500).json({
            success: false,
            message: "Image upload failed: server credentials are misconfigured. Please contact support.",
        });
    }

    // Everything else
    return res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error",
    });
});

app.listen(PORT, () => {
    console.log("Server is running on", PORT);
});
