// config/cloudinary.js
const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dj3uz12s3",
    api_key: process.env.CLOUDINARY_API_KEY || "964536758197172",
    api_secret: process.env.CLOUDINARY_API_SECRET || "6yZspyNZTVYJaJQXJVXLpxVlSbo",
});

module.exports = cloudinary;
