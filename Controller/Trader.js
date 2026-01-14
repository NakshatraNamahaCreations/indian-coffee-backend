const { default: mongoose } = require('mongoose');
const Trader = require('../Modal/Trader');
const bcrypt = require('bcryptjs');
const Otp = require("../Modal/Otp");
const sendOtpSms = require("../utils/sendOtpSms");

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
            bidLimit
        } = req.body;

        const exist = await Trader.findOne({ email });
        if (exist) {
            return res.status(400).json({
                success: false,
                error: "Email already exists"
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

            aadhaarFront: files.aadhaarFront?.[0]?.path || null,
            aadhaarBack: files.aadhaarBack?.[0]?.path || null,
            panImage: files.panImage?.[0]?.path || null,
            gstImage: files.gstImage?.[0]?.path || null,

            bidLimit: Number(bidLimit) || 5,
        });

        await trader.save();

        return res.status(200).json({
            success: true,
            message: "Registration successful",
            data: {
                _id: trader._id,
                userType: trader.userType,
                email: trader.email,
                mobileNumber: trader.mobileNumber,
                state: trader.state,
                district: trader.district,
                townVillage: trader.townVillage
            }
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

            bidLimit: Number(bidLimit) || 5,
        });

        await trader.save();

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
            bidLimit
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

        if (userType === 'individual') {
            updateData.firstName = firstName;
            updateData.lastName = lastName;

            if (files.aadhaarFront?.[0]) {
                if (oldTrader.aadhaarFront) {
                    const oldPath = path.join(__dirname, '..', oldTrader.aadhaarFront);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
                updateData.aadhaarFront = `/uploads/${files.aadhaarFront[0].filename}`;
            }
            if (files.aadhaarBack?.[0]) {
                if (oldTrader.aadhaarBack) {
                    const oldPath = path.join(__dirname, '..', oldTrader.aadhaarBack);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
                updateData.aadhaarBack = `/uploads/${files.aadhaarBack[0].filename}`;
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
                if (oldTrader.panImage) {
                    const oldPath = path.join(__dirname, '..', oldTrader.panImage);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
                updateData.panImage = `/uploads/${files.panImage[0].filename}`;
            }
            if (files.gstImage?.[0]) {
                if (oldTrader.gstImage) {
                    const oldPath = path.join(__dirname, '..', oldTrader.gstImage);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
                updateData.gstImage = `/uploads/${files.gstImage[0].filename}`;
            }
            if (files.registrationDocs?.length) {
                (oldTrader.registrationDocs || []).forEach(docPath => {
                    const oldPath = path.join(__dirname, '..', docPath);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                });
                updateData.registrationDocs = files.registrationDocs.map(f => `/uploads/${f.filename}`);
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



exports.sendLoginOtp = async (req, res) => {
    try {
        const { mobileNumber } = req.body;

        if (!mobileNumber) {
            return res.status(400).json({
                success: false,
                message: "Mobile number is required",
            });
        }

        const farmer = await Trader.findOne({ mobileNumber });
        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: "Mobile number not registered",
            });
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        await Otp.deleteMany({ mobileNumber });

        await Otp.create({
            mobileNumber,
            otp,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });

        await sendOtpSms(mobileNumber, otp);

        res.status(200).json({
            success: true,
            message: "OTP sent for login",
        });

    } catch (error) {
        console.error("Login OTP Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send OTP",
        });
    }
};

exports.verifyOtpAndLogin = async (req, res) => {
    try {
        const { mobileNumber, otp } = req.body;

        if (!mobileNumber || !otp) {
            return res.status(400).json({
                success: false,
                message: "Mobile number and OTP are required",
            });
        }

        const otpRecord = await Otp.findOne({ mobileNumber, otp });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        if (otpRecord.expiresAt < new Date()) {
            await Otp.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({
                success: false,
                message: "OTP expired",
            });
        }

        await Otp.deleteOne({ _id: otpRecord._id });

        const farmer = await Trader.findOne({ mobileNumber }).select("-password");

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: farmer,
        });

    } catch (error) {
        console.error("Verify OTP Login Error:", error);
        res.status(500).json({
            success: false,
            message: "Login failed",
        });
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
                message: "Invalid email or password",
            });
        }

        const isMatch = await bcrypt.compare(password, trader.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
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

// exports.getById = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const trader = await Trader.findById(id);
//         if (!trader) {
//             return res.status(404).json({ error: 'Trader not found' });
//         }
//         res.json(trader);
//     } catch (err) {
//         res.status(500).json({ error: 'Failed to fetch trader' });
//     }
// };

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


exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const farmer = await Trader.findById(id);
        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: "Farmer not found",
            });
        }

        farmer.status = farmer.status === "Active" ? "Inactive" : "Active";

        await farmer.save();

        const responseData = farmer.toObject();
        delete responseData.password;

        res.json({
            success: true,
            message: `Farmer status updated to ${farmer.status}`,
            data: responseData,
        });
    } catch (err) {
        console.error("Toggle Status Error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to update status",
        });
    }
};



exports.changePassword = async (req, res) => {
    try {
        const { userId, oldPassword, newPassword } = req.body;

        // 1️⃣ Validate input
        if (!userId || !oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "User ID, old password and new password are required",
            });
        }



        // 2️⃣ Find user
        const farmer = await Trader.findById(userId);
        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // 3️⃣ Check old password
        const isMatch = await bcrypt.compare(oldPassword, farmer.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Old password is incorrect",
            });
        }

        // 4️⃣ Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // 5️⃣ Update password
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