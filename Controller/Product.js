const Product = require("../Modal/Product");
const Category = require("../Modal/Category");
const Subcategory = require("../Modal/Subcategory");
const Subsubcategory = require("../Modal/Subsubcategory");
const WeightUnit = require("../Modal/Weightunit");
const Payment = require("../Modal/Payment");


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
            vendorId
        } = req.body;

        console.log("req.body", req.body)

        const normalizedStatus = status?.toLowerCase() === 'active' ? 'Active' : 'Inactive';

        let imagePath = "";
        if (req.file) {
            imagePath = req.file.path.replace(/\\/g, "/");
        }

        const category = categoryId ? await Category.findById(categoryId) : null;
        const subcategory = subcategoryId ? await Subcategory.findById(subcategoryId) : null;
        const subsubcategory = (subsubcategoryId && subsubcategoryId.trim() !== "")
            ? await Subsubcategory.findById(subsubcategoryId)
            : null;

        const productData = {
            productTitle,
            categoryId,
            categoryName: category?.Categoryname,
            subcategoryId,
            subcategoryName: subcategory?.subcategoryName,
            weightUnitId,
            weightUnitName: weightUnit?.weightUnitName,
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
            productImage: imagePath,
            agreeTermsAndCondition,
            status: normalizedStatus,
            vendorName,
            vendorId
        };

        if (subsubcategoryId && subsubcategoryId.trim() !== "") {
            productData.subsubcategoryId = subsubcategoryId;
            productData.subsubcategoryName = subsubcategory?.subsubcategoryName;
        }

        const product = new Product(productData);
        await product.save();

        res.status(201).json({ success: true, data: product });

    } catch (err) {
        console.error("Create Product Error:", err);
        res.status(500).json({ success: false, message: err.message });
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
        const updateData = req.body;

        if (req.file) {
            updateData.productImage = req.file.path.replace(/\\/g, "/");
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        res.status(200).json({ success: true, data: product });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
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



exports.updateProductStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const normalizedStatus = status?.toLowerCase() === "active" ? "Active" : "Inactive";

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { status: normalizedStatus },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.status(200).json({
            success: true,
            message: "Status updated successfully",
            data: updatedProduct
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
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
            status: "Active", // ✅ ONLY ACTIVE PRODUCTS
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
