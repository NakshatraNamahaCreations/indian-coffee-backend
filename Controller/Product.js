const Product = require("../Modal/Product");
const Category = require("../Modal/Category");
const Subcategory = require("../Modal/Subcategory");
const Subsubcategory = require("../Modal/Subsubcategory");
const WeightUnit = require("../Modal/Weightunit");
const Payment = require("../Modal/Payment");
const sendPushNotification = require("../utils/sendPushNotification");
const sendTraderPushnotification = require("../utilstrader/sendPushNotification");
const Trader = require("../Modal/Trader");
const Farmer = require("../Modal/Farmer");
const { default: mongoose } = require("mongoose");
const InAppNotification = require("../Modal/Notification");


// exports.createProduct = async (req, res) => {
//     try {
//         const {
//             productTitle,
//             categoryId,
//             subcategoryId,
//             subsubcategoryId,
//             weightUnitId,
//             quantity,
//             pricePerUnit,
//             advancePayment,
//             postHarvestProcess,
//             beanSize,
//             beanShape,
//             cropYear,
//             scaScore,
//             moisture,
//             maxDefects,
//             minDefects,
//             packagingForShipment,
//             minimumQuantity,
//             country,
//             state,
//             cityDistrict,
//             pincode,
//             talukVillage,
//             address,
//             availableDate,
//             agreeTermsAndCondition,
//             status,
//             weightUnit,
//             vendorName,
//             vendorId,
//             weightUnitName,
//             Certifications,
//             Cupping_Notes
//         } = req.body;

//         const normalizedStatus = String(status || "").toLowerCase() === "active" ? "Active" : "Inactive";

//         // ✅ MULTI FILE PATHS
//         const productImages =
//             (req.files || []).map((f) => String(f.path).replace(/\\/g, "/"));

//         const category = categoryId ? await Category.findById(categoryId) : null;
//         const subcategory = subcategoryId ? await Subcategory.findById(subcategoryId) : null;
//         const subsubcategory =
//             subsubcategoryId && String(subsubcategoryId).trim() !== ""
//                 ? await Subsubcategory.findById(subsubcategoryId)
//                 : null;

//         const qtyNum = Number(quantity);
//         const safeQty = Number.isFinite(qtyNum) && qtyNum > 0 ? qtyNum : 0;

//         const productData = {
//             productTitle,
//             categoryId,
//             categoryName: category?.Categoryname,
//             subcategoryId,
//             subcategoryName: subcategory?.subcategoryName,

//             subsubcategoryId: undefined,
//             subsubcategoryName: undefined,

//             weightUnitId,

//             weightUnit,
//             quantity: safeQty,
//             availableQuantity: safeQty,

//             pricePerUnit,
//             advancePayment,
//             postHarvestProcess,
//             beanSize,
//             beanShape,
//             cropYear,
//             scaScore,
//             moisture,
//             maxDefects,
//             minDefects,
//             packagingForShipment,
//             minimumQuantity,
//             country,
//             state,
//             cityDistrict,
//             pincode,
//             talukVillage,
//             address,
//             availableDate,
//             productImages,
//             agreeTermsAndCondition,
//             status: normalizedStatus,
//             vendorName,
//             vendorId,
//             weightUnitName,
//             Certifications,
//             Cupping_Notes
//         };

//         if (subsubcategoryId && String(subsubcategoryId).trim() !== "") {
//             productData.subsubcategoryId = subsubcategoryId;
//             productData.subsubcategoryName = subsubcategory?.subsubcategoryName;
//         } else {
//             delete productData.subsubcategoryId;
//             delete productData.subsubcategoryName;
//         }



//         const product = new Product(productData);
//         await product.save();

//         try {
//             const vName = vendorName || "Vendor";
//             const pTitle = productTitle || "New Product";

//             await InAppNotification.create({
//                 userId: "", // ✅ not empty now
//                 notificationType: "PRODUCT_CREATED",
//                 thumbnailTitle: "New product created",
//                 notifyTo: "admin",
//                 message: `${vName} created a product: ${pTitle} (Status: ${normalizedStatus}).`,
//                 metaData: {
//                     productId: String(product._id),
//                     vendorId: vendorId ? String(vendorId) : null,
//                     vendorName: vendorName || "",
//                     status: normalizedStatus,
//                     categoryId: categoryId ? String(categoryId) : null,
//                     subcategoryId: subcategoryId ? String(subcategoryId) : null,
//                 },
//                 status: "unread",
//             });
//         } catch (notiErr) {
//             console.error("In-app notification save failed:", notiErr.message);
//         }

//         return res.status(201).json({ success: true, data: product });
//     } catch (err) {
//         console.error("Create Product Error:", err);
//         return res.status(500).json({ success: false, message: err.message });
//     }
// };


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
            weightUnitName,
            Certifications,
            Cupping_Notes,
        } = req.body;

        const normalizedStatus =
            String(status || "").toLowerCase() === "active" ? "Active" : "Inactive";

        // ✅ handle multer.fields()
        const productImages = (req.files?.productImages || []).map((file) =>
            String(file.path).replace(/\\/g, "/")
        );

        const productvideofile =
            req.files?.productvideofile?.[0]?.path
                ? String(req.files.productvideofile[0].path).replace(/\\/g, "/")
                : "";

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
            categoryName: category?.Categoryname || "",
            subcategoryId,
            subcategoryName: subcategory?.subcategoryName || "",
            weightUnitId,
            weightUnit,
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
            availableDate: availableDate ? new Date(availableDate) : null,
            productImages,
            productvideofile, // ✅ save video path
            agreeTermsAndCondition,
            status: normalizedStatus,
            vendorName,
            vendorId,
            weightUnitName,
            Certifications,
            Cupping_Notes,
        };

        if (subsubcategoryId && String(subsubcategoryId).trim() !== "") {
            productData.subsubcategoryId = subsubcategoryId;
            productData.subsubcategoryName = subsubcategory?.subsubcategoryName || "";
        }

        // ---- Farmer count limit enforcement ----
        if (vendorId) {
            const farmer = await Farmer.findById(vendorId).select("currentPlanName countBalance countResetType");
            if (farmer && farmer.currentPlanName) {
                // Has an active subscription
                if (farmer.countBalance <= 0) {
                    return res.status(403).json({
                        success: false,
                        code: "COUNT_LIMIT_EXHAUSTED",
                        message: "You have exhausted your posting counts. Please purchase a plan.",
                    });
                }
            }
        }
        // ---- End count limit enforcement ----

        const product = new Product(productData);
        await product.save();

        try {
            const vName = vendorName || "Vendor";
            const pTitle = productTitle || "New Product";

            await InAppNotification.create({
                userId: "",
                notificationType: "PRODUCT_CREATED",
                thumbnailTitle: "New product created",
                notifyTo: "admin",
                message: `${vName} created a product: ${pTitle} (Status: ${normalizedStatus}).`,
                metaData: {
                    productId: String(product._id),
                    vendorId: vendorId ? String(vendorId) : null,
                    vendorName: vendorName || "",
                    status: normalizedStatus,
                    categoryId: categoryId ? String(categoryId) : null,
                    subcategoryId: subcategoryId ? String(subcategoryId) : null,
                },
                status: "unread",
            });
        } catch (notiErr) {
            console.error("In-app notification save failed:", notiErr.message);
        }

        // Deduct 1 count for posting a product (for farmers with active subscription)
        if (vendorId) {
            const farmer = await Farmer.findById(vendorId).select("currentPlanName countResetType");
            if (farmer && farmer.currentPlanName) {
                // Has active subscription, deduct 1 count
                await Farmer.findByIdAndUpdate(vendorId, { $inc: { countBalance: -1 } });

                // For monthly reset plans, also track usage
                if (farmer.countResetType === "monthly") {
                    await Farmer.findByIdAndUpdate(vendorId, { $inc: { monthlyCountUsed: 1 } });
                }
            }
        }

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product,
        });
    } catch (err) {
        console.error("Create Product Error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to create product",
        });
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

        // ✅ vendor push (existing logic)
        try {
            let vendorObjectId = null;
            if (
                updatedProduct.vendorId &&
                mongoose.Types.ObjectId.isValid(updatedProduct.vendorId)
            ) {
                vendorObjectId = new mongoose.Types.ObjectId(updatedProduct.vendorId);
            }

            const vendor = vendorObjectId ? await Farmer.findById(vendorObjectId) : null;
            const fcmToken = vendor?.fcmToken;

            const title = "Product Status Updated";
            const body =
                normalizedStatus === "Active"
                    ? `✅ Your product "${updatedProduct.productTitle}" is now Active.`
                    : `⏸️ Your product "${updatedProduct.productTitle}" is now Inactive.`;

            if (fcmToken) {
                await sendPushNotification(fcmToken, title, body);
            }
        } catch (e) {
            console.log("Vendor push failed:", e.message);
        }

        // ✅ NEW: if status is Active -> notify ALL traders
        if (normalizedStatus === "Active") {
            try {
                // get all traders with valid tokens
                const traders = await Trader.find(
                    { fcmToken: { $exists: true, $ne: "" } },
                    { fcmToken: 1, _id: 1 }
                ).lean();

                if (traders.length) {
                    const title = "New Product Available";
                    const body = `🔥 "${updatedProduct.productTitle}" is now Active. Check it out!`;

                    // send in batches (avoid huge burst)
                    const BATCH_SIZE = 400;
                    for (let i = 0; i < traders.length; i += BATCH_SIZE) {
                        const batch = traders.slice(i, i + BATCH_SIZE);

                        await Promise.allSettled(
                            batch.map((t) =>
                                sendTraderPushnotification(t.fcmToken, title, body)
                            )
                        );
                    }

                    console.log(`Trader push sent to ${traders.length} traders`);
                } else {
                    console.log("No traders with fcmToken found");
                }
            } catch (e) {
                console.log("Trader push failed:", e.message);
            }
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




// exports.updateProduct = async (req, res) => {
//     try {
//         const updateData = { ...req.body };

//         // ✅ existingImages from frontend (after deletions)
//         let existingImages = [];
//         try {
//             if (req.body.existingImages) {
//                 existingImages = JSON.parse(req.body.existingImages);
//             }
//         } catch (e) {
//             existingImages = [];
//         }

//         const newImages = (req.files || []).map((f) => String(f.path).replace(/\\/g, "/"));

//         updateData.productImages = [...existingImages, ...newImages];

//         const updated = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
//         return res.status(200).json({ success: true, data: updated });
//     } catch (err) {
//         return res.status(500).json({ success: false, message: err.message });
//     }
// };

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        const updateData = { ...req.body };

        // ✅ normalize status
        if (req.body.status !== undefined) {
            updateData.status =
                String(req.body.status || "").toLowerCase() === "active"
                    ? "Active"
                    : "Inactive";
        }

        // ✅ parse existingImages from frontend
        let existingImages = existingProduct.productImages || [];
        try {
            if (req.body.existingImages) {
                existingImages = JSON.parse(req.body.existingImages);
                if (!Array.isArray(existingImages)) {
                    existingImages = existingProduct.productImages || [];
                }
            }
        } catch (error) {
            existingImages = existingProduct.productImages || [];
        }

        // ✅ new uploaded images
        const newImages = (req.files?.productImages || []).map((file) =>
            String(file.path).replace(/\\/g, "/")
        );

        updateData.productImages = [...existingImages, ...newImages];

        // ✅ video update logic
        const newVideo =
            req.files?.productvideofile?.[0]?.path
                ? String(req.files.productvideofile[0].path).replace(/\\/g, "/")
                : null;

        // if new video uploaded -> replace old video
        // else if frontend sends existing video -> keep it
        // else keep old DB video
        if (newVideo) {
            updateData.productvideofile = newVideo;
        } else if (req.body.existingProductVideo !== undefined) {
            updateData.productvideofile = req.body.existingProductVideo || "";
        } else {
            updateData.productvideofile = existingProduct.productvideofile || "";
        }

        // ✅ number safety
        if (req.body.quantity !== undefined) {
            const qtyNum = Number(req.body.quantity);
            if (Number.isFinite(qtyNum) && qtyNum >= 0) {
                updateData.quantity = qtyNum;
            }
        }

        if (req.body.availableDate) {
            updateData.availableDate = new Date(req.body.availableDate);
        }

        // ✅ category/subcategory names refresh if ids changed
        if (updateData.categoryId) {
            const category = await Category.findById(updateData.categoryId);
            updateData.categoryName = category?.Categoryname || "";
        }

        if (updateData.subcategoryId) {
            const subcategory = await Subcategory.findById(updateData.subcategoryId);
            updateData.subcategoryName = subcategory?.subcategoryName || "";
        }

        if (
            updateData.subsubcategoryId &&
            String(updateData.subsubcategoryId).trim() !== ""
        ) {
            const subsubcategory = await Subsubcategory.findById(updateData.subsubcategoryId);
            updateData.subsubcategoryName = subsubcategory?.subsubcategoryName || "";
        } else if (updateData.subsubcategoryId === "" || updateData.subsubcategoryId === null) {
            updateData.subsubcategoryId = undefined;
            updateData.subsubcategoryName = undefined;
        }

        const updated = await Product.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: updated,
        });
    } catch (err) {
        console.error("updateProduct error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to update product",
        });
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
            $or: [
                { isFeatured: true },   // New field for farmer subscription featured products
                { fetureProduct: true }  // Legacy field for backward compatibility
            ],
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

exports.updateSellingDetails = async (req, res) => {
    try {
        const { productId, vendorId, sellingQuantity, sellingDate } = req.body;

        if (!productId || !vendorId) {
            return res.status(400).json({ success: false, message: "productId and vendorId are required" });
        }

        const qty = Number(sellingQuantity);
        if (!Number.isFinite(qty) || qty < 0) {
            return res.status(400).json({ success: false, message: "sellingQuantity must be a valid number >= 0" });
        }

        const product = await Product.findOne({ _id: productId, vendorId: String(vendorId) });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found for this vendorId + productId",
            });
        }

        product.sellingQuantity = qty;

        product.sellingDate = sellingDate ? new Date(sellingDate) : new Date();

        await product.save();

        return res.status(200).json({
            success: true,
            message: "Selling details updated",
            data: product,
        });
    } catch (err) {
        console.log("updateSellingDetails error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};


exports.updateProductBidActive = async (req, res) => {
    try {
        const { productId, vendorId } = req.body;

        if (!productId || !vendorId) {
            return res.status(400).json({
                success: false,
                message: "productId and vendorId are required",
            });
        }

        const product = await Product.findOne({
            _id: productId,
            vendorId: String(vendorId),
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found for this vendorId + productId",
            });
        }

        // ✅ toggle
        product.bidActive = !product.bidActive;
        await product.save();

        // ✅ If bidActive turned ON -> notify ALL traders
        if (product.bidActive === true) {
            try {
                const traders = await Trader.find(
                    { fcmToken: { $exists: true, $ne: "" } },
                    { fcmToken: 1 }
                ).lean();

                if (traders.length) {
                    const title = "Bidding Started";
                    const body = `✅ Bidding is now available for "${product.productTitle}". Place your bid now!`;

                    // batching to avoid overload
                    const BATCH_SIZE = 400;
                    for (let i = 0; i < traders.length; i += BATCH_SIZE) {
                        const batch = traders.slice(i, i + BATCH_SIZE);

                        await Promise.allSettled(
                            batch.map((t) =>
                                sendTraderPushnotification(t.fcmToken, title, body)
                            )
                        );
                    }

                    console.log(`BidActive ON: notified ${traders.length} traders`);
                } else {
                    console.log("No traders with fcmToken found");
                }
            } catch (notiErr) {
                console.log("Trader notification failed:", notiErr.message);
            }
        }

        return res.status(200).json({
            success: true,
            message: `Product bidActive toggled to ${product.bidActive}`,
            data: product,
        });
    } catch (err) {
        console.log("toggleProductBidActive error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// exports.updateProductBidActive = async (req, res) => {
//     try {
//         const { productId, vendorId } = req.body;

//         if (!productId || !vendorId) {
//             return res.status(400).json({
//                 success: false,
//                 message: "productId and vendorId are required",
//             });
//         }

//         const product = await Product.findOne({
//             _id: productId,
//             vendorId: String(vendorId),
//         });

//         if (!product) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Product not found for this vendorId + productId",
//             });
//         }

//         // ✅ toggle
//         product.bidActive = !product.bidActive;
//         await product.save();

//         return res.status(200).json({
//             success: true,
//             message: `Product bidActive toggled to ${product.bidActive}`,
//             data: product,
//         });
//     } catch (err) {
//         console.log("toggleProductBidActive error:", err);
//         return res.status(500).json({ success: false, message: err.message });
//     }
// };


exports.featureProduct = async (req, res) => {
    try {
        const { productId, farmerId } = req.body;

        if (!productId || !farmerId) {
            return res.status(400).json({
                success: false,
                message: "productId and farmerId are required",
            });
        }

        // Fetch product
        const product = await Product.findOne({
            _id: productId,
            vendorId: String(farmerId),
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found for this farmer",
            });
        }

        // Fetch farmer and validate Pro plan + feature count
        const farmer = await Farmer.findById(farmerId).select("currentPlanName featuredListingCount");
        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: "Farmer not found",
            });
        }

        const isPro = farmer.currentPlanName &&
            farmer.currentPlanName.toLowerCase().includes("pro");

        if (!isPro) {
            return res.status(403).json({
                success: false,
                message: "Only Pro plan members can feature products",
            });
        }

        if (farmer.featuredListingCount >= 1) {
            return res.status(403).json({
                success: false,
                message: "You have reached your featured listing limit for this month",
            });
        }

        // Mark product as featured
        product.isFeatured = true;
        product.featuredAt = new Date();
        await product.save();

        // Increment featured count
        await Farmer.findByIdAndUpdate(farmerId, { $inc: { featuredListingCount: 1 } });

        return res.status(200).json({
            success: true,
            message: "Product marked as featured",
            data: product,
        });
    } catch (err) {
        console.log("featureProduct error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// exports.updateProductBidActive = async (req, res) => {
//     try {
//         const { productId, vendorId, bidActive } = req.body;

//         if (!productId || !vendorId) {
//             return res.status(400).json({
//                 success: false,
//                 message: "productId and vendorId are required",
//             });
//         }

//         const product = await Product.findOne({ _id: productId, vendorId: String(vendorId) });
//         if (!product) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Product not found for this vendorId + productId",
//             });
//         }

//         product.bidActive = Boolean(bidActive);
//         await product.save();

//         return res.status(200).json({
//             success: true,
//             message: `Product bidActive updated to ${product.bidActive}`,
//             data: product,
//         });
//     } catch (err) {
//         console.log("updateProductBidActive error:", err);
//         return res.status(500).json({ success: false, message: err.message });
//     }
// };