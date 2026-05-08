const { default: mongoose } = require('mongoose');
const bcrypt = require('bcryptjs');
const Trader = require("../Modal/Trader");
const Otp = require("../Modal/Otp");
const sendOtpSms = require("../utils/sendOtpSms");
const sendPushNotification = require("../utilstrader/sendPushNotification");
const InAppNotification = require("../Modal/Notification");
const Bid = require("../Modal/Bid");
const Favurite = require("../Modal/Favurite");
const TraderSubscription = require("../Modal/TraderSubscription");
const Addrequirement = require("../Modal/Addrequirement");

const isValidIndian10Digit = (m = "") => /^[6-9]\d{9}$/.test(String(m).trim());

exports.sendLoginOtp = async (req, res) => {
    try {
        const mobileNumber = String(req.body?.mobileNumber || "").trim();

        if (!isValidIndian10Digit(mobileNumber)) {
            return res.status(400).json({
                success: false,
                message: "Enter valid 10-digit mobile number (without country code).",
            });
        }

        const farmer = await Trader.findOne({ mobileNumber });
        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: "Mobile number not registered",
            });
        }

        const otp = String(Math.floor(1000 + Math.random() * 9000));
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await Otp.deleteMany({ mobileNumber });

        await Otp.create({ mobileNumber, otp, expiresAt });

        await sendOtpSms(mobileNumber, otp);

        return res.status(200).json({
            success: true,
            message: "OTP sent for login",
        });
    } catch (error) {
        console.error("sendLoginOtp Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to send OTP",
        });
    }
};

exports.verifyOtpAndLogin = async (req, res) => {
    try {
        const mobileNumber = String(req.body?.mobileNumber || "").trim();
        const otp = String(req.body?.otp || "").trim();

        if (!isValidIndian10Digit(mobileNumber) || !/^\d{4}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: "Valid 10-digit mobile and 4-digit OTP are required.",
            });
        }

        const otpRecord = await Otp.findOne({ mobileNumber }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "OTP not found. Please request OTP again.",
            });
        }

        if (otpRecord.expiresAt < new Date()) {
            await Otp.deleteMany({ mobileNumber });
            return res.status(400).json({
                success: false,
                message: "OTP expired. Please request again.",
            });
        }

        if (String(otpRecord.otp) !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        await Otp.deleteMany({ mobileNumber });

        const farmer = await Trader.findOne({ mobileNumber }).select("-password");

        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Check if account is marked for deletion (pending or already deleted)
        if (farmer.deletionStatus === "pending_deletion" || farmer.deletionStatus === "deleted") {
            return res.status(403).json({
                success: false,
                message: "Your account has been marked for deletion and is no longer active. Please contact support if this is a mistake.",
                code: "ACCOUNT_PENDING_DELETION"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: farmer,
        });
    } catch (error) {
        console.error("verifyOtpAndLogin Error:", error);
        return res.status(500).json({
            success: false,
            message: "Login failed",
        });
    }
};

exports.register = async (req, res) => {
    try {
        const {
            userType,
            email,
            password,
            mobileNumber,
            state,
            district,
            townVillage,
            pincode,
            address,
            termsAccepted,
            firstName,
            lastName,
            businessName,
            panNumber,
            gstNumber,
            gstVerifiedData,
            bidLimit
        } = req.body;

        const exist = await Trader.findOne({ email });
        if (exist) {
            return res.status(400).json({
                success: false,
                error: "Email already exists"
            });
        }

        const existMobile = await Trader.findOne({ mobileNumber });
        if (existMobile) {
            return res.status(400).json({
                success: false,
                error: "Mobile number already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const files = req.files || {};

        const trader = new Trader({
            userType,
            email,
            password: hashedPassword,
            mobileNumber,
            state,
            district,
            townVillage,
            pincode,
            address,
            termsAccepted,
            firstName,
            lastName,
            businessName,
            panNumber,
            gstNumber,
            gstVerifiedData: gstVerifiedData ? JSON.parse(gstVerifiedData) : undefined,
            aadhaarFront: files.aadhaarFront?.[0]?.path || null,
            aadhaarBack: files.aadhaarBack?.[0]?.path || null,
            panImage: files.panImage?.[0]?.path || null,
            gstImage: files.gstImage?.[0]?.path || null,

            bidLimit: Number(bidLimit) || 5,
        });

        await trader.save();

        try {
            await InAppNotification.create({
                userId: String(trader._id),
                notificationType: "NEW_TRADER_REGISTRATION",
                thumbnailTitle: "New Trader Registration",
                notifyTo: "admin",
                message: `New trader registered: ${trader.firstName || ""} ${trader.lastName || ""} (${trader.email})`,
                metaData: {
                    traderId: String(trader._id),
                    email: trader.email,
                    mobileNumber: trader.mobileNumber,
                    businessName: trader.businessName,
                },
                status: "unread",
            });
        } catch (notiErr) {
            console.error("In-app notification save failed:", notiErr.message);
        }

        return res.status(200).json({
            success: true,
            message: "Registration successful",
            data: trader,
        });

    } catch (err) {
        console.error("Register error:", err);
        return res.status(500).json({
            success: false,
            error: "Server error. Please try again."
        });
    }
};


exports.register1 = async (req, res) => {
    try {
        const {
            userType,
            email,
            password,
            mobileNumber,
            state,
            district,
            townVillage,
            pincode,
            address,
            termsAccepted,

            // individual
            firstName,
            lastName,

            // company
            businessName,
            panNumber,
            gstNumber,
            gstVerifiedData,

            bidLimit,
        } = req.body;

        /* ================= VALIDATION ================= */
        if (!email || !password || !mobileNumber) {
            return res.status(400).json({
                success: false,
                message: "Required fields missing",
            });
        }

        const exist = await Trader.findOne({ email });
        if (exist) {
            return res.status(400).json({
                success: false,
                message: "Email already exists",
            });
        }

        const existMobile = await Trader.findOne({ mobileNumber });
        if (existMobile) {
            return res.status(400).json({
                success: false,
                message: "Mobile number already exists",
            });
        }

        /* ================= PASSWORD ================= */
        const hashedPassword = await bcrypt.hash(password, 10);

        /* ================= CREATE USER ================= */
        const trader = new Trader({
            userType,
            email,
            password: hashedPassword,
            mobileNumber,
            state,
            district,
            townVillage,
            pincode,
            address,
            termsAccepted,

            firstName,
            lastName,

            businessName,
            panNumber,
            gstNumber,
            gstVerifiedData: gstVerifiedData ? JSON.parse(gstVerifiedData) : undefined,

            bidLimit: Number(bidLimit) || 5,
        });

        await trader.save();

        try {
            await InAppNotification.create({
                userId: String(trader._id),
                notificationType: "NEW_TRADER_REGISTRATION",
                thumbnailTitle: "New Trader Registration",
                notifyTo: "admin",
                message: `New trader registered: ${trader.firstName || ""} ${trader.lastName || ""} (${trader.email})`,
                metaData: {
                    traderId: String(trader._id),
                    email: trader.email,
                    mobileNumber: trader.mobileNumber,
                    businessName: trader.businessName,
                },
                status: "unread",
            });
        } catch (notiErr) {
            console.error("In-app notification save failed:", notiErr.message);
        }

        res.status(201).json({
            success: true,
            message: "Trader registered successfully",
            data: trader,
        });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};


exports.edit = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            userType,
            email,
            mobileNumber,
            state,
            district,
            townVillage,
            pincode,
            address,
            firstName,
            lastName,
            businessName,
            panNumber,
            gstNumber,
            bidLimit,
            profileData
        } = req.body;

        const files = req.files || {};

        const oldTrader = await Trader.findById(id);
        if (!oldTrader) return res.status(404).json({ error: 'Not found' });

        const updateData = {
            userType,
            email,
            mobileNumber,
            state,
            district,
            townVillage,
            pincode,
            address,
            bidLimit: parseInt(bidLimit)
        };

        // Parse profileData if it's a JSON string
        if (profileData) {
            try {
                updateData.profileData = typeof profileData === 'string' ? JSON.parse(profileData) : profileData;
            } catch (e) {
                console.log('Failed to parse profileData:', e);
            }
        }

        const { deleteFromCloudinary } = require("../utils/cloudinaryConfig");

        if (userType === 'individual') {
            updateData.firstName = firstName;
            updateData.lastName = lastName;

            if (files.aadhaarFront?.[0]) {
                await deleteFromCloudinary(oldTrader.aadhaarFront, "auto");
                updateData.aadhaarFront = files.aadhaarFront[0].path;
            }
            if (files.aadhaarBack?.[0]) {
                await deleteFromCloudinary(oldTrader.aadhaarBack, "auto");
                updateData.aadhaarBack = files.aadhaarBack[0].path;
            }

            updateData.businessName = undefined;
            updateData.panNumber = undefined;
            updateData.gstNumber = undefined;
            updateData.panImage = undefined;
            updateData.gstImage = undefined;
            updateData.registrationDocs = undefined;

        } else {
            updateData.businessName = businessName;
            updateData.panNumber = panNumber;
            updateData.gstNumber = gstNumber;

            if (files.panImage?.[0]) {
                await deleteFromCloudinary(oldTrader.panImage, "auto");
                updateData.panImage = files.panImage[0].path;
            }
            if (files.gstImage?.[0]) {
                await deleteFromCloudinary(oldTrader.gstImage, "auto");
                updateData.gstImage = files.gstImage[0].path;
            }
            if (files.registrationDocs?.length) {
                for (const docUrl of (oldTrader.registrationDocs || [])) {
                    await deleteFromCloudinary(docUrl, "auto");
                }
                updateData.registrationDocs = files.registrationDocs.map(f => f.path);
            }

            updateData.firstName = undefined;
            updateData.lastName = undefined;
            updateData.aadhaarFront = undefined;
            updateData.aadhaarBack = undefined;
        }

        const trader = await Trader.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        }).select('-password');

        res.json(trader);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
};


exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("req.body", req.body)

        const trader = await Trader.findOne({ email });
        console.log("trader", trader)

        if (!trader) {
            return res.status(400).json({
                success: false,
                message: "Invalid email",
            });
        }

        // Check if account is marked for deletion (pending or already deleted)
        if (trader.deletionStatus === "pending_deletion" || trader.deletionStatus === "deleted") {
            return res.status(403).json({
                success: false,
                message: "Your account has been marked for deletion and is no longer active. Please contact support if this is a mistake.",
                code: "ACCOUNT_PENDING_DELETION"
            });
        }

        const isMatch = await bcrypt.compare(password, trader.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid password",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: trader
        });

    } catch (err) {
        console.log("error", error)
        return res.status(500).json({
            success: false,
            message: "Login failed",
        });
    }
};


exports.getAll = async (req, res) => {
    try {
        const traders = await Trader.find().select('-password');
        res.json(traders);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch traders' });
    }
};



exports.getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid trader id" });
        }

        const trader = await Trader.findById(id);

        if (!trader) {
            return res.status(404).json({ error: "Trader not found" });
        }

        return res.status(200).json(trader);
    } catch (err) {
        console.log("getById error:", err);
        return res.status(500).json({ error: "Failed to fetch trader" });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        const trader = await Trader.findByIdAndDelete(id);
        if (!trader) {
            return res.status(404).json({ error: 'Trader not found' });
        }
        res.json({ message: 'Trader deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete trader' });
    }
};


// exports.updateStatus = async (req, res) => {
//     try {
//         const { id } = req.params;

//         const farmer = await Trader.findById(id);
//         if (!farmer) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Farmer not found",
//             });
//         }

//         farmer.status = farmer.status === "Active" ? "Inactive" : "Active";
//         await farmer.save();

//         try {
//             if (farmer.fcmToken) {
//                 const title =
//                     farmer.status === "Active"
//                         ? "Account Approved ✅"
//                         : "Account Deactivated ❌";

//                 const body =
//                     farmer.status === "Active"
//                         ? "Admin approved your account. You can start using the app."
//                         : "Your account has been deactivated by admin. Please contact support.";

//                 await sendPushNotification(
//                     farmer.fcmToken,
//                     title,
//                     body
//                 );
//             }
//         } catch (pushErr) {
//             console.error("Push notification failed:", pushErr.message);
//         }

//         const responseData = farmer.toObject();
//         delete responseData.password;
//         console.log("responseData", responseData)

//         return res.json({
//             success: true,
//             message: `Farmer status updated to ${farmer.status}`,
//             data: responseData,
//         });
//     } catch (err) {
//         console.error("Toggle Status Error:", err);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to update status",
//         });
//     }
// };

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const trader = await Trader.findById(id);
        if (!trader) {
            return res.status(404).json({
                success: false,
                message: "Trader not found",
            });
        }

        // ✅ Toggle
        trader.status = trader.status === "Active" ? "Inactive" : "Active";
        await trader.save();

        // ✅ Push notification (optional)
        try {
            if (trader.fcmToken) {
                const title =
                    trader.status === "Active"
                        ? "Account Approved ✅"
                        : "Account Deactivated ❌";

                const body =
                    trader.status === "Active"
                        ? "Admin approved your account. You can start using the app."
                        : "Your account has been deactivated by admin. Please contact support.";

                await sendPushNotification(trader.fcmToken, title, body, { notificationType: "ACCOUNT_STATUS_UPDATED", status: trader.status });
            }
        } catch (pushErr) {
            console.error("Push notification failed:", pushErr.message);
        }

        // ✅ In-App Notification (ADMIN VIEW)
        // This will show in Admin "All notifications" page (filter notifyTo=admin)
        try {
            await InAppNotification.create({
                userId: String(trader._id), // schema type is String
                notificationType: "TRADER_STATUS_TOGGLED",
                thumbnailTitle: "Trader status updated",
                notifyTo: "admin",
                message: `Trader ${trader.name || ""} status changed to ${trader.status}.`,
                metaData: {
                    traderId: String(trader._id),
                    status: trader.status,
                },
                status: "unread",
            });
        } catch (notiErr) {
            console.error("In-app notification save failed:", notiErr.message);
        }
        const responseData = trader.toObject();
        delete responseData.password;

        return res.json({
            success: true,
            message: `Trader status updated to ${trader.status}`,
            data: responseData,
        });
    } catch (err) {
        console.error("Toggle Status Error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to update status",
        });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { userId, oldPassword, newPassword } = req.body;

        if (!userId || !oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "User ID, old password and new password are required",
            });
        }

        const farmer = await Trader.findById(userId);
        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const isMatch = await bcrypt.compare(oldPassword, farmer.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Old password is incorrect",
            });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        farmer.password = hashedNewPassword;
        await farmer.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });

    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to change password",
        });
    }
};

exports.saveFcmToken = async (req, res) => {
    try {
        const { userId, fcmToken } = req.body;

        if (!userId || !fcmToken) {
            return res.status(400).json({
                success: false,
                message: "User ID and FCM token are required",
            });
        }

        const farmer = await Trader.findByIdAndUpdate(
            userId,
            { fcmToken },
            { new: true }
        );

        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: "Farmer not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "FCM token saved successfully",
        });
    } catch (error) {
        console.error("Save FCM Token Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to save FCM token",
        });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const { userId, reason } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: "userId is required" });
        }

        const trader = await Trader.findById(userId);
        if (!trader) {
            return res.status(404).json({ success: false, message: "Account not found" });
        }

        // Check if deletion is already requested
        if (trader.deletionStatus === "pending_deletion") {
            return res.status(400).json({ success: false, message: "Deletion request already pending" });
        }

        // Mark account for deletion instead of deleting immediately
        await Trader.findByIdAndUpdate(userId, {
            deletionRequested: true,
            deletionRequestedAt: new Date(),
            deletionStatus: "pending_deletion"
        });

        // Create deletion request for admin
        const AccountDeletionRequest = require("../Modal/AccountDeletionRequest");
        await AccountDeletionRequest.create({
            userId: userId,
            userType: "trader",
            userEmail: trader.email,
            userName: trader.firstName || trader.businessName || "User",
            reason: reason || "User requested account deletion",
            status: "pending"
        });

        res.json({
            success: true,
            message: "Account deletion request submitted. Your account has been deactivated. Admin will review your request and permanently delete your account."
        });
    } catch (err) {
        console.error("Delete Account Error:", err);
        res.status(500).json({ success: false, message: "Failed to process deletion request" });
    }
};