const Bid = require('../Modal/Bid');
const Product = require('../Modal/Product');

exports.createBid = async (req, res) => {
    try {
        const { userId, userName, productId, ...bidData } = req.body;

        const { bidPricePerBag, quantityBags, advanceAmount } = bidData;

        console.log("req.body", req.body)
        if (!userId || !userName || !productId) {
            return res.status(400).json({ error: 'Missing userId, userName, or productId' });
        }

        const product = await Product.findById(productId).lean();
        if (!product) return res.status(404).json({ error: 'Product not found' });

        const totalAmount = bidPricePerBag * quantityBags;
        const dueAmount = totalAmount - advanceAmount;
        if (dueAmount < 0) return res.status(400).json({ error: 'Advance exceeds total' });

        const { _id, __v, createdAt, updatedAt, ...productSnapshot } = product;

        const newBid = new Bid({
            userId,
            userName,
            productId,
            productSnapshot,
            bidPricePerBag,
            quantityBags,
            advanceAmount,
            totalAmount,
            dueAmount,
            messageToSeller: bidData.messageToSeller || '',
            status: 'pending',
        });

        await newBid.save();
        res.status(201).json({ success: true, bid: newBid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



exports.getBidById = async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.id);
        if (!bid) return res.status(404).json({ error: 'Bid not found' });
        res.json(bid);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getBidByUserAndProduct = async (req, res) => {
    try {
        const { userId, productId } = req.params;
        const bids = await Bid.find({ userId, productId });
        res.json(bids);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateBid = async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.id);
        if (!bid) return res.status(404).json({ error: 'Bid not found' });

        if (bid.status !== 'pending') {
            return res.status(403).json({ error: 'Cannot edit bid after submission/approval' });
        }

        const { bidPricePerBag, quantityBags, advanceAmount, messageToSeller } = req.body;

        let totalAmount = bid.totalAmount;
        let dueAmount = bid.dueAmount;

        if (bidPricePerBag !== undefined || quantityBags !== undefined) {
            const price = bidPricePerBag ?? bid.bidPricePerBag;
            const qty = quantityBags ?? bid.quantityBags;
            totalAmount = price * qty;
            dueAmount = totalAmount - (advanceAmount ?? bid.advanceAmount);
        }

        if (dueAmount < 0) return res.status(400).json({ error: 'Advance exceeds total' });

        if (bidPricePerBag !== undefined) bid.bidPricePerBag = bidPricePerBag;
        if (quantityBags !== undefined) bid.quantityBags = quantityBags;
        if (advanceAmount !== undefined) bid.advanceAmount = advanceAmount;
        if (messageToSeller !== undefined) bid.messageToSeller = messageToSeller;

        bid.totalAmount = totalAmount;
        bid.dueAmount = dueAmount;

        await bid.save();
        res.json({ success: true, bid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateBidStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'approved', 'rejected', 'active', 'inactive'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const bid = await Bid.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!bid) return res.status(404).json({ error: 'Bid not found' });
        res.json({ success: true, bid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /api/bids/:id → Soft delete (or hard delete)
exports.deleteBid = async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.id);
        if (!bid) return res.status(404).json({ error: 'Bid not found' });

        // Optional: Only allow deletion if pending
        if (bid.status !== 'pending') {
            return res.status(403).json({ error: 'Cannot delete non-pending bid' });
        }

        await Bid.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Bid deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
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