const AccountDeletionRequest = require("../Modal/AccountDeletionRequest");
const Trader = require("../Modal/Trader");
const Farmer = require("../Modal/Farmer");
const Bid = require("../Modal/Bid");
const Addrequirement = require("../Modal/Addrequirement");
const Product = require("../Modal/Product");
const TraderSubscription = require("../Modal/TraderSubscription");
const FarmerSubscription = require("../Modal/FarmerSubscription");
const Favurite = require("../Modal/Favurite");

// Get all deletion requests
exports.getAllDeletionRequests = async (req, res) => {
    try {
        const requests = await AccountDeletionRequest.find()
            .sort({ requestedAt: -1 })
            .lean();

        res.json({
            success: true,
            data: requests,
            count: requests.length
        });
    } catch (err) {
        console.error("Get Deletion Requests Error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch deletion requests"
        });
    }
};

// Get pending deletion requests only
exports.getPendingDeletionRequests = async (req, res) => {
    try {
        const requests = await AccountDeletionRequest.find({ status: "pending" })
            .sort({ requestedAt: -1 })
            .lean();

        res.json({
            success: true,
            data: requests,
            count: requests.length
        });
    } catch (err) {
        console.error("Get Pending Requests Error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch pending requests"
        });
    }
};

// Get deletion request by ID
exports.getDeletionRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const request = await AccountDeletionRequest.findById(id).lean();
        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        res.json({
            success: true,
            data: request
        });
    } catch (err) {
        console.error("Get Request Error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch request"
        });
    }
};

// Reactivate account (reject deletion request)
exports.reactivateAccount = async (req, res) => {
    try {
        const { requestId, rejectionReason } = req.body;

        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: "requestId is required"
            });
        }

        const request = await AccountDeletionRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        // Get the appropriate user model
        const UserModel = request.userType === "trader" ? Trader : Farmer;

        // Reactivate the account
        const user = await UserModel.findByIdAndUpdate(
            request.userId,
            {
                deletionRequested: false,
                deletionStatus: "active"
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found"
            });
        }

        // Update deletion request status
        await AccountDeletionRequest.findByIdAndUpdate(requestId, {
            status: "rejected",
            rejectionReason: rejectionReason || "Admin rejected the deletion request"
        });

        res.json({
            success: true,
            message: "Account reactivated successfully",
            data: {
                userId: user._id,
                email: user.email,
                status: user.deletionStatus
            }
        });
    } catch (err) {
        console.error("Reactivate Account Error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to reactivate account"
        });
    }
};

// Permanently delete account (approve deletion request)
exports.permanentlyDeleteAccount = async (req, res) => {
    try {
        const { requestId, adminEmail } = req.body;

        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: "requestId is required"
            });
        }

        const request = await AccountDeletionRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        // Get the appropriate user model
        const UserModel = request.userType === "trader" ? Trader : Farmer;
        const uid = request.userId.toString();

        // Delete all related data
        if (request.userType === "trader") {
            await Promise.all([
                Bid.deleteMany({ userId: uid }),
                Favurite.deleteMany({ userId: uid }),
                TraderSubscription.deleteMany({ traderId: request.userId }),
                Addrequirement.deleteMany({ userId: request.userId }),
            ]);
        } else if (request.userType === "farmer") {
            await Promise.all([
                Product.deleteMany({ vendorId: uid }),
                FarmerSubscription.deleteMany({ farmerId: request.userId }),
            ]);
        }

        // Delete the user account
        const deletedUser = await UserModel.findByIdAndDelete(request.userId);

        // Update deletion request status
        await AccountDeletionRequest.findByIdAndUpdate(requestId, {
            status: "approved",
            approvedAt: new Date(),
            approvedBy: adminEmail || "admin",
            deletedAt: new Date()
        });

        res.json({
            success: true,
            message: `${request.userType} account permanently deleted`,
            data: {
                userId: request.userId,
                email: request.userEmail,
                userType: request.userType,
                deletedAt: new Date()
            }
        });
    } catch (err) {
        console.error("Permanent Delete Error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to permanently delete account"
        });
    }
};

// Get account info from deletion request
exports.getAccountInfo = async (req, res) => {
    try {
        const { requestId } = req.params;

        const request = await AccountDeletionRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        const UserModel = request.userType === "trader" ? Trader : Farmer;
        const user = await UserModel.findById(request.userId).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            data: {
                request,
                userInfo: user
            }
        });
    } catch (err) {
        console.error("Get Account Info Error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch account info"
        });
    }
};
