const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
    {
        Categoryname: {
            type: String,
            required: true
        },
        Categoryimage: {
            type: String,
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
