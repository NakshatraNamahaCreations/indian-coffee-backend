const axios = require("axios");

const MEON_BASE = "https://ocr.meon.co.in";
const MEON_CREDS = {
    company_id: "67542",
    email: "indiancoffeemart18@gmail.com",
    password: "indiancoffeemart123",
};

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// Internal: fetch a fresh Meon JWT
const getMeonToken = async () => {
    const res = await axios.post(`${MEON_BASE}/get_token`, MEON_CREDS, {
        timeout: 15000,
    });
    const token =
        res.data?.token ||
        res.data?.access_token ||
        res.data?.jwt ||
        res.data?.data?.token;

    if (!token) throw new Error("Meon token not found in response");
    return token;
};

// POST /api/gst/verify
exports.verifyGst = async (req, res) => {
    try {
        const raw = req.body?.gstNumber;

        if (!raw || typeof raw !== "string" || !raw.trim()) {
            return res.status(400).json({ success: false, message: "GST number is required." });
        }

        const gst = raw.trim().toUpperCase();

        if (!GST_REGEX.test(gst)) {
            return res.status(400).json({
                success: false,
                message: "Invalid GST format. Must be 15 characters (e.g. 29AIZPH5569G1ZE).",
            });
        }

        // Step 1 — get Meon token
        let token;
        try {
            token = await getMeonToken();
        } catch (err) {
            console.error("Meon token error:", err?.response?.data || err.message);
            return res.status(502).json({
                success: false,
                message: "Could not connect to GST verification service. Please try again.",
            });
        }

        // Step 2 — verify GST
        let gstRes;
        try {
            gstRes = await axios.post(
                `${MEON_BASE}/gst/search_business_name`,
                { gst_number: gst },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    timeout: 20000,
                }
            );
        } catch (err) {
            console.error("Meon GST error:", err?.response?.data || err.message);
            const status = err?.response?.status;
            if (status === 404 || status === 422 || status === 400) {
                return res.status(404).json({
                    success: false,
                    message: "GST number not found or inactive. Please check and try again.",
                });
            }
            if (err.code === "ECONNABORTED") {
                return res.status(504).json({
                    success: false,
                    message: "GST verification timed out. Please try again.",
                });
            }
            return res.status(502).json({
                success: false,
                message: "GST verification failed. Please try again.",
            });
        }

        const d = gstRes.data || {};

        // Meon may nest data — handle both flat and nested responses
        const info = d.data || d.result || d;

        const businessName =
            info.trade_name || info.tradeName || info.tradeNam ||
            info.legal_name || info.legalName || "";

        const legalName =
            info.legal_name || info.legalName ||
            info.trade_name || info.tradeName || businessName;

        // PAN is always chars 3–12 of GST
        const pan = gst.substring(2, 12);

        const address =
            info.principal_place_of_business ||
            info.principalPlaceOfBusiness ||
            info.address || "";

        const entityType =
            info.constitution_of_business ||
            info.constitutionOfBusiness ||
            info.entity_type || info.entityType || "";

        const registrationType =
            info.taxpayer_type ||
            info.taxpayerType ||
            info.registration_type || info.registrationType || "";

        const gstStatus =
            info.status || info.gstin_status || info.gstinStatus || "";

        if (!businessName && !legalName) {
            return res.status(404).json({
                success: false,
                message: "Could not retrieve business details for this GST number.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "GST verified successfully.",
            data: {
                gstNumber: gst,
                businessName,
                legalName,
                pan,
                address,
                entityType,
                registrationType,
                status: gstStatus,
            },
        });
    } catch (error) {
        console.error("verifyGst unexpected error:", error.message);
        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred during GST verification.",
        });
    }
};
