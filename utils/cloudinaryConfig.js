/**
 * cloudinaryConfig.js
 * -------------------
 * Central Cloudinary setup for the entire backend.
 * Every upload route imports from here — only one place to update credentials.
 *
 * HOW TO SET CREDENTIALS (Render):
 *   Dashboard → your service → Environment → Add the three variables below.
 *   Then click "Manual Deploy" so the new env vars take effect.
 *
 *   CLOUDINARY_CLOUD_NAME   → your cloud name from cloudinary.com/console
 *   CLOUDINARY_API_KEY      → your API key
 *   CLOUDINARY_API_SECRET   → your API secret  ← most common source of errors
 */

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// ─── Configure Cloudinary once ───────────────────────────────────────────────
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Startup check ───────────────────────────────────────────────────────────
const { cloud_name, api_key, api_secret } = cloudinary.config();
if (!cloud_name || !api_key || !api_secret) {
    console.error("=".repeat(60));
    console.error("❌  CLOUDINARY NOT CONFIGURED");
    console.error("    Missing env vars on Render:");
    if (!cloud_name) console.error("    • CLOUDINARY_CLOUD_NAME");
    if (!api_key)    console.error("    • CLOUDINARY_API_KEY");
    if (!api_secret) console.error("    • CLOUDINARY_API_SECRET");
    console.error("    Go to Render → your service → Environment → add them,");
    console.error("    then click Manual Deploy.");
    console.error("=".repeat(60));
} else {
    console.log(`✅  Cloudinary ready  (cloud: ${cloud_name})`);
}

// ─── Factory ─────────────────────────────────────────────────────────────────
/**
 * Creates a multer middleware that uploads directly to Cloudinary.
 *
 * @param {string}    folder          Cloudinary folder, e.g. "banners"
 * @param {string}    resourceType    "image" | "video" | "raw" | "auto"
 * @param {string[]}  [allowedFormats]  e.g. ["jpg","jpeg","png","webp"]
 * @param {number}    [maxSizeBytes]  defaults to 50 MB
 * @returns multer instance — use it like: upload.single("fieldName")
 */
function createUploader(
    folder,
    resourceType    = "image",
    allowedFormats  = undefined,
    maxSizeBytes    = 50 * 1024 * 1024
) {
    const params = { folder, resource_type: resourceType };
    if (allowedFormats && allowedFormats.length > 0) {
        params.allowed_formats = allowedFormats;
    }

    const storage = new CloudinaryStorage({
        cloudinary,
        // async function is required by multer-storage-cloudinary v4+
        params: async (req, file) => params,
    });

    return multer({ storage, limits: { fileSize: maxSizeBytes } });
}

module.exports = { cloudinary, createUploader };
