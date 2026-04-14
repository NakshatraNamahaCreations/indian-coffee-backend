/**
 * cloudinaryConfig.js
 * -------------------
 * Central Cloudinary setup for the entire backend.
 * Uses multer memoryStorage + manual stream upload to avoid
 * multer-storage-cloudinary incompatibility with multer v2.
 */

const cloudinary = require("cloudinary").v2;
const multer = require("multer");

// ─── Configure Cloudinary ────────────────────────────────────────────────────
// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dj3uz12s3",
//     api_key: process.env.CLOUDINARY_API_KEY || "964536758197172",
//     api_secret: process.env.CLOUDINARY_API_SECRET || "6yZspyNZTVYJaJQXJVXLpxVlSbo",
// });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dj3uz12s3",
    api_key: process.env.CLOUDINARY_API_KEY || "322597196851185",
    api_secret: process.env.CLOUDINARY_API_SECRET || "v0MrhN3XP7BPoWIRIP1dN7ilpRI",
});


// ─── Startup check ───────────────────────────────────────────────────────────
const { cloud_name, api_key, api_secret } = cloudinary.config();
if (!cloud_name || !api_key || !api_secret) {
    console.error("=".repeat(60));
    console.error("❌  CLOUDINARY NOT CONFIGURED");
    console.error("=".repeat(60));
} else {
    console.log(`✅  Cloudinary ready  (cloud: ${cloud_name})`);
}

// ─── Internal upload helper ───────────────────────────────────────────────────
function streamToCloudinary(buffer, folder, resourceType, fieldname) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: resourceType,
                public_id: `${fieldname}-${Date.now()}`,
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
}

// ─── Attach Cloudinary URLs onto req.file / req.files after multer ────────────
async function attachCloudinaryUrls(req, folder, resourceType) {
    // single file
    if (req.file && req.file.buffer) {
        const result = await streamToCloudinary(
            req.file.buffer, folder, resourceType, req.file.fieldname
        );
        req.file.path = result.secure_url;
        req.file.filename = result.public_id;
        return;
    }

    // fields / array — req.files can be an object (fields) or an array
    if (req.files) {
        if (Array.isArray(req.files)) {
            for (const file of req.files) {
                if (!file.buffer) continue;
                const result = await streamToCloudinary(
                    file.buffer, folder, resourceType, file.fieldname
                );
                file.path = result.secure_url;
                file.filename = result.public_id;
            }
        } else {
            // object keyed by field name, each value is an array
            for (const files of Object.values(req.files)) {
                for (const file of files) {
                    if (!file.buffer) continue;
                    const result = await streamToCloudinary(
                        file.buffer, folder, resourceType, file.fieldname
                    );
                    file.path = result.secure_url;
                    file.filename = result.public_id;
                }
            }
        }
    }
}

// ─── Factory ─────────────────────────────────────────────────────────────────
/**
 * Creates a multer middleware that uploads directly to Cloudinary.
 *
 * @param {string}   folder         Cloudinary folder, e.g. "indian_coffee/banners"
 * @param {string}   resourceType   "image" | "video" | "raw" | "auto"
 * @param {number}   [maxSizeBytes] defaults to 200 MB
 * @returns object with .single(), .array(), .fields() methods
 */
function createUploader(folder, resourceType = "image", maxSizeBytes = 200 * 1024 * 1024) {
    const upload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: maxSizeBytes },
    });

    function wrap(multerMiddleware) {
        return (req, res, next) => {
            multerMiddleware(req, res, async (err) => {
                if (err) return next(err);
                try {
                    await attachCloudinaryUrls(req, folder, resourceType);
                    next();
                } catch (uploadErr) {
                    next(uploadErr);
                }
            });
        };
    }

    return {
        single: (fieldName) => wrap(upload.single(fieldName)),
        array: (fieldName, maxCount) => wrap(upload.array(fieldName, maxCount)),
        fields: (fieldsArr) => wrap(upload.fields(fieldsArr)),
    };
}

/**
 * Creates a multer middleware for product uploads with per-field resource types:
 *   - productImages    → resource_type: "image"
 *   - productvideofile → resource_type: "video"
 *   - productFile      → resource_type: "raw"
 *
 * Returns an object with .single(), .array(), .fields() methods.
 */
function createProductUploader(folder = "indian_coffee/products") {
    const upload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: 200 * 1024 * 1024 },
    });

    function getResourceType(fieldname) {
        if (fieldname === "productvideofile") return "video";
        if (fieldname === "productFile") return "raw";
        return "image";
    }

    async function uploadProductFiles(req) {
        // single file (req.file)
        if (req.file && req.file.buffer) {
            const result = await streamToCloudinary(
                req.file.buffer, folder, getResourceType(req.file.fieldname), req.file.fieldname
            );
            req.file.path = result.secure_url;
            req.file.filename = result.public_id;
            return;
        }

        // fields / array (req.files)
        if (req.files) {
            if (Array.isArray(req.files)) {
                for (const file of req.files) {
                    if (!file.buffer) continue;
                    const result = await streamToCloudinary(
                        file.buffer, folder, getResourceType(file.fieldname), file.fieldname
                    );
                    file.path = result.secure_url;
                    file.filename = result.public_id;
                }
            } else {
                for (const files of Object.values(req.files)) {
                    for (const file of files) {
                        if (!file.buffer) continue;
                        const result = await streamToCloudinary(
                            file.buffer, folder, getResourceType(file.fieldname), file.fieldname
                        );
                        file.path = result.secure_url;
                        file.filename = result.public_id;
                    }
                }
            }
        }
    }

    function wrap(multerMiddleware) {
        return (req, res, next) => {
            multerMiddleware(req, res, async (err) => {
                if (err) return next(err);
                try {
                    await uploadProductFiles(req);
                    next();
                } catch (uploadErr) {
                    next(uploadErr);
                }
            });
        };
    }

    return {
        single: (fieldName) => wrap(upload.single(fieldName)),
        array: (fieldName, maxCount) => wrap(upload.array(fieldName, maxCount)),
        fields: (fieldsArr) => wrap(upload.fields(fieldsArr)),
    };
}

// ─── Delete helper ────────────────────────────────────────────────────────────
/**
 * Deletes a file from Cloudinary given its URL.
 */
async function deleteFromCloudinary(url, resourceType = "image") {
    if (!url || !String(url).startsWith("https://res.cloudinary.com")) return;
    try {
        const parts = String(url).split("/upload/");
        if (parts.length < 2) return;
        const withoutVersion = parts[1].replace(/^v\d+\//, "");
        const publicId = withoutVersion.replace(/\.[^.]+$/, "");
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (_) {
        // ignore — non-fatal
    }
}

module.exports = { cloudinary, createUploader, createProductUploader, deleteFromCloudinary };
