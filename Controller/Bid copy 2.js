const Bid = require("../Modal/Bid");
const Product = require('../Modal/Product');
const sendPushNotification = require("../utils/sendPushNotification");
const sendPushNotificationTrader = require("../utilstrader/sendPushNotification")
const Farmer = require("../Modal/Farmer");
const Trader = require("../Modal/Trader");
const { default: mongoose } = require("mongoose");
const InAppNotification = require("../Modal/Notification")



// exports.createBid = async (req, res) => {
//     try {
//         const {
//             userId,
//             userName,
//             productId,
//             bidPricePerBag,
//             quantityBags,
//             advanceAmount,
//             messageToSeller,
//             bidType,
//         } = req.body;

//         const product = await Product.findById(productId);
//         if (!product) return res.status(404).json({ error: "Product not found" });

//         const existingBid = await Bid.findOne({
//             userId,
//             productId,
//             status: { $nin: ["rejected", "inactive"] },
//         });

//         if (existingBid) {
//             return res.status(400).json({ error: "Already bid placed" });
//         }

//         const totalAmount = bidPricePerBag * quantityBags;
//         const dueAmount = totalAmount - advanceAmount;
//         if (dueAmount < 0) return res.status(400).json({ error: "Invalid amount" });

//         const bid = await Bid.create({
//             userId,
//             userName,
//             productId,
//             productSnapshot: product.toObject(),
//             bidPricePerBag,
//             quantityBags,
//             advanceAmount,
//             totalAmount,
//             dueAmount,
//             messageToSeller,
//             bidType,
//             status: "pending",
//         });

//         const vendorId = product.vendorId;

//         if (vendorId) {
//             const vendor = await Farmer.findById(vendorId);

//             console.log("vendor", vendor)


//             if (vendor?.fcmToken) {
//                 await sendPushNotification(
//                     vendor.fcmToken,
//                     "📢 New Bid Received",
//                     `New bid on ${product.productName || "your product"}`
//                 );
//             }
//         }

//         res.json({ success: true, bid });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };


// exports.createBid = async (req, res) => {
//     const session = await mongoose.startSession();

//     try {
//         session.startTransaction();

//         const {
//             userId,
//             userName,
//             productId,
//             bidPricePerBag,
//             quantityBags,
//             advanceAmount,
//             messageToSeller,
//             bidType,
//         } = req.body;

//         if (!userId || !userName || !productId) {
//             return res.status(400).json({ success: false, error: "userId, userName, productId are required" });
//         }

//         if (!mongoose.Types.ObjectId.isValid(productId)) {
//             return res.status(400).json({ success: false, error: "Invalid productId" });
//         }

//         const price = Number(bidPricePerBag);
//         const qty = Number(quantityBags);
//         const adv = Number(advanceAmount);

//         if (!Number.isFinite(price) || price <= 0) {
//             return res.status(400).json({ success: false, error: "bidPricePerBag must be > 0" });
//         }
//         if (!Number.isFinite(qty) || qty <= 0) {
//             return res.status(400).json({ success: false, error: "quantityBags must be > 0" });
//         }
//         if (!Number.isFinite(adv) || adv < 0) {
//             return res.status(400).json({ success: false, error: "advanceAmount must be >= 0" });
//         }

//         const safeBidType = ["NORMAL", "LOCK"].includes(String(bidType)) ? String(bidType) : "NORMAL";

//         const product = await Product.findOne({ _id: productId }).session(session);
//         if (!product) {
//             return res.status(404).json({ success: false, error: "Product not found" });
//         }

//         if (String(product.status) !== "Active") {
//             return res.status(403).json({ success: false, error: "Product is not Active" });
//         }


//         const existingBid = await Bid.findOne({
//             userId,
//             productId,
//             status: { $nin: ["rejected", "inactive"] },
//         }).session(session);

//         if (existingBid) {
//             return res.status(400).json({ success: false, error: "Already bid placed on this product" });
//         }


//         if (safeBidType === "LOCK") {

//             const updated = await Product.findOneAndUpdate(
//                 { _id: productId, availableQuantity: { $gte: qty }, isLocked: false },
//                 { $inc: { availableQuantity: -qty } },
//                 { new: true, session }
//             );

//             if (!updated) {
//                 return res.status(400).json({
//                     success: false,
//                     error: "Not enough available quantity to lock this bid",
//                 });
//             }
//         } else {

//             if (Number(product.availableQuantity || 0) < qty) {
//                 return res.status(400).json({
//                     success: false,
//                     error: "Not enough available quantity",
//                 });
//             }
//         }

//         const totalAmount = price * qty;
//         const dueAmount = totalAmount - adv;

//         if (dueAmount < 0) {
//             return res.status(400).json({ success: false, error: "Advance amount cannot exceed total amount" });
//         }

//         const bid = await Bid.create(
//             [
//                 {
//                     userId,
//                     userName,
//                     productId,
//                     productSnapshot: product.toObject(),
//                     bidPricePerBag: price,
//                     quantityBags: qty,
//                     advanceAmount: adv,
//                     totalAmount,
//                     dueAmount,
//                     messageToSeller: messageToSeller || "",
//                     bidType: safeBidType,
//                     status: "pending",
//                 },
//             ],
//             { session }
//         );

//         const vendorId = product.vendorId;

//         if (vendorId) {
//             const vendor = await Farmer.findById(vendorId).session(session);

//             if (vendor?.fcmToken) {
//                 await sendPushNotification(
//                     vendor.fcmToken,
//                     "📢 New Bid Received",
//                     `New bid on ${product.productTitle || "your product"}`
//                 );
//             }
//         }

//         await session.commitTransaction();
//         session.endSession();

//         return res.status(201).json({ success: true, bid: bid?.[0] });
//     } catch (err) {
//         try {
//             await session.abortTransaction();
//             session.endSession();
//         } catch (e) { }

//         console.log("createBid error:", err);
//         return res.status(500).json({ success: false, error: err.message || "Server error" });
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

            const safeBidType = ["NORMAL", "LOCK"].includes(String(bidType)) ? String(bidType) : "NORMAL";

            // 1) Fetch product
            const product = await Product.findById(productId).session(session);
            if (!product) {
                throw { status: 404, message: "Product not found" };
            }

            if (String(product.status) !== "Active") {
                throw { status: 403, message: "Product is not Active" };
            }

            // 2) Validate advance <= total
            const totalAmount = price * qty;
            const dueAmount = totalAmount - adv;

            if (dueAmount < 0) {
                throw { status: 400, message: "Advance amount cannot exceed total amount" };
            }

            // 3) ✅ Reserve stock for EVERY bid (NORMAL + LOCK) using atomic update
            // If you still need LOCK-only rules like isLocked false, keep that condition only for LOCK.
            const reserveQuery = {
                _id: productId,
                availableQuantity: { $gte: qty },
            };

            if (safeBidType === "LOCK") {
                reserveQuery.isLocked = false; // keep your lock rule if needed
            }

            const updatedProduct = await Product.findOneAndUpdate(
                reserveQuery,
                { $inc: { availableQuantity: -qty } },
                { new: true, session }
            );

            if (!updatedProduct) {
                throw { status: 400, message: "Not enough available quantity" };
            }

            // 4) ✅ Allow multiple bids for same user (NO blocking with existingBid)
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

            // 5) Notify vendor
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

            // store result for response outside transaction
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
        const bidId = req.params.id?.trim();

        if (!mongoose.Types.ObjectId.isValid(bidId)) {
            return res.status(400).json({ error: "Invalid Bid ID" });
        }

        const bid = await Bid.findByIdAndUpdate(
            bidId,
            { status: "vendor_accepted" },
            { new: true }
        );

        if (!bid) {
            return res.status(404).json({ error: "Bid not found" });
        }

        const traderId = bid.userId;

        if (traderId) {
            const trader = await Trader.findById(traderId);

            console.log("trader", trader)

            if (trader?.fcmToken) {
                await sendPushNotificationTrader(
                    trader.fcmToken,
                    "✅ Bid Accepted by Vendor",
                    "Vendor approved your bid. Waiting for admin approval.",
                );
            }
        }

        res.json({ success: true, bid });

    } catch (error) {
        console.error("vendorAcceptBid error:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.adminApproveBid = async (req, res) => {
    try {
        const bidId = req.params.id?.trim();

        if (!mongoose.Types.ObjectId.isValid(bidId)) {
            return res.status(400).json({ error: "Invalid Bid ID" });
        }

        const bid = await Bid.findById(bidId);
        console.log("bid", bid)
        if (!bid) return res.status(404).json({ error: "Bid not found" });

        if (bid.status === "admin_approved") {
            const product = await Product.findByIdAndUpdate(
                bid.productId,
                { isLocked: false, lockedBy: null, lockExpiresAt: null },
                { new: true }
            );

            if (bid.userId) {
                const trader = await Trader.findById(bid.userId);
                if (trader?.fcmToken) {
                    await sendPushNotificationTrader(
                        trader.fcmToken,
                        "🎉 Bid Approved by Admin",
                        "Your bid has been approved by admin. Please proceed with next steps."
                    );
                }
            }

            if (product?.vendorId) {
                const farmer = await Farmer.findById(product.vendorId);
                if (farmer?.fcmToken) {
                    await sendPushNotification(
                        farmer.fcmToken,
                        "✅ Bid Approved by Admin",
                        "Admin approved the bid. You can proceed with the order."
                    );
                }
            }

            return res.json({ success: true, bid, product });
        }

        const bidQty = Number(bid.quantityBags);
        console.log("bidQty", bidQty)
        if (!Number.isFinite(bidQty) || bidQty <= 0) {
            return res.status(400).json({ error: "Invalid bid quantity" });
        }

        const product = await Product.findOneAndUpdate(
            { _id: bid.productId, availableQuantity: { $gte: bidQty } },
            {
                $inc: { availableQuantity: -bidQty },
                $set: { isLocked: false, lockedBy: null, lockExpiresAt: null },
            },
            { new: true }
        );



        bid.status = "admin_approved";
        await bid.save();

        if (bid.userId) {
            const trader = await Trader.findById(bid.userId);
            if (trader?.fcmToken) {
                await sendPushNotificationTrader(
                    trader.fcmToken,
                    "🎉 Bid Approved by Admin",
                    "Your bid has been approved by admin. Please proceed with next steps."
                );
            }
        }

        if (product?.vendorId) {
            const farmer = await Farmer.findById(product.vendorId);
            if (farmer?.fcmToken) {
                await sendPushNotification(
                    farmer.fcmToken,
                    "✅ Bid Approved by Admin",
                    "Admin approved the bid. You can proceed with the order."
                );
            }
        }


        return res.json({ success: true, bid, product });
    } catch (error) {
        console.error("adminApproveBid error:", error);
        return res.status(500).json({ error: error.message });
    }
};



exports.adminrejectBid = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const bidId = String(req.params.id || "").trim();

        if (!mongoose.Types.ObjectId.isValid(bidId)) {
            return res.status(400).json({ success: false, error: "Invalid Bid ID" });
        }

        const bid = await Bid.findById(bidId).session(session);
        if (!bid) {
            return res.status(404).json({ success: false, error: "Bid not found" });
        }

        // ✅ Prevent double reject / double rollback
        if (["rejected", "inactive"].includes(String(bid.status))) {
            return res.status(400).json({
                success: false,
                error: `Bid already ${bid.status}`,
            });
        }

        const prevStatus = bid.status;

        const bidQty = Number(bid.quantityBags);
        if (!Number.isFinite(bidQty) || bidQty <= 0) {
            return res.status(400).json({ success: false, error: "Invalid bid quantity" });
        }

        // ✅ Mark rejected
        bid.status = "rejected";
        await bid.save({ session });

        // ✅ ALWAYS restore availableQuantity
        // because your createBid now reserves stock for NORMAL and LOCK
        const unlockFields = { isLocked: false, lockedBy: null, lockExpiresAt: null };

        const product = await Product.findByIdAndUpdate(
            bid.productId,
            {
                $inc: { availableQuantity: bidQty },
                ...unlockFields,
            },
            { new: true, session }
        );

        await session.commitTransaction();
        session.endSession();

        // ✅ Notifications (outside transaction is okay)
        try {
            if (bid.userId) {
                const trader = await Trader.findById(bid.userId);
                if (trader?.fcmToken) {
                    await sendPushNotificationTrader(
                        trader.fcmToken,
                        "❌ Bid Rejected by Admin",
                        "Your bid has been rejected by admin."
                    );
                }
            }

            if (product?.vendorId) {
                const farmer = await Farmer.findById(product.vendorId);
                if (farmer?.fcmToken) {
                    await sendPushNotification(
                        farmer.fcmToken,
                        "❌ Bid Rejected by Admin",
                        "Admin rejected the bid."
                    );
                }
            }
        } catch (notifyErr) {
            console.log("adminrejectBid notification error:", notifyErr);
        }


        return res.json({
            success: true,
            message: "Bid rejected successfully",
            prevStatus,
            rollbackQty: bidQty,
            bid,
            product,
        });
    } catch (error) {
        try {
            await session.abortTransaction();
            session.endSession();
        } catch (e) { }

        console.error("adminrejectBid error:", error);
        return res.status(500).json({ success: false, error: error.message || "Server Error" });
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
