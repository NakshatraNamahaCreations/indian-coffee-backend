const Farmer = require("../Modal/Farmer");
const bcrypt = require("bcryptjs");
const Otp = require("../Modal/Otp");
const sendOtpSms = require("../utils/sendOtpSms")



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
            bidLimit,
        } = req.body;

        if (!email || !password || !mobileNumber) {
            return res.status(400).json({
                success: false,
                message: "Email, password and mobile number are required",
            });
        }

        const existingUser = await Farmer.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const files = req.files || {};

        const farmer = new Farmer({
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

            aadhaarFront: files.aadhaarFront?.[0]?.path,
            aadhaarBack: files.aadhaarBack?.[0]?.path,
            panImage: files.panImage?.[0]?.path,
            gstImage: files.gstImage?.[0]?.path,
            registrationDocs: files.registrationDocs?.map((f) => f.path),

            bidLimit: Number(bidLimit) || 5,
        });

        await farmer.save();

        const responseData = farmer.toObject();
        delete responseData.password;

        res.status(201).json({
            success: true,
            message: "Farmer registered successfully",
            data: responseData,
        });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};


exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const farmer = await Farmer.findOne({ email });
        if (!farmer) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const isMatch = await bcrypt.compare(password, farmer.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const responseData = farmer.toObject();
        delete responseData.password;

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: responseData,
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({
            success: false,
            message: "Login failed",
        });
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

        const farmer = await Farmer.findOne({ mobileNumber });
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

        const farmer = await Farmer.findOne({ mobileNumber }).select("-password");

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


exports.edit = async (req, res) => {
    try {
        const { id } = req.params;
        const files = req.files || {};

        const farmer = await Farmer.findById(id);
        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: "Farmer not found",
            });
        }

        Object.assign(farmer, req.body);

        if (files.aadhaarFront?.[0]) farmer.aadhaarFront = files.aadhaarFront[0].path;
        if (files.aadhaarBack?.[0]) farmer.aadhaarBack = files.aadhaarBack[0].path;
        if (files.panImage?.[0]) farmer.panImage = files.panImage[0].path;
        if (files.gstImage?.[0]) farmer.gstImage = files.gstImage[0].path;
        if (files.registrationDocs?.length) {
            farmer.registrationDocs = files.registrationDocs.map((f) => f.path);
        }

        await farmer.save();

        const responseData = farmer.toObject();
        delete responseData.password;

        res.json({
            success: true,
            message: "Farmer updated successfully",
            data: responseData,
        });
    } catch (err) {
        console.error("Edit Error:", err);
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};


exports.getAll = async (req, res) => {
    try {
        const farmers = await Farmer.find().select("-password");
        res.json({
            success: true,
            data: farmers,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch farmers",
        });
    }
};


exports.getById = async (req, res) => {
    try {
        const farmer = await Farmer.findById(req.params.id).select("-password");
        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: "Farmer not found",
            });
        }

        res.json({
            success: true,
            data: farmer,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch farmer",
        });
    }
};

exports.delete = async (req, res) => {
    try {
        const farmer = await Farmer.findByIdAndDelete(req.params.id);
        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: "Farmer not found",
            });
        }

        res.json({
            success: true,
            message: "Farmer deleted successfully",
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to delete farmer",
        });
    }
};





exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const farmer = await Farmer.findById(id);
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

        // if (newPassword.length < 6) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "New password must be at least 6 characters",
        //     });
        // }

        // 2️⃣ Find user
        const farmer = await Farmer.findById(userId);
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