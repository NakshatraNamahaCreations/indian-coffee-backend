const Trader = require('../Modal/Trader');
const bcrypt = require('bcryptjs');

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
            return res.status(400).json({ error: "Email already exists" });
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
            // bidLimit,

            firstName,
            lastName,
            businessName,
            panNumber,
            gstNumber,

            aadhaarFront: files.aadhaarFront?.[0]?.path,
            aadhaarBack: files.aadhaarBack?.[0]?.path,
            panImage: files.panImage?.[0]?.path,
            gstImage: files.gstImage?.[0]?.path,
            registrationDocs: files.registrationDocs?.map(f => f.path),
            bidLimit: Number(bidLimit) || 5,
        });

        await trader.save();

        return res.status(201).json({
            message: "Trader registered",
            data: trader
        });

    } catch (err) {
        console.log("error", err)
        res.status(500).json({ error: err.message });
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

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const trader = await Trader.findById(id).select('-password');
        if (!trader) {
            return res.status(404).json({ error: 'Trader not found' });
        }
        res.json(trader);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch trader' });
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