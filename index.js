const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();
const cookieParser = require("cookie-parser");

mongoose
    .connect(process.env.MONGO_URI, {
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
    })
    .then(() =>
        console.log("=============MongoDb Database connected successfuly")
    )
    .catch((err) => console.log("Database Not connected !!!", err));


app.use('/uploads', express.static('uploads'));


app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(cors());
app.use(morgan("dev"));
app.use(express.static("public"));
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


const PORT = process.env.PORT || 8000;

app.get("/", (req, res) => {
    res.status(200).json({ message: "Welcome to Suman Back end" });
});

app.listen(PORT, () => {
    console.log("Server is running on", PORT);
});
