const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure cloudinary once — driven entirely by env vars
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Creates a multer instance backed by Cloudinary storage.
 *
 * @param {string}   folder         - Cloudinary folder name (e.g. "banners", "products")
 * @param {string}   resourceType   - "image" | "video" | "raw" | "auto"
 * @param {string[]} [allowedFormats] - e.g. ["jpg","png","webp"]. Omit to allow all for that resource type.
 * @param {number}   [fileSizeBytes]  - multer fileSize limit in bytes. Defaults to 50 MB.
 * @returns {multer.Multer}
 */
function createCloudinaryUploader(
    folder,
    resourceType = "image",
    allowedFormats = undefined,
    fileSizeBytes = 50 * 1024 * 1024
) {
    const paramsConfig = {
        folder,
        resource_type: resourceType,
    };
    if (allowedFormats && allowedFormats.length > 0) {
        paramsConfig.allowed_formats = allowedFormats;
    }

    const storage = new CloudinaryStorage({
        cloudinary,
        params: async (req, file) => paramsConfig,  // ✅ Use async function
    });

    return multer({
        storage,
        limits: { fileSize: fileSizeBytes },
    });
}

/**
 * Extract Cloudinary public_id from a full URL.
 * URL pattern: https://res.cloudinary.com/<cloud>/image/upload/v<ver>/<folder>/<publicId>.<ext>
 * Returns e.g. "banners/banner-1234567890" (no extension).
 */
function extractPublicId(url) {
    if (!url || !url.includes("cloudinary.com")) return null;
    // Strip query params, split on "/upload/", take the part after version segment
    const afterUpload = url.split("/upload/")[1];
    if (!afterUpload) return null;
    // Remove version segment if present (v1234567890/)
    const withoutVersion = afterUpload.replace(/^v\d+\//, "");
    // Remove extension
    return withoutVersion.replace(/\.[^/.]+$/, "");
}

module.exports = { cloudinary, createCloudinaryUploader, extractPublicId };
