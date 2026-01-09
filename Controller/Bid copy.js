// const Bid = require('../Modal/Bid');
// const Product = require('../Modal/Product');

// exports.createBid = async (req, res) => {
//     try {
//         const { userId, userName, productId, ...bidData } = req.body;

//         const { bidPricePerBag, quantityBags, advanceAmount } = bidData;

//         console.log("req.body", req.body)
//         if (!userId || !userName || !productId) {
//             return res.status(400).json({ error: 'Missing userId, userName, or productId' });
//         }

//         const product = await Product.findById(productId).lean();
//         if (!product) return res.status(404).json({ error: 'Product not found' });

//         const totalAmount = bidPricePerBag * quantityBags;
//         const dueAmount = totalAmount - advanceAmount;
//         if (dueAmount < 0) return res.status(400).json({ error: 'Advance exceeds total' });

//         const { _id, __v, createdAt, updatedAt, ...productSnapshot } = product;

//         const newBid = new Bid({
//             userId,
//             userName,
//             productId,
//             productSnapshot,
//             bidPricePerBag,
//             quantityBags,
//             advanceAmount,
//             totalAmount,
//             dueAmount,
//             messageToSeller: bidData.messageToSeller || '',
//             status: 'pending',
//         });

//         await newBid.save();
//         res.status(201).json({ success: true, bid: newBid });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };



// exports.getBidById = async (req, res) => {
//     try {
//         const bid = await Bid.findById(req.params.id);
//         if (!bid) return res.status(404).json({ error: 'Bid not found' });
//         res.json(bid);
//     } catch (err) {
//         res.status(500).json({ error: 'Server error' });
//     }
// };

// exports.getBidByUserAndProduct = async (req, res) => {
//     try {
//         const { userId, productId } = req.params;
//         const bids = await Bid.find({ userId, productId });
//         res.json(bids);
//     } catch (err) {
//         res.status(500).json({ error: 'Server error' });
//     }
// };

// exports.updateBid = async (req, res) => {
//     try {
//         const bid = await Bid.findById(req.params.id);
//         if (!bid) return res.status(404).json({ error: 'Bid not found' });

//         if (bid.status !== 'pending') {
//             return res.status(403).json({ error: 'Cannot edit bid after submission/approval' });
//         }

//         const { bidPricePerBag, quantityBags, advanceAmount, messageToSeller } = req.body;

//         let totalAmount = bid.totalAmount;
//         let dueAmount = bid.dueAmount;

//         if (bidPricePerBag !== undefined || quantityBags !== undefined) {
//             const price = bidPricePerBag ?? bid.bidPricePerBag;
//             const qty = quantityBags ?? bid.quantityBags;
//             totalAmount = price * qty;
//             dueAmount = totalAmount - (advanceAmount ?? bid.advanceAmount);
//         }

//         if (dueAmount < 0) return res.status(400).json({ error: 'Advance exceeds total' });

//         if (bidPricePerBag !== undefined) bid.bidPricePerBag = bidPricePerBag;
//         if (quantityBags !== undefined) bid.quantityBags = quantityBags;
//         if (advanceAmount !== undefined) bid.advanceAmount = advanceAmount;
//         if (messageToSeller !== undefined) bid.messageToSeller = messageToSeller;

//         bid.totalAmount = totalAmount;
//         bid.dueAmount = dueAmount;

//         await bid.save();
//         res.json({ success: true, bid });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };

// exports.updateBidStatus = async (req, res) => {
//     try {
//         const { status } = req.body;
//         const validStatuses = ['pending', 'approved', 'rejected', 'active', 'inactive'];
//         if (!validStatuses.includes(status)) {
//             return res.status(400).json({ error: 'Invalid status' });
//         }

//         const bid = await Bid.findByIdAndUpdate(
//             req.params.id,
//             { status },
//             { new: true, runValidators: true }
//         );

//         if (!bid) return res.status(404).json({ error: 'Bid not found' });
//         res.json({ success: true, bid });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };

// // DELETE /api/bids/:id → Soft delete (or hard delete)
// exports.deleteBid = async (req, res) => {
//     try {
//         const bid = await Bid.findById(req.params.id);
//         if (!bid) return res.status(404).json({ error: 'Bid not found' });

//         // Optional: Only allow deletion if pending
//         if (bid.status !== 'pending') {
//             return res.status(403).json({ error: 'Cannot delete non-pending bid' });
//         }

//         await Bid.findByIdAndDelete(req.params.id);
//         res.json({ success: true, message: 'Bid deleted' });
//     } catch (err) {
//         res.status(500).json({ error: 'Server error' });
//     }
// };


// exports.getBidsByUser = async (req, res) => {
//     try {
//         const { userId } = req.params;

//         if (!userId) {
//             return res.status(400).json({ error: 'User ID is required' });
//         }

//         const bids = await Bid.find({ userId })
//             .sort({ createdAt: -1 })
//             .select('-__v');

//         res.status(200).json(bids);
//     } catch (error) {
//         console.error('Error in getBidsByUser:', error);
//         res.status(500).json({ error: 'Server error while fetching bids' });
//     }
// };


// exports.getAllBids = async (req, res) => {
//     try {
//         const bids = await Bid.find()
//             .populate("productId", "productTitle pricePerUnit vendorId") // ✅ OK
//             .sort({ createdAt: -1 })
//             .select("-__v");

//         res.status(200).json({
//             success: true,
//             count: bids.length,
//             data: bids,
//         });
//     } catch (error) {
//         console.error("Get All Bids Error:", error);
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };

// exports.getBidsByVendor = async (req, res) => {
//     try {
//         const { vendorId } = req.params;

//         const bids = await Bid.find({
//             "productSnapshot.vendorId": vendorId
//         })
//             .populate("productId", "productTitle pricePerUnit vendorId")
//             .sort({ createdAt: -1 })
//             .select("-__v");

//         res.status(200).json({
//             success: true,
//             count: bids.length,
//             data: bids,
//         });
//     } catch (error) {
//         console.error("Get Bids By Vendor Error:", error);
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };



 const Bid = require("../Modal/Bid");
 const Product = require('../Modal/Product');

/* ================= PLACE BID ================= */
exports.createBid = async (req, res) => {
  try {
    const {
      userId,
      userName,
      productId,
      bidPricePerBag,
      quantityBags,
      advanceAmount,
      bidType = "NORMAL",
    } = req.body;

    const product = await Product.findById(productId).lean();
    if (!product) return res.status(404).json({ error: "Product not found" });

    // ❌ Block if locked by other user
    if (product.isLocked && product.lockedBy !== userId) {
      return res.status(403).json({ error: "Product is locked" });
    }

    const totalAmount = bidPricePerBag * quantityBags;
    const dueAmount = totalAmount - advanceAmount;
    if (dueAmount < 0)
      return res.status(400).json({ error: "Invalid advance amount" });

    const { _id, __v, createdAt, updatedAt, ...productSnapshot } = product;

    const bid = await Bid.create({
      userId,
      userName,
      productId,
      productSnapshot,
      bidPricePerBag,
      quantityBags,
      advanceAmount,
      totalAmount,
      dueAmount,
      bidType,
      status: "pending",
    });

    res.json({ success: true, bid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLockStatus = async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId).select(
            "isLocked lockedBy lockExpiresAt"
        );

        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        res.json({
            locked: product.isLocked,
            lockedBy: product.lockedBy,
            lockExpiresAt: product.lockExpiresAt,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ================= LOCK AFTER PAYMENT ================= */
exports.lockAfterPayment = async (req, res) => {
    try {
        const { productId, userId, paymentId, orderId } = req.body;

        if (!productId || !userId) {
            return res.status(400).json({ error: "Missing data" });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        if (product.isLocked) {
            return res.status(400).json({ error: "Product already locked" });
        }

        // ✅ payment already successful (assumed)
        product.isLocked = true;
        product.lockedBy = userId;
        product.lockExpiresAt = new Date(Date.now() + 20 * 60 * 1000); // 20 min

        await product.save();

        res.json({
            success: true,
            lockExpiresAt: product.lockExpiresAt,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ================= LOCK BID (₹99) ================= */
exports.lockProduct = async (req, res) => {
  try {
    const { productId, userId } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (product.isLocked) {
      return res.status(400).json({ error: "Product already locked" });
    }

    // 💰 Assume payment success
    product.isLocked = true;
    product.lockedBy = userId;
    product.lockExpiresAt = new Date(Date.now() + 20 * 60 * 1000);

    await product.save();

    res.json({ success: true, message: "Product locked for 20 minutes" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= VENDOR ACCEPT ================= */
exports.vendorAcceptBid = async (req, res) => {
  const bid = await Bid.findById(req.params.id);
  if (!bid) return res.status(404).json({ error: "Bid not found" });

  bid.status = "vendor_accepted";
  await bid.save();

  res.json({ success: true, bid });
};

/* ================= ADMIN APPROVE ================= */
exports.adminApproveBid = async (req, res) => {
  const bid = await Bid.findById(req.params.id);
  if (!bid) return res.status(404).json({ error: "Bid not found" });

  bid.status = "admin_approved";
  await bid.save();

  // 🔓 Unlock product
  await Product.findByIdAndUpdate(bid.productId, {
    isLocked: false,
    lockedBy: null,
    lockExpiresAt: null,
  });

  res.json({ success: true, bid });
};

/* ================= GET BIDS ================= */
exports.getAllBids = async (req, res) => {
  const bids = await Bid.find().sort({ createdAt: -1 });
  res.json(bids);
};
