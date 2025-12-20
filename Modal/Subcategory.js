const mongoose = require("mongoose");

const subcategorySchema = new mongoose.Schema(
    {
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },

        categoryName: {
            type: String,
            required: true
        },

        subcategoryName: {
            type: String,
            required: true
        },
        subsubcategoryName: {
            type: String
        },
        subcategoryImage: {
            type: String,
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Subcategory", subcategorySchema);
