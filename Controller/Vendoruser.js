const Vendor = require("../Modal/Vendoruser");
const bcrypt = require("bcryptjs");

exports.createVendor = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            password,
            confirmPassword,
        } = req.body;

        if (!name || !email || !phone || !password || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Password and confirm password do not match" });
        }

        const exists = await Vendor.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const vendor = await Vendor.create({
            name,
            email,
            phone,
            password: hashedPassword,
        });

        res.json({
            success: true,
            message: "Vendor created successfully",
            vendor
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getVendors = async (req, res) => {
    try {
        const vendors = await Vendor.find();
        res.json({
            success: true,
            data: vendors
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getVendorById = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);

        if (!vendor) {
            return res.status(404).json({ message: "Vendor not found" });
        }

        res.json({ success: true, data: vendor });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateVendor = async (req, res) => {
    try {
        const updatedVendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!updatedVendor) {
            return res.status(404).json({ message: "Vendor not found" });
        }

        res.json({
            success: true,
            message: "Vendor updated successfully",
            data: updatedVendor
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findByIdAndDelete(req.params.id);

        if (!vendor) {
            return res.status(404).json({ message: "Vendor not found" });
        }

        res.json({
            success: true,
            message: "Vendor deleted successfully"
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.loginVendor = async (req, res) => {
    try {
        const { email, password } = req.body;

        // ✅ Validate request
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // ✅ Check if vendor exists
        const vendor = await Vendor.findOne({ email });
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }

        // ✅ Compare password
        const isMatch = await bcrypt.compare(password, vendor.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid password"
            });
        }

        // ✅ Success response
        res.status(200).json({
            success: true,
            message: "Login successful",
            vendor: {
                _id: vendor._id,
                name: vendor.name,
                email: vendor.email,
                phone: vendor.phone
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
