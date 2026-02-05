const Product = require("../Modal/Product");
const Category = require("../Modal/Category");
const Subcategory = require("../Modal/Subcategory");
const Subsubcategory = require("../Modal/Subsubcategory");
const WeightUnit = require("../Modal/Weightunit");
const Payment = require("../Modal/Payment");
const sendPushNotification = require("../utils/sendPushNotification");
const Farmer = require("../Modal/Farmer");
const { default: mongoose } = require("mongoose");


exports.createProduct = async (req, res) => {
    try {
        const {
            productTitle,
            categoryId,
            subcategoryId,
            subsubcategoryId,
            weightUnitId,
            quantity,
            pricePerUnit,
            advancePayment,
            postHarvestProcess,
            beanSize,
            beanShape,
            cropYear,
            scaScore,
            moisture,
            maxDefects,
            minDefects,
            packagingForShipment,
            minimumQuantity,
            country,
            state,
            cityDistrict,
            pincode,
            talukVillage,
            address,
            availableDate,
            agreeTermsAndCondition,
            status,
            weightUnit,
            vendorName,
            vendorId,
            weightUnitName
        } = req.body;

        const normalizedStatus = String(status || "").toLowerCase() === "active" ? "Active" : "Inactive";

        // ✅ MULTI FILE PATHS
        const productImages =
            (req.files || []).map((f) => String(f.path).replace(/\\/g, "/"));

        const category = categoryId ? await Category.findById(categoryId) : null;
        const subcategory = subcategoryId ? await Subcategory.findById(subcategoryId) : null;
        const subsubcategory =
            subsubcategoryId && String(subsubcategoryId).trim() !== ""
                ? await Subsubcategory.findById(subsubcategoryId)
                : null;

        const qtyNum = Number(quantity);
        const safeQty = Number.isFinite(qtyNum) && qtyNum > 0 ? qtyNum : 0;

        const productData = {
            productTitle,
            categoryId,
            categoryName: category?.Categoryname,
            subcategoryId,
            subcategoryName: subcategory?.subcategoryName,

            subsubcategoryId: undefined,
            subsubcategoryName: undefined,

            weightUnitId,
            weightUnitName: weightUnit?.weightUnitName,

            quantity: safeQty,
            availableQuantity: safeQty,

            pricePerUnit,
            advancePayment,
            postHarvestProcess,
            beanSize,
            beanShape,
            cropYear,
            scaScore,
            moisture,
            maxDefects,
            minDefects,
            packagingForShipment,
            minimumQuantity,
            country,
            state,
            cityDistrict,
            pincode,
            talukVillage,
            address,
            availableDate,
            productImages,
            agreeTermsAndCondition,
            status: normalizedStatus,
            vendorName,
            vendorId,
        };

        if (subsubcategoryId && String(subsubcategoryId).trim() !== "") {
            productData.subsubcategoryId = subsubcategoryId;
            productData.subsubcategoryName = subsubcategory?.subsubcategoryName;
        } else {
            delete productData.subsubcategoryId;
            delete productData.subsubcategoryName;
        }

        const product = new Product(productData);
        await product.save();

        return res.status(201).json({ success: true, data: product });
    } catch (err) {
        console.error("Create Product Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateProductStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const normalizedStatus =
            String(status || "").toLowerCase() === "active" ? "Active" : "Inactive";

        // ✅ update product
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { status: normalizedStatus },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        console.log("updatedProduct", updatedProduct);

        // ✅ convert vendorId string -> ObjectId safely
        let vendorObjectId = null;
        if (updatedProduct.vendorId && mongoose.Types.ObjectId.isValid(updatedProduct.vendorId)) {
            vendorObjectId = new mongoose.Types.ObjectId(updatedProduct.vendorId);
        }

        // ✅ find vendor/farmer
        const vendor = vendorObjectId ? await Farmer.findById(vendorObjectId) : null;

        // ✅ get token (change field name if yours differs)
        const fcmToken = vendor?.fcmToken;

        // ✅ send push
        const title = "Product Status Updated";
        const body =
            normalizedStatus === "Active"
                ? `✅ Your product "${updatedProduct.productTitle}" is now Active.`
                : `⏸️ Your product "${updatedProduct.productTitle}" is now Inactive.`;

        if (fcmToken) {
            await sendPushNotification(fcmToken, title, body);
        } else {
            console.log("No fcmToken for vendor:", updatedProduct.vendorId);
        }

        return res.status(200).json({
            success: true,
            message: "Status updated successfully",
            data: updatedProduct,
        });
    } catch (err) {
        console.log("updateProductStatus error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};


exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: products });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};




exports.updateProduct = async (req, res) => {
    try {
        const updateData = { ...req.body };

        // ✅ existingImages from frontend (after deletions)
        let existingImages = [];
        try {
            if (req.body.existingImages) {
                existingImages = JSON.parse(req.body.existingImages);
            }
        } catch (e) {
            existingImages = [];
        }

        const newImages = (req.files || []).map((f) => String(f.path).replace(/\\/g, "/"));

        updateData.productImages = [...existingImages, ...newImages];

        const updated = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
        return res.status(200).json({ success: true, data: updated });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};


exports.deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Product deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Server error while fetching product"
        });
    }
};

exports.getActiveProducts = async (req, res) => {
    try {
        const products = await Product.find({ status: "Active" }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: products
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getInactiveProducts = async (req, res) => {
    try {
        const products = await Product.find({ status: "Inactive" }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: products
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


exports.getProductsBySubcategory = async (req, res) => {
    try {
        const { subcategoryId } = req.params;

        const products = await Product.find({
            subcategoryId,
            status: "Active"
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: products
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


exports.getProductsBySubSubcategory = async (req, res) => {
    try {
        const { subsubcategoryId } = req.params;

        const products = await Product.find({
            subsubcategoryId,
            status: "Active"   // ✅ IMPORTANT
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: products
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// After Payment

exports.lockProductAfterPayment = async (req, res) => {
    try {
        const { userId, productId, paymentId, orderId } = req.body;

        if (!userId || !productId || !paymentId) {
            return res.status(400).json({ error: "Missing payment data" });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        // Check if already locked
        if (
            product.lockedBy &&
            product.lockExpiresAt &&
            product.lockExpiresAt > new Date()
        ) {
            return res.status(403).json({ error: "Product already locked" });
        }

        // 💾 Save payment
        await Payment.create({
            userId,
            productId,
            amount: 99,
            paymentId,
            orderId,
            status: "success"
        });

        product.lockedBy = userId;
        product.lockExpiresAt = new Date(Date.now() + 20 * 60 * 1000);

        await product.save();

        res.json({
            success: true,
            message: "Payment success & product locked",
            lockExpiresAt: product.lockExpiresAt
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getProductLockStatus = async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId)
            .select("lockedBy lockExpiresAt");

        if (
            product?.lockedBy &&
            product.lockExpiresAt > new Date()
        ) {
            return res.json({
                locked: true,
                lockedBy: product.lockedBy,
                lockExpiresAt: product.lockExpiresAt
            });
        }

        res.json({ locked: false });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getProductsByVendor = async (req, res) => {
    try {
        const { vendorId } = req.params;

        if (!vendorId) {
            return res.status(400).json({
                success: false,
                message: "Vendor ID is required",
            });
        }

        const products = await Product.find({ vendorId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            data: products,
        });
    } catch (err) {
        console.error("Get Products By Vendor Error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch vendor products",
        });
    }
};


exports.getProductsByVendordata = async (req, res) => {
    try {
        const { vendorId } = req.params;

        if (!vendorId) {
            return res.status(400).json({
                success: false,
                message: "Vendor ID is required",
            });
        }

        const products = await Product.find({
            vendorId: vendorId,
            status: "Active",
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            data: products,
        });
    } catch (err) {
        console.error("Get Products By Vendor Error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch vendor products",
        });
    }
};



exports.searchProducts = async (req, res) => {
    try {
        const {
            keyword,
            categoryId,
            subcategoryId,
            subsubcategoryId,
            vendorId,
            status,
            minPrice,
            maxPrice,
            state,
            cityDistrict,
            pincode,
            talukVillage,
        } = req.query;

        let filter = {};

        if (keyword) {
            filter.productTitle = {
                $regex: keyword,
                $options: "i"
            };
        }

        if (categoryId) filter.categoryId = categoryId;
        if (subcategoryId) filter.subcategoryId = subcategoryId;
        if (subsubcategoryId) filter.subsubcategoryId = subsubcategoryId;


        if (vendorId) filter.vendorId = vendorId;

        if (status) {
            filter.status = status.toLowerCase() === "active" ? "Active" : "Inactive";
        }

        if (minPrice || maxPrice) {
            filter.pricePerUnit = {};
            if (minPrice) filter.pricePerUnit.$gte = Number(minPrice);
            if (maxPrice) filter.pricePerUnit.$lte = Number(maxPrice);
        }

        const products = await Product.find(filter)
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });

    } catch (err) {
        console.error("Search Products Error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to search products"
        });
    }
};



exports.toggleFeatureProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        product.fetureProduct = !product.fetureProduct; // ✅ match schema
        await product.save();

        return res.status(200).json({
            success: true,
            message: `Feature status toggled to ${product.fetureProduct}`,
            data: product,
        });
    } catch (err) {
        console.log("toggleFeatureProduct error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.getFeaturedProducts = async (req, res) => {
    try {
        const products = await Product.find({
            fetureProduct: true,
            status: "Active",
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            total: products.length,
            data: products,
        });
    } catch (err) {
        console.log("getFeaturedProducts error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Server Error",
        });
    }
};


exports.uploadProductFile = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        product.productFile = req.file.path;
        await product.save();

        return res.status(200).json({
            success: true,
            message: "Product file uploaded successfully",
            data: product,
        });
    } catch (err) {
        console.log("uploadProductFile error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};