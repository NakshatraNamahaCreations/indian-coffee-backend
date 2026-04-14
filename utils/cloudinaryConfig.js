/**
 * cloudinaryConfig.js
 * -------------------
 * Central Cloudinary setup for the entire backend.
 * Every upload route imports from here — only one place to update credentials.
 */

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// ─── Configure Cloudinary ────────────────────────────────────────────────────
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dj3uz12s3",
    api_key:    process.env.CLOUDINARY_API_KEY    || "964536758197172",
    api_secret: process.env.CLOUDINARY_API_SECRET || "6yZspyNZTVYJaJQXJVXLpxVlSbo",
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

// ─── Factory ─────────────────────────────────────────────────────────────────
/**
 * Creates a multer middleware that uploads directly to Cloudinary.
 *
 * @param {string}   folder         Cloudinary folder, e.g. "indian_coffee/banners"
 * @param {string}   resourceType   "image" | "video" | "raw" | "auto"
 * @param {number}   [maxSizeBytes] defaults to 200 MB
 * @returns multer instance
 */
function createUploader(
    folder,
    resourceType = "image",
    maxSizeBytes = 200 * 1024 * 1024
) {
    const storage = new CloudinaryStorage({
        cloudinary,
        params: async (_req, file) => {
            // Auto-detect resource type for mixed uploads
            let type = resourceType;
            if (type === "auto") {
                const mime = file.mimetype || "";
                if (mime.startsWith("video/")) type = "video";
                else if (mime.startsWith("image/")) type = "image";
                else type = "raw";
            }
            return {
                folder,
                resource_type: type,
                // Use original filename base to help with debugging
                public_id: `${file.fieldname}-${Date.now()}`,
            };
        },
    });

    return multer({ storage, limits: { fileSize: maxSizeBytes } });
}

/**
 * Creates a multer middleware for product uploads:
 *   - productImages  → resource_type: "image"
 *   - productvideofile → resource_type: "video"
 *   - productFile    → resource_type: "raw"
 */
function createProductUploader(folder = "indian_coffee/products") {
    const storage = new CloudinaryStorage({
        cloudinary,
        params: async (_req, file) => {
            let resource_type = "image";
            if (file.fieldname === "productvideofile") resource_type = "video";
            else if (file.fieldname === "productFile") resource_type = "raw";
            return {
                folder,
                resource_type,
                public_id: `${file.fieldname}-${Date.now()}`,
            };
        },
    });

    return multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } });
}

// ─── Delete helper ────────────────────────────────────────────────────────────
/**
 * Deletes a file from Cloudinary given its URL.
 * Extracts the public_id from the URL and calls cloudinary.uploader.destroy().
 * Silently ignores errors (e.g. file already deleted).
 *
 * @param {string} url  Full Cloudinary URL
 * @param {string} [resourceType] "image" | "video" | "raw" (default: "image")
 */
async function deleteFromCloudinary(url, resourceType = "image") {
    if (!url || !String(url).startsWith("https://res.cloudinary.com")) return;
    try {
        // URL format: https://res.cloudinary.com/<cloud>/image/upload/v123456/<public_id>.<ext>
        const parts = String(url).split("/upload/");
        if (parts.length < 2) return;
        // Remove version segment (v1234567890/) and extension
        const withoutVersion = parts[1].replace(/^v\d+\//, "");
        const publicId = withoutVersion.replace(/\.[^.]+$/, "");
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (_) {
        // ignore — non-fatal
    }
}

module.exports = { cloudinary, createUploader, createProductUploader, deleteFromCloudinary };
