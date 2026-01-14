const Bid = require("../Modal/Bid");
const Product = require('../Modal/Product');
const sendPushNotification = require("../utils/sendPushNotification");
const Farmer = require("../Modal/Farmer");



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

// exports.createBid = async (req, res) => {
//     try {
//         const { userId, userName, productId, bidPricePerBag, quantityBags, advanceAmount, messageToSeller, bidType } = req.body;

//         const product = await Product.findById(productId);
//         if (!product) return res.status(404).json({ error: "Product not found" });


//         const existingBid = await Bid.findOne({
//             userId,
//             productId,
//             status: { $nin: ['rejected', 'inactive'] }
//         });
//         if (existingBid) {
//             return res.status(400).json({ error: "❌ You already have an active bid!" });
//         }

//         const totalAmount = bidPricePerBag * quantityBags;
//         const dueAmount = totalAmount - advanceAmount;
//         if (dueAmount < 0) return res.status(400).json({ error: "❌ Invalid amounts" });

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
//             status: "pending"
//         });

//         console.log(`✅ BID CREATED: ${bid._id} by ${userName}`);

//         res.json({ success: true, bid });
//     } catch (err) {
//         console.error("Bid error:", err);
//         res.status(500).json({ error: err.message });
//     }
// };


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
            bidType
        } = req.body;

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ error: "Product not found" });

        // ❌ Prevent duplicate active bids
        const existingBid = await Bid.findOne({
            userId,
            productId,
            status: { $nin: ["rejected", "inactive"] },
        });

        if (existingBid) {
            return res.status(400).json({ error: "❌ You already have an active bid!" });
        }

        const totalAmount = bidPricePerBag * quantityBags;
        const dueAmount = totalAmount - advanceAmount;

        if (dueAmount < 0) {
            return res.status(400).json({ error: "❌ Invalid amounts" });
        }

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

        console.log(`✅ BID CREATED: ${bid._id} by ${userName}`);



        const vendorId = product.vendorId;

        if (vendorId) {
            const vendor = await Farmer.findById(vendorId);

            if (vendor?.fcmToken) {
                const productName = product.productName || "Your product";

                await sendPushNotification(
                    vendor.fcmToken,
                    "📢 New Bid Received",
                    `A new bid has been placed on ${productName}`
                );
            }
        }

        res.json({ success: true, bid });

    } catch (err) {
        console.error("Bid error:", err);
        res.status(500).json({ error: err.message });
    }
};

// ✅ 3. GET LOCK STATUS (Auto-expire)
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
    const bid = await Bid.findByIdAndUpdate(
        req.params.id,
        { status: "vendor_accepted" },
        { new: true }
    );
    if (!bid) return res.status(404).json({ error: "Bid not found" });
    res.json({ success: true, bid });
};

exports.adminApproveBid = async (req, res) => {
    const bid = await Bid.findByIdAndUpdate(
        req.params.id,
        { status: "admin_approved" },
        { new: true }
    );
    if (!bid) return res.status(404).json({ error: "Bid not found" });

    await Product.findByIdAndUpdate(bid.productId, {
        isLocked: false,
        lockedBy: null,
        lockExpiresAt: null,
    });

    res.json({ success: true, bid });
};

exports.adminrejectBid = async (req, res) => {
    const bid = await Bid.findByIdAndUpdate(
        req.params.id,
        { status: "rejected" },
        { new: true }
    );
    if (!bid) return res.status(404).json({ error: "Bid not found" });

    await Product.findByIdAndUpdate(bid.productId, {
        isLocked: false,
        lockedBy: null,
        lockExpiresAt: null,
    });

    res.json({ success: true, bid });
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
