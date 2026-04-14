const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const path = require("path");

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

// ✅ Diagnostic endpoint to verify Cloudinary configuration
app.get("/api/cloudinary-health", (req, res) => {
    const { cloudinary } = require("./utils/cloudinaryConfig");
    const config = cloudinary.config();

    const isConfigured = !!(
        config.cloud_name &&
        config.api_key &&
        config.api_secret
    );

    return res.status(200).json({
        success: true,
        cloudinary_configured: isConfigured,
        cloud_name: config.cloud_name || "NOT SET",
        api_key: config.api_key ? "***SET***" : "NOT SET",
        api_secret: config.api_secret ? "***SET***" : "NOT SET",
        env_vars: {
            CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "NOT SET",
            CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? "***SET***" : "NOT SET",
            CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? "***SET***" : "NOT SET",
        }
    });
});

// ✅ ERROR HANDLING MIDDLEWARE (must be last)
app.use((err, req, res, next) => {
    console.error("\n❌ ERROR CAUGHT:");
    console.error("Message:", err.message);
    console.error("Name:", err.name);
    console.error("Code:", err.code);
    if (err.stack) console.error("Stack:", err.stack.split("\n").slice(0, 3).join("\n"));
    console.log("");

    // Multer errors
    if (err.name === "MulterError") {
        console.error("📤 Multer File Upload Error:", err.code);
        return res.status(400).json({
            success: false,
            error_type: "MULTER_ERROR",
            error_code: err.code,
            message: `Upload error: ${err.message}`,
        });
    }

    // Cloudinary signature/authentication errors
    if (err.message && err.message.includes("Invalid Signature")) {
        console.error("🔐 Cloudinary Signature Error - Check credentials on Render!");
        return res.status(401).json({
            success: false,
            error_type: "CLOUDINARY_SIGNATURE_ERROR",
            message: "Cloudinary credentials mismatch. Verify API_SECRET matches Cloudinary account and restart service on Render.",
            debug: err.message,
        });
    }

    // Other Cloudinary errors
    if (err.message && err.message.includes("Cloudinary")) {
        console.error("☁️  Cloudinary Error");
        return res.status(400).json({
            success: false,
            error_type: "CLOUDINARY_ERROR",
            message: `Cloudinary error: ${err.message}`,
        });
    }

    // Generic errors
    return res.status(err.status || 500).json({
        success: false,
        error_type: "GENERIC_ERROR",
        message: err.message || "Internal server error",
    });
});

app.listen(PORT, () => {
    console.log("Server is running on", PORT);
});
