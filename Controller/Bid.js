const Bid = require("../Modal/Bid");
const Product = require('../Modal/Product');
const sendPushNotification = require("../utils/sendPushNotification");
const sendPushNotificationTrader = require("../utilstrader/sendPushNotification")
const Farmer = require("../Modal/Farmer");
const Trader = require("../Modal/Trader");
const { default: mongoose } = require("mongoose");
const InAppNotification = require("../Modal/Notification")


const safeId = (v) => (v ? String(v) : "");




// exports.createBid = async (req, res) => {
//     const session = await mongoose.startSession();

//     try {
//         await session.withTransaction(async () => {
//             const {
//                 userId,
//                 userName,
//                 productId,
//                 bidPricePerBag,
//                 quantityBags,
//                 advanceAmount,
//                 messageToSeller,
//                 bidType,
//             } = req.body;

//             if (!userId || !userName || !productId) {
//                 throw { status: 400, message: "userId, userName, productId are required" };
//             }

//             if (!mongoose.Types.ObjectId.isValid(productId)) {
//                 throw { status: 400, message: "Invalid productId" };
//             }

//             const price = Number(bidPricePerBag);
//             const qty = Number(quantityBags);
//             const adv = Number(advanceAmount);

//             if (!Number.isFinite(price) || price <= 0) {
//                 throw { status: 400, message: "bidPricePerBag must be > 0" };
//             }
//             if (!Number.isFinite(qty) || qty <= 0) {
//                 throw { status: 400, message: "quantityBags must be > 0" };
//             }
//             if (!Number.isFinite(adv) || adv < 0) {
//                 throw { status: 400, message: "advanceAmount must be >= 0" };
//             }

//             const safeBidType = ["NORMAL", "LOCK"].includes(String(bidType)) ? String(bidType) : "NORMAL";

//             const product = await Product.findById(productId).session(session);
//             if (!product) {
//                 throw { status: 404, message: "Product not found" };
//             }

//             if (String(product.status) !== "Active") {
//                 throw { status: 403, message: "Product is not Active" };
//             }

//             const totalAmount = price * qty;
//             const dueAmount = totalAmount - adv;

//             if (dueAmount < 0) {
//                 throw { status: 400, message: "Advance amount cannot exceed total amount" };
//             }

//             // 3) ✅ Reserve stock for EVERY bid (NORMAL + LOCK) using atomic update
//             // If you still need LOCK-only rules like isLocked false, keep that condition only for LOCK.
//             const reserveQuery = {
//                 _id: productId,
//                 availableQuantity: { $gte: qty },
//             };

//             if (safeBidType === "LOCK") {
//                 reserveQuery.isLocked = false; // keep your lock rule if needed
//             }

//             const updatedProduct = await Product.findOneAndUpdate(
//                 reserveQuery,
//                 { $inc: { availableQuantity: -qty } },
//                 { new: true, session }
//             );

//             if (!updatedProduct) {
//                 throw { status: 400, message: "Not enough available quantity" };
//             }

//             // 4) ✅ Allow multiple bids for same user (NO blocking with existingBid)
//             const bidDoc = {
//                 userId,
//                 userName,
//                 productId,
//                 productSnapshot: product.toObject(),
//                 bidPricePerBag: price,
//                 quantityBags: qty,
//                 advanceAmount: adv,
//                 totalAmount,
//                 dueAmount,
//                 messageToSeller: messageToSeller || "",
//                 bidType: safeBidType,
//                 status: "pending",
//             };

//             const bid = await Bid.create([bidDoc], { session });

//             // 5) Notify vendor
//             const vendorId = product.vendorId;
//             if (vendorId) {
//                 const vendor = await Farmer.findById(vendorId).session(session);
//                 if (vendor?.fcmToken) {
//                     await sendPushNotification(
//                         vendor.fcmToken,
//                         "📢 New Bid Received",
//                         `New bid on ${product.productTitle || "your product"}`
//                     );
//                 }
//             }

//             // store result for response outside transaction
//             res.locals.createdBid = bid?.[0];
//         });

//         return res.status(201).json({
//             success: true,
//             bid: res.locals.createdBid,
//         });
//     } catch (err) {
//         const status = err?.status || 500;
//         const message = err?.message || err?.error || err?.toString() || "Server error";

//         console.log("createBid error:", err);
//         return res.status(status).json({ success: false, error: message });
//     } finally {
//         try {
//             session.endSession();
//         } catch (e) { }
//     }
// };

exports.createBid = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const {
                userId,
                userName,
                productId,
                bidPricePerBag,
                quantityBags,
                advanceAmount,
                messageToSeller,
                bidType,
            } = req.body;

            if (!userId || !userName || !productId) {
                throw { status: 400, message: "userId, userName, productId are required" };
            }

            if (!mongoose.Types.ObjectId.isValid(productId)) {
                throw { status: 400, message: "Invalid productId" };
            }

            const price = Number(bidPricePerBag);
            const qty = Number(quantityBags);
            const adv = Number(advanceAmount);

            if (!Number.isFinite(price) || price <= 0) {
                throw { status: 400, message: "bidPricePerBag must be > 0" };
            }
            if (!Number.isFinite(qty) || qty <= 0) {
                throw { status: 400, message: "quantityBags must be > 0" };
            }
            if (!Number.isFinite(adv) || adv < 0) {
                throw { status: 400, message: "advanceAmount must be >= 0" };
            }

            const safeBidType = ["NORMAL", "LOCK"].includes(String(bidType))
                ? String(bidType)
                : "NORMAL";

            // ✅ Only validate product exists + Active
            const product = await Product.findById(productId).session(session);
            if (!product) {
                throw { status: 404, message: "Product not found" };
            }

            if (String(product.status) !== "Active") {
                throw { status: 403, message: "Product is not Active" };
            }

            // ✅ NO inventory reservation / NO availableQuantity update
            const totalAmount = price * qty;
            const dueAmount = totalAmount - adv;

            if (dueAmount < 0) {
                throw { status: 400, message: "Advance amount cannot exceed total amount" };
            }

            // ✅ Allow multiple bids for same user
            const bidDoc = {
                userId,
                userName,
                productId,
                productSnapshot: product.toObject(),
                bidPricePerBag: price,
                quantityBags: qty,
                advanceAmount: adv,
                totalAmount,
                dueAmount,
                messageToSeller: messageToSeller || "",
                bidType: safeBidType,
                status: "pending",
            };

            const bid = await Bid.create([bidDoc], { session });

            // ✅ Notify vendor (optional)
            const vendorId = product.vendorId;
            if (vendorId) {
                const vendor = await Farmer.findById(vendorId).session(session);
                if (vendor?.fcmToken) {
                    await sendPushNotification(
                        vendor.fcmToken,
                        "📢 New Bid Received",
                        `New bid on ${product.productTitle || "your product"}`
                    );
                }
            }

            res.locals.createdBid = bid?.[0];
        });

        return res.status(201).json({
            success: true,
            bid: res.locals.createdBid,
        });
    } catch (err) {
        const status = err?.status || 500;
        const message = err?.message || err?.error || err?.toString() || "Server error";

        console.log("createBid error:", err);
        return res.status(status).json({ success: false, error: message });
    } finally {
        try {
            session.endSession();
        } catch (e) { }
    }
};


exports.lockAfterPayment = async (req, res) => {
    try {
        const { productId, userId, paymentId, orderId } = req.body;

        if (!productId || !userId) {
            return res.status(400).json({ error: "Missing userId or productId" });
        }

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ error: "Product not found" });

        // ✅ Check if already locked
        if (product.isLocked) {
            const now = new Date();
            const expired = product.lockExpiresAt && product.lockExpiresAt < now;

            if (!expired) {
                return res.status(400).json({
                    error: `Product locked by ${product.lockedBy} until ${product.lockExpiresAt}`
                });
            }
            // Auto unlock expired
            product.isLocked = false;
            product.lockedBy = null;
            product.lockExpiresAt = null;
        }

        // ✅ LOCK FOR 20 MINS
        product.isLocked = true;
        product.lockedBy = userId;
        product.lockExpiresAt = new Date(Date.now() + 20 * 60 * 1000);

        await product.save();

        console.log(`🔒 ${productId} LOCKED by ${userId} until ${product.lockExpiresAt}`);

        res.json({
            success: true,
            locked: true,
            lockedBy: userId,
            lockExpiresAt: product.lockExpiresAt,
            message: "✅ Locked for 20 mins exclusive bidding!"
        });
    } catch (err) {
        console.error("Lock error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.getLockStatus = async (req, res) => {
    try {
        const productId = req.params.productId;
        const product = await Product.findById(productId).select("isLocked lockedBy lockExpiresAt");

        if (!product) return res.status(404).json({ error: "Product not found" });

        const now = new Date();

        // ✅ AUTO-UNLOCK EXPIRED LOCKS
        if (product.isLocked && product.lockExpiresAt && product.lockExpiresAt < now) {
            product.isLocked = false;
            product.lockedBy = null;
            product.lockExpiresAt = null;
            await product.save();
            console.log(`⏰ AUTO-UNLOCKED ${productId}`);
        }

        res.json({
            locked: product.isLocked || false,
            lockedBy: product.lockedBy || null,
            lockExpiresAt: product.lockExpiresAt || null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getUserBidsForProduct = async (req, res) => {
    try {
        const { userId, productId } = req.params;
        const bids = await Bid.find({ userId, productId })
            .sort({ createdAt: -1 })
            .limit(1);
        res.json(bids);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllBids = async (req, res) => {
    const bids = await Bid.find().sort({ createdAt: -1 });
    res.json(bids);
};




exports.vendorAcceptBid = async (req, res) => {
    try {
        const bidId = String(req.params.id || "").trim();

        if (!mongoose.Types.ObjectId.isValid(bidId)) {
            return res.status(400).json({ success: false, error: "Invalid Bid ID" });
        }

        const bid = await Bid.findByIdAndUpdate(
            bidId,
            { status: "vendor_accepted" },
            { new: true }
        );

        if (!bid) {
            return res.status(404).json({ success: false, error: "Bid not found" });
        }

        const product = await Product.findById(bid.productId).select("vendorId").lean();

        try {
            if (bid.userId) {
                const trader = await Trader.findById(bid.userId).lean();
                if (trader?.fcmToken) {
                    await sendPushNotificationTrader(
                        trader.fcmToken,
                        "✅ Bid Accepted by Vendor",
                        "Vendor accepted your bid. Waiting for admin approval."
                    );
                }
            }
        } catch (pushErr) {
            console.log("vendorAcceptBid push error:", pushErr?.message || pushErr);
        }

        try {
            await InAppNotification.create({
                userId: safeId(bid.userId),
                notificationType: "BIDING",
                thumbnailTitle: "Bid accepted by Vendor",
                notifyTo: "customer",
                message: "Your bid has been accepted by the vendor. Waiting for admin approval.",
                metaData: {
                    bidId: safeId(bid._id),
                    productId: safeId(bid.productId),
                    vendorId: safeId(product?.vendorId),
                    traderId: safeId(bid.userId),
                    status: "vendor_accepted",
                    quantityBags: Number(bid.quantityBags || 0),
                    pricePerUnit: Number(bid.pricePerUnit || 0),
                },
                status: "unread",
            });
        } catch (notiErr) {
            console.log("vendorAcceptBid in-app error:", notiErr?.message || notiErr);
        }

        return res.json({ success: true, bid });
    } catch (error) {
        console.error("vendorAcceptBid error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};


exports.vendorRejectBid = async (req, res) => {
    try {
        const bidId = String(req.params.id || "").trim();

        if (!mongoose.Types.ObjectId.isValid(bidId)) {
            return res.status(400).json({ success: false, error: "Invalid Bid ID" });
        }

        // ✅ optional: prevent double reject
        const bid = await Bid.findById(bidId);
        if (!bid) {
            return res.status(404).json({ success: false, error: "Bid not found" });
        }

        if (["vendor_rejected"].includes(String(bid.status))) {
            return res.status(400).json({
                success: false,
                error: `Bid already ${bid.status}`,
            });
        }

        // ✅ update status
        bid.status = "vendor_rejected";
        await bid.save();

        // ✅ get vendorId from product (for metadata)
        let product = null;
        try {
            product = await Product.findById(bid.productId).select("vendorId").lean();
        } catch (e) {
            product = null;
        }

        // ✅ Push to trader (optional)
        try {
            if (bid.userId) {
                const trader = await Trader.findById(bid.userId).lean();
                if (trader?.fcmToken) {
                    await sendPushNotificationTrader(
                        trader.fcmToken,
                        "❌ Bid Rejected by Vendor",
                        "Vendor rejected your bid. You can place a new bid or try again."
                    );
                }
            }
        } catch (pushErr) {
            console.log("vendorRejectBid push error:", pushErr?.message || pushErr);
        }

        // ✅ In-App notification to trader/customer
        try {
            await InAppNotification.create({
                userId: safeId(bid.userId), // traderId
                notificationType: "BIDING",
                thumbnailTitle: "Bid rejected by Vendor",
                notifyTo: "customer", // same as your accept flow
                message:
                    "Your bid has been rejected by the vendor. You can place a new bid.",
                metaData: {
                    bidId: safeId(bid._id),
                    productId: safeId(bid.productId),
                    vendorId: safeId(product?.vendorId),
                    traderId: safeId(bid.userId),
                    status: "vendor_rejected",
                    quantityBags: Number(bid.quantityBags || 0),
                    pricePerUnit: Number(bid.pricePerUnit || 0),
                },
                status: "unread",
            });
        } catch (notiErr) {
            console.log("vendorRejectBid in-app error:", notiErr?.message || notiErr);
        }

        return res.json({ success: true, bid });
    } catch (error) {
        console.error("vendorRejectBid error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};


// exports.adminApproveBid = async (req, res) => {
//     try {
//         const bidId = String(req.params.id || "").trim();

//         if (!mongoose.Types.ObjectId.isValid(bidId)) {
//             return res.status(400).json({ success: false, error: "Invalid Bid ID" });
//         }

//         const bid = await Bid.findById(bidId);
//         if (!bid) return res.status(404).json({ success: false, error: "Bid not found" });

//         if (String(bid.status) === "admin_approved") {
//             const product = await Product.findByIdAndUpdate(
//                 bid.productId,
//                 { isLocked: false, lockedBy: null, lockExpiresAt: null },
//                 { new: true }
//             );

//             try {
//                 if (bid.userId) {
//                     const trader = await Trader.findById(bid.userId).lean();
//                     if (trader?.fcmToken) {
//                         await sendPushNotificationTrader(
//                             trader.fcmToken,
//                             "🎉 Bid Approved by Admin",
//                             "Your bid has been approved by admin. Please proceed with next steps."
//                         );
//                     }
//                 }

//                 if (product?.vendorId) {
//                     const farmer = await Farmer.findById(product.vendorId).lean();
//                     if (farmer?.fcmToken) {
//                         await sendPushNotification(
//                             farmer.fcmToken,
//                             "✅ Bid Approved by Admin",
//                             "Admin approved the bid. You can proceed with the order."
//                         );
//                     }
//                 }
//             } catch (pushErr) {
//                 console.log("adminApproveBid (already approved) push error:", pushErr?.message || pushErr);
//             }

//             try {
//                 if (bid.userId) {
//                     await InAppNotification.create({
//                         userId: safeId(bid.userId),
//                         notificationType: "BIDING",
//                         thumbnailTitle: "Bid approved by Admin",
//                         notifyTo: "customer",
//                         message: "Admin approved your bid. Please proceed with next steps.",
//                         metaData: {
//                             bidId: safeId(bid._id),
//                             productId: safeId(bid.productId),
//                             vendorId: safeId(product?.vendorId),
//                             traderId: safeId(bid.userId),
//                             status: "admin_approved",
//                             quantityBags: Number(bid.quantityBags || 0),
//                         },
//                         status: "unread",
//                     });
//                 }

//                 if (product?.vendorId) {
//                     await InAppNotification.create({
//                         userId: safeId(product.vendorId),
//                         notificationType: "BIDING",
//                         thumbnailTitle: "Bid approved",
//                         notifyTo: "vendor",
//                         message: "Admin approved the bid. You can proceed with the order.",
//                         metaData: {
//                             bidId: safeId(bid._id),
//                             productId: safeId(bid.productId),
//                             vendorId: safeId(product.vendorId),
//                             traderId: safeId(bid.userId),
//                             status: "admin_approved",
//                             quantityBags: Number(bid.quantityBags || 0),
//                         },
//                         status: "unread",
//                     });
//                 }
//             } catch (notiErr) {
//                 console.log("adminApproveBid (already approved) in-app error:", notiErr?.message || notiErr);
//             }

//             return res.json({ success: true, bid, product });
//         }

//         const bidQty = Number(bid.quantityBags);
//         if (!Number.isFinite(bidQty) || bidQty <= 0) {
//             return res.status(400).json({ success: false, error: "Invalid bid quantity" });
//         }

//         console.log("bidQty", bidQty);

//         const product = await Product.findOneAndUpdate(
//             { _id: bid.productId, availableQuantity: { $gte: bidQty } },
//             {
//                 $inc: { availableQuantity: -bidQty },
//                 $set: { isLocked: false, lockedBy: null, lockExpiresAt: null },
//             },
//             { new: true }
//         );

//         console.log("product", product)



//         bid.status = "admin_approved";
//         await bid.save();

//         try {
//             if (bid.userId) {
//                 const trader = await Trader.findById(bid.userId).lean();
//                 if (trader?.fcmToken) {
//                     await sendPushNotificationTrader(
//                         trader.fcmToken,
//                         "🎉 Bid Approved by Admin",
//                         "Your bid has been approved by admin. Please proceed with next steps."
//                     );
//                 }
//             }

//             if (product?.vendorId) {
//                 const farmer = await Farmer.findById(product.vendorId).lean();
//                 if (farmer?.fcmToken) {
//                     await sendPushNotification(
//                         farmer.fcmToken,
//                         "✅ Bid Approved by Admin",
//                         "Admin approved the bid. You can proceed with the order."
//                     );
//                 }
//             }
//         } catch (pushErr) {
//             console.log("adminApproveBid push error:", pushErr?.message || pushErr);
//         }

//         try {
//             if (bid.userId) {
//                 await InAppNotification.create({
//                     userId: safeId(bid.userId),
//                     notificationType: "BIDING",
//                     thumbnailTitle: "Bid approved by Admin",
//                     notifyTo: "customer",
//                     message: "Admin approved your bid. Please proceed with next steps.",
//                     metaData: {
//                         bidId: safeId(bid._id),
//                         productId: safeId(bid.productId),
//                         vendorId: safeId(product?.vendorId),
//                         traderId: safeId(bid.userId),
//                         status: "admin_approved",
//                         quantityBags: Number(bid.quantityBags || 0),
//                     },
//                     status: "unread",
//                 });
//             }

//             if (product?.vendorId) {
//                 await InAppNotification.create({
//                     userId: safeId(product.vendorId),
//                     notificationType: "BIDING",
//                     thumbnailTitle: "Bid approved",
//                     notifyTo: "vendor",
//                     message: "Admin approved the bid. You can proceed with the order.",
//                     metaData: {
//                         bidId: safeId(bid._id),
//                         productId: safeId(bid.productId),
//                         vendorId: safeId(product.vendorId),
//                         traderId: safeId(bid.userId),
//                         status: "admin_approved",
//                         quantityBags: Number(bid.quantityBags || 0),
//                     },
//                     status: "unread",
//                 });
//             }
//         } catch (notiErr) {
//             console.log("adminApproveBid in-app error:", notiErr?.message || notiErr);
//         }

//         return res.json({ success: true, bid, product });
//     } catch (error) {
//         console.error("adminApproveBid error:", error);
//         return res.status(500).json({ success: false, error: error.message });
//     }
// };

// exports.adminrejectBid = async (req, res) => {
//     const session = await mongoose.startSession();

//     try {
//         session.startTransaction();

//         const bidId = String(req.params.id || "").trim();

//         if (!mongoose.Types.ObjectId.isValid(bidId)) {
//             return res.status(400).json({ success: false, error: "Invalid Bid ID" });
//         }

//         const bid = await Bid.findById(bidId).session(session);
//         if (!bid) {
//             return res.status(404).json({ success: false, error: "Bid not found" });
//         }

//         // ✅ Prevent double reject
//         if (["rejected", "inactive"].includes(String(bid.status))) {
//             return res.status(400).json({
//                 success: false,
//                 error: `Bid already ${bid.status}`,
//             });
//         }

//         const prevStatus = bid.status;

//         const bidQty = Number(bid.quantityBags);
//         if (!Number.isFinite(bidQty) || bidQty <= 0) {
//             return res.status(400).json({ success: false, error: "Invalid bid quantity" });
//         }

//         bid.status = "rejected";
//         await bid.save({ session });

//         const product = await Product.findByIdAndUpdate(
//             bid.productId,
//             {
//                 $inc: { availableQuantity: bidQty },
//                 $set: { isLocked: false, lockedBy: null, lockExpiresAt: null },
//             },
//             { new: true, session }
//         );

//         await session.commitTransaction();
//         session.endSession();

//         try {
//             if (bid.userId) {
//                 const trader = await Trader.findById(bid.userId).lean();
//                 if (trader?.fcmToken) {
//                     await sendPushNotificationTrader(
//                         trader.fcmToken,
//                         "❌ Bid Rejected by Admin",
//                         "Your bid has been rejected by admin."
//                     );
//                 }
//             }

//             if (product?.vendorId) {
//                 const farmer = await Farmer.findById(product.vendorId).lean();
//                 if (farmer?.fcmToken) {
//                     await sendPushNotification(
//                         farmer.fcmToken,
//                         "❌ Bid Rejected by Admin",
//                         "Admin rejected the bid."
//                     );
//                 }
//             }
//         } catch (notifyErr) {
//             console.log("adminrejectBid push error:", notifyErr?.message || notifyErr);
//         }

//         try {
//             if (bid.userId) {
//                 await InAppNotification.create({
//                     userId: safeId(bid.userId),
//                     notificationType: "BID_ADMIN_REJECTED",
//                     thumbnailTitle: "Bid rejected by Admin",
//                     notifyTo: "customer",
//                     message: "Admin rejected your bid.",
//                     metaData: {
//                         bidId: safeId(bid._id),
//                         productId: safeId(bid.productId),
//                         vendorId: safeId(product?.vendorId),
//                         traderId: safeId(bid.userId),
//                         status: "rejected",
//                         quantityBags: Number(bid.quantityBags || 0),
//                     },
//                     status: "unread",
//                 });
//             }

//             if (product?.vendorId) {
//                 await InAppNotification.create({
//                     userId: safeId(product.vendorId),
//                     notificationType: "BID_ADMIN_REJECTED",
//                     thumbnailTitle: "Bid rejected",
//                     notifyTo: "vendor",
//                     message: "Admin rejected the bid.",
//                     metaData: {
//                         bidId: safeId(bid._id),
//                         productId: safeId(bid.productId),
//                         vendorId: safeId(product.vendorId),
//                         traderId: safeId(bid.userId),
//                         status: "rejected",
//                         quantityBags: Number(bid.quantityBags || 0),
//                     },
//                     status: "unread",
//                 });
//             }
//         } catch (notiErr) {
//             console.log("adminrejectBid in-app error:", notiErr?.message || notiErr);
//         }

//         return res.json({
//             success: true,
//             message: "Bid rejected successfully",
//             prevStatus,
//             rollbackQty: bidQty,
//             bid,
//             product,
//         });
//     } catch (error) {
//         try {
//             await session.abortTransaction();
//             session.endSession();
//         } catch (e) { }

//         console.error("adminrejectBid error:", error);
//         return res.status(500).json({
//             success: false,
//             error: error.message || "Server Error",
//         });
//     }
// };



// exports.adminApproveBid = async (req, res) => {
//     const session = await mongoose.startSession();

//     try {
//         session.startTransaction();

//         const bidId = String(req.params.id || "").trim();
//         if (!mongoose.Types.ObjectId.isValid(bidId)) {
//             await session.abortTransaction();
//             session.endSession();
//             return res.status(400).json({ success: false, error: "Invalid Bid ID" });
//         }

//         const bid = await Bid.findById(bidId).session(session);
//         if (!bid) {
//             await session.abortTransaction();
//             session.endSession();
//             return res.status(404).json({ success: false, error: "Bid not found" });
//         }

//         const bidQty = Number(bid.quantityBags);
//         if (!Number.isFinite(bidQty) || bidQty <= 0) {
//             await session.abortTransaction();
//             session.endSession();
//             return res.status(400).json({ success: false, error: "Invalid bid quantity" });
//         }

//         // ✅ Fetch product inside session
//         const existingProduct = await Product.findById(bid.productId).session(session);
//         if (!existingProduct) {
//             await session.abortTransaction();
//             session.endSession();
//             return res.status(404).json({ success: false, error: "Product not found" });
//         }

//         // ✅ If already admin approved => just ensure sellingQuantity=0 + unlock
//         if (String(bid.status) === "admin_approved") {
//             const product = await Product.findByIdAndUpdate(
//                 bid.productId,
//                 {
//                     $set: {
//                         isLocked: false,
//                         lockedBy: null,
//                         lockExpiresAt: null,
//                         sellingQuantity: 0, // ✅ IMPORTANT
//                     },
//                 },
//                 { new: true, session }
//             );

//             await session.commitTransaction();
//             session.endSession();

//             // (keep your push + in-app notifications here if you want)
//             return res.json({ success: true, bid, product });
//         }

//         // ✅ STRICT sellingQuantity rule:
//         // if sellingQuantity > 0 => bidQty MUST equal sellingQuantity
//         const currentSellingQty = Number(existingProduct.sellingQuantity || 0);
//         if (currentSellingQty > 0 && bidQty !== currentSellingQty) {
//             await session.abortTransaction();
//             session.endSession();
//             return res.status(400).json({
//                 success: false,
//                 error: `Bid qty mismatch. Must be exactly sellingQuantity (${currentSellingQty}).`,
//             });
//         }


//         const product = await Product.findOneAndUpdate(
//             { _id: bid.productId, availableQuantity: { $gte: bidQty } },
//             {
//                 $inc: { availableQuantity: -bidQty },
//                 $set: {
//                     isLocked: false,
//                     lockedBy: null,
//                     lockExpiresAt: null,
//                     sellingQuantity: 0,
//                 },
//             },
//             { new: true, session }
//         );

//         if (!product) {
//             await session.abortTransaction();
//             session.endSession();
//             return res.status(400).json({
//                 success: false,
//                 error: "Not enough stock to approve this bid",
//             });
//         }

//         bid.status = "admin_approved";
//         await bid.save({ session });

//         await session.commitTransaction();
//         session.endSession();

//         // ✅ Notifications (your existing code) - keep same, OUTSIDE tx is fine
//         try {
//             if (bid.userId) {
//                 const trader = await Trader.findById(bid.userId).lean();
//                 if (trader?.fcmToken) {
//                     await sendPushNotificationTrader(
//                         trader.fcmToken,
//                         "🎉 Bid Approved by Admin",
//                         "Your bid has been approved by admin. Please proceed with next steps."
//                     );
//                 }
//             }

//             if (product?.vendorId) {
//                 const farmer = await Farmer.findById(product.vendorId).lean();
//                 if (farmer?.fcmToken) {
//                     await sendPushNotification(
//                         farmer.fcmToken,
//                         "✅ Bid Approved by Admin",
//                         "Admin approved the bid. You can proceed with the order."
//                     );
//                 }
//             }
//         } catch (pushErr) {
//             console.log("adminApproveBid push error:", pushErr?.message || pushErr);
//         }

//         try {
//             if (bid.userId) {
//                 await InAppNotification.create({
//                     userId: safeId(bid.userId),
//                     notificationType: "BIDING",
//                     thumbnailTitle: "Bid approved by Admin",
//                     notifyTo: "customer",
//                     message: "Admin approved your bid. Please proceed with next steps.",
//                     metaData: {
//                         bidId: safeId(bid._id),
//                         productId: safeId(bid.productId),
//                         vendorId: safeId(product?.vendorId),
//                         traderId: safeId(bid.userId),
//                         status: "admin_approved",
//                         quantityBags: Number(bid.quantityBags || 0),
//                     },
//                     status: "unread",
//                 });
//             }

//             if (product?.vendorId) {
//                 await InAppNotification.create({
//                     userId: safeId(product.vendorId),
//                     notificationType: "BIDING",
//                     thumbnailTitle: "Bid approved",
//                     notifyTo: "vendor",
//                     message: "Admin approved the bid. You can proceed with the order.",
//                     metaData: {
//                         bidId: safeId(bid._id),
//                         productId: safeId(bid.productId),
//                         vendorId: safeId(product.vendorId),
//                         traderId: safeId(bid.userId),
//                         status: "admin_approved",
//                         quantityBags: Number(bid.quantityBags || 0),
//                     },
//                     status: "unread",
//                 });
//             }
//         } catch (notiErr) {
//             console.log("adminApproveBid in-app error:", notiErr?.message || notiErr);
//         }

//         return res.json({ success: true, bid, product });
//     } catch (error) {
//         try {
//             await session.abortTransaction();
//             session.endSession();
//         } catch (e) { }

//         console.error("adminApproveBid error:", error);
//         return res.status(500).json({ success: false, error: error.message });
//     }
// };

exports.adminApproveBid = async (req, res) => {
    const session = await mongoose.startSession();

    let bid = null;
    let product = null;

    try {
        session.startTransaction();

        const bidId = String(req.params.id || "").trim();
        if (!mongoose.Types.ObjectId.isValid(bidId)) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, error: "Invalid Bid ID" });
        }

        bid = await Bid.findById(bidId).session(session);
        if (!bid) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, error: "Bid not found" });
        }

        // ✅ Prevent double approval (prevents double stock deduction)
        if (String(bid.status) === "admin_approved") {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                error: "Bid already admin approved",
            });
        }

        const bidQty = Number(bid.quantityBags);
        if (!Number.isFinite(bidQty) || bidQty <= 0) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, error: "Invalid bid quantity" });
        }

        // ✅ Fetch product in txn
        const existingProduct = await Product.findById(bid.productId).session(session);
        if (!existingProduct) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, error: "Product not found" });
        }

        // ✅ STRICT sellingQuantity rule (keep if your business logic needs this)
        const currentSellingQty = Number(existingProduct.sellingQuantity || 0);
        if (currentSellingQty > 0 && bidQty !== currentSellingQty) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                error: `Bid qty mismatch. Must be exactly sellingQuantity (${currentSellingQty}).`,
            });
        }

        // ✅ Stock check
        const currentAvailableQty = Number(existingProduct.availableQuantity || 0);
        if (currentAvailableQty < bidQty) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                error: "Not enough stock to approve this bid",
            });
        }

        // ✅ Deduct stock + reset sellingQuantity + unlock
        product = await Product.findByIdAndUpdate(
            bid.productId,
            {
                $inc: { availableQuantity: -bidQty }, // ✅ FINAL COMMIT HERE
                $set: {
                    isLocked: false,
                    lockedBy: null,
                    lockExpiresAt: null,
                    sellingQuantity: 0, // ✅ correct on admin approval
                },
            },
            { new: true, session }
        );

        if (!product) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                error: "Stock update failed",
            });
        }

        // ✅ Update bid status
        bid.status = "admin_approved";
        await bid.save({ session });

        await session.commitTransaction();
        session.endSession();

        // ✅ Notifications should be AFTER commit
        // ------------------------------------------------
        // Push Notifications
        try {
            // Trader push
            if (bid.userId) {
                const trader = await Trader.findById(bid.userId).lean();
                if (trader?.fcmToken) {
                    await sendPushNotificationTrader(
                        trader.fcmToken,
                        "🎉 Bid Approved by Admin",
                        "Your bid has been approved by admin. Please proceed with next steps."
                    );
                }
            }

            // Farmer push
            if (product?.vendorId) {
                const farmer = await Farmer.findById(product.vendorId).lean();
                if (farmer?.fcmToken) {
                    await sendPushNotification(
                        farmer.fcmToken,
                        "✅ Bid Approved by Admin",
                        "Admin approved the bid. You can proceed with the order."
                    );
                }
            }
        } catch (pushErr) {
            console.log("adminApproveBid push error:", pushErr?.message || pushErr);
        }

        // In-app Notifications
        try {
            // Trader in-app
            if (bid.userId) {
                await InAppNotification.create({
                    userId: safeId(bid.userId),
                    notificationType: "BIDING",
                    thumbnailTitle: "Bid approved by Admin",
                    notifyTo: "customer",
                    message: "Admin approved your bid. Please proceed with next steps.",
                    metaData: {
                        bidId: safeId(bid._id),
                        productId: safeId(bid.productId),
                        vendorId: safeId(product?.vendorId),
                        traderId: safeId(bid.userId),
                        status: "admin_approved",
                        quantityBags: Number(bid.quantityBags || 0),
                    },
                    status: "unread",
                });
            }

            // Farmer in-app
            if (product?.vendorId) {
                await InAppNotification.create({
                    userId: safeId(product.vendorId),
                    notificationType: "BIDING",
                    thumbnailTitle: "Bid approved",
                    notifyTo: "vendor",
                    message: "Admin approved the bid. You can proceed with the order.",
                    metaData: {
                        bidId: safeId(bid._id),
                        productId: safeId(bid.productId),
                        vendorId: safeId(product.vendorId),
                        traderId: safeId(bid.userId),
                        status: "admin_approved",
                        quantityBags: Number(bid.quantityBags || 0),
                    },
                    status: "unread",
                });
            }
        } catch (notiErr) {
            console.log("adminApproveBid in-app error:", notiErr?.message || notiErr);
        }

        return res.json({ success: true, bid, product });
    } catch (error) {
        try {
            await session.abortTransaction();
        } catch (e) { }
        try {
            session.endSession();
        } catch (e) { }

        console.error("adminApproveBid error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};


exports.adminrejectBid = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const bidId = String(req.params.id || "").trim();
        if (!mongoose.Types.ObjectId.isValid(bidId)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, error: "Invalid Bid ID" });
        }

        const bid = await Bid.findById(bidId).session(session);
        if (!bid) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, error: "Bid not found" });
        }

        // ✅ Prevent double reject
        if (["rejected", "inactive"].includes(String(bid.status))) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                error: `Bid already ${bid.status}`,
            });
        }

        const prevStatus = bid.status;

        const bidQty = Number(bid.quantityBags);
        if (!Number.isFinite(bidQty) || bidQty <= 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, error: "Invalid bid quantity" });
        }

        // ✅ Fetch product first to decide sellingQuantity restore
        const existingProduct = await Product.findById(bid.productId).session(session);
        if (!existingProduct) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, error: "Product not found" });
        }

        bid.status = "rejected";
        await bid.save({ session });

        // ✅ Restore sellingQuantity:
        // If product sellingQuantity already > 0, keep it.
        // Else restore using bidQty (because user bid EXACT sellingQuantity in your rule).
        const currentSellingQty = Number(existingProduct.sellingQuantity || 0);
        const restoreSellingQty = currentSellingQty > 0 ? currentSellingQty : bidQty;

        const product = await Product.findByIdAndUpdate(
            bid.productId,
            {
                $inc: { availableQuantity: bidQty }, // keep your existing rollback
                $set: {
                    isLocked: false,
                    lockedBy: null,
                    lockExpiresAt: null,
                    sellingQuantity: restoreSellingQty, // ✅ IMPORTANT
                },
            },
            { new: true, session }
        );

        await session.commitTransaction();
        session.endSession();

        // ✅ Notifications (keep yours)
        try {
            if (bid.userId) {
                const trader = await Trader.findById(bid.userId).lean();
                if (trader?.fcmToken) {
                    await sendPushNotificationTrader(
                        trader.fcmToken,
                        "❌ Bid Rejected by Admin",
                        "Your bid has been rejected by admin."
                    );
                }
            }

            if (product?.vendorId) {
                const farmer = await Farmer.findById(product.vendorId).lean();
                if (farmer?.fcmToken) {
                    await sendPushNotification(
                        farmer.fcmToken,
                        "❌ Bid Rejected by Admin",
                        "Admin rejected the bid."
                    );
                }
            }
        } catch (notifyErr) {
            console.log("adminrejectBid push error:", notifyErr?.message || notifyErr);
        }

        try {
            if (bid.userId) {
                await InAppNotification.create({
                    userId: safeId(bid.userId),
                    notificationType: "BID_ADMIN_REJECTED",
                    thumbnailTitle: "Bid rejected by Admin",
                    notifyTo: "customer",
                    message: "Admin rejected your bid.",
                    metaData: {
                        bidId: safeId(bid._id),
                        productId: safeId(bid.productId),
                        vendorId: safeId(product?.vendorId),
                        traderId: safeId(bid.userId),
                        status: "rejected",
                        quantityBags: Number(bid.quantityBags || 0),
                    },
                    status: "unread",
                });
            }

            if (product?.vendorId) {
                await InAppNotification.create({
                    userId: safeId(product.vendorId),
                    notificationType: "BID_ADMIN_REJECTED",
                    thumbnailTitle: "Bid rejected",
                    notifyTo: "vendor",
                    message: "Admin rejected the bid.",
                    metaData: {
                        bidId: safeId(bid._id),
                        productId: safeId(bid.productId),
                        vendorId: safeId(product.vendorId),
                        traderId: safeId(bid.userId),
                        status: "rejected",
                        quantityBags: Number(bid.quantityBags || 0),
                    },
                    status: "unread",
                });
            }
        } catch (notiErr) {
            console.log("adminrejectBid in-app error:", notiErr?.message || notiErr);
        }

        return res.json({
            success: true,
            message: "Bid rejected successfully",
            prevStatus,
            rollbackQty: bidQty,
            restoredSellingQuantity: restoreSellingQty,
            bid,
            product,
        });
    } catch (error) {
        try {
            await session.abortTransaction();
            session.endSession();
        } catch (e) { }

        console.error("adminrejectBid error:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Server Error",
        });
    }
};


exports.getBidsByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const bids = await Bid.find({ userId })
            .sort({ createdAt: -1 })
            .select('-__v');

        res.status(200).json(bids);
    } catch (error) {
        console.error('Error in getBidsByUser:', error);
        res.status(500).json({ error: 'Server error while fetching bids' });
    }
};

exports.getBidsByVendor = async (req, res) => {
    try {
        const { vendorId } = req.params;

        if (!vendorId) {
            return res.status(400).json({ error: "Vendor ID is required" });
        }

        const bids = await Bid.find({
            "productSnapshot.vendorId": vendorId
        })
            .sort({ createdAt: -1 })
            .select('-__v');

        res.status(200).json({
            success: true,
            count: bids.length,
            data: bids
        });
    } catch (error) {
        console.error("Error fetching vendor bids:", error);
        res.status(500).json({ error: "Server error while fetching vendor bids" });
    }
};
