const Bid = require("../Modal/Bid");
const Product = require('../Modal/Product');
const sendPushNotification = require("../utils/sendPushNotification");
const sendPushNotificationTrader = require("../utilstrader/sendPushNotification")
const Farmer = require("../Modal/Farmer");
const Trader = require("../Modal/Trader");
const { default: mongoose } = require("mongoose");

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

exports.createBid = async (req, res) => {
    try {
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

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ error: "Product not found" });

        const existingBid = await Bid.findOne({
            userId,
            productId,
            status: { $nin: ["rejected", "inactive"] },
        });

        if (existingBid) {
            return res.status(400).json({ error: "Already bid placed" });
        }

        const totalAmount = bidPricePerBag * quantityBags;
        const dueAmount = totalAmount - advanceAmount;
        if (dueAmount < 0) return res.status(400).json({ error: "Invalid amount" });

        const bid = await Bid.create({
            userId,
            userName,
            productId,
            productSnapshot: product.toObject(),
            bidPricePerBag,
            quantityBags,
            advanceAmount,
            totalAmount,
            dueAmount,
            messageToSeller,
            bidType,
            status: "pending",
        });

        const vendorId = product.vendorId;

        if (vendorId) {
            const vendor = await Farmer.findById(vendorId);

            console.log("vendor", vendor)


            if (vendor?.fcmToken) {
                await sendPushNotification(
                    vendor.fcmToken,
                    "📢 New Bid Received",
                    `New bid on ${product.productName || "your product"}`
                );
            }
        }

        res.json({ success: true, bid });
    } catch (err) {
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

        if (!product) {
            return res.status(400).json({ error: "Insufficient available quantity" });
        }

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
    try {
        const bidId = req.params.id?.trim();

        if (!mongoose.Types.ObjectId.isValid(bidId)) {
            return res.status(400).json({ error: "Invalid Bid ID" });
        }

        const bid = await Bid.findById(bidId);
        if (!bid) return res.status(404).json({ error: "Bid not found" });

        const prevStatus = bid.status;

        const bidQty = Number(bid.quantityBags); // ✅ ONLY bid.quantity
        if (!Number.isFinite(bidQty) || bidQty <= 0) {
            return res.status(400).json({ error: "Invalid bid quantity" });
        }

        // ✅ Update bid status
        bid.status = "rejected";
        await bid.save();

        const unlockFields = { isLocked: false, lockedBy: null, lockExpiresAt: null };

        // ✅ Rollback availableQuantity ONLY if it was admin_approved before
        const product = prevStatus === "admin_approved"
            ? await Product.findByIdAndUpdate(
                bid.productId,
                { ...unlockFields, $inc: { availableQuantity: bidQty } },
                { new: true }
            )
            : await Product.findByIdAndUpdate(
                bid.productId,
                unlockFields,
                { new: true }
            );

        // ✅ Push notifications
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

        return res.json({ success: true, bid, product });
    } catch (error) {
        console.error("adminRejectBid error:", error);
        return res.status(500).json({ error: error.message });
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
