const mongoose = require("mongoose");

const SubSubcategorySchema = new mongoose.Schema({
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },

    categoryName: {
        type: String,
        required: true
    },

    subcategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subcategory",
        required: true
    },

    subcategoryName: {
        type: String,
        required: true
    },

    subsubcategoryName: {
        type: String,
        required: true
    },

    subsubcategoryImage: {
        type: String,
        default: ""
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("SubSubcategory", SubSubcategorySchema);
