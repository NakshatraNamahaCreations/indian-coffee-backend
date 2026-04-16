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
        // Meon accepts both gst_number and gstin as field names; try gst_number first
        const meonHeaders = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };

        let gstRes;
        try {
            gstRes = await axios.post(
                `${MEON_BASE}/gst/search_business_name`,
                { gst_number: gst, gstin: gst },
                { headers: meonHeaders, timeout: 20000 }
            );
        } catch (err) {
            console.error("Meon GST error:", err?.response?.status, err?.response?.data || err.message);
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
        console.log("Meon GST raw response:", JSON.stringify(d, null, 2));

        // Meon may nest data — handle both flat and nested responses
        // Also handles official GST API abbreviated field names (lgnm, tradeNam, sts, ctb, dty)
        const info = d.data || d.result || d.taxpayerInfo || d.gstin_details || d;

        // Helper: walk nested objects to find a field by multiple possible names
        const pick = (obj, ...keys) => {
            for (const k of keys) {
                const val = obj?.[k];
                if (val && typeof val === "string" && val.trim()) return val.trim();
            }
            // Try one level deeper (d.data, d.result, etc.)
            for (const nested of [obj?.data, obj?.result, obj?.taxpayerInfo, obj?.gstin_details]) {
                if (!nested || typeof nested !== "object") continue;
                for (const k of keys) {
                    const val = nested?.[k];
                    if (val && typeof val === "string" && val.trim()) return val.trim();
                }
            }
            return "";
        };

        // Official GST API uses: tradeNam, lgnm, sts, ctb, dty
        // Others use: trade_name/tradeName, legal_name/legalName, status, constitutionOfBusiness, taxpayerType
        const businessName = pick(info,
            "tradeNam", "trade_name", "tradeName",
            "lgnm", "legal_name", "legalName",
            "company_name", "companyName", "name"
        );

        const legalName = pick(info,
            "lgnm", "legal_name", "legalName",
            "tradeNam", "trade_name", "tradeName",
            "company_name", "companyName"
        ) || businessName;

        // PAN is always chars 3–12 of a valid Indian GST number
        const pan = gst.substring(2, 12);

        // Address — official API nests under pradr.addr; others use flat fields
        let address = pick(info,
            "principal_place_of_business", "principalPlaceOfBusiness", "address"
        );
        if (!address && info?.pradr?.addr) {
            const a = info.pradr.addr;
            address = [a.bno, a.flno, a.bnm, a.st, a.loc, a.dst, a.stcd, a.pncd]
                .filter(Boolean).join(", ");
        }

        const entityType = pick(info,
            "ctb", "constitution_of_business", "constitutionOfBusiness",
            "entity_type", "entityType"
        );

        const registrationType = pick(info,
            "dty", "taxpayer_type", "taxpayerType",
            "registration_type", "registrationType"
        );

        const gstStatus = pick(info,
            "sts", "status", "gstin_status", "gstinStatus"
        );

        if (!businessName && !legalName) {
            console.error("GST fields not found in response. Full data:", JSON.stringify(d));
            return res.status(404).json({
                success: false,
                message: "Could not retrieve business details for this GST number. Please verify it is active on the GST portal.",
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
