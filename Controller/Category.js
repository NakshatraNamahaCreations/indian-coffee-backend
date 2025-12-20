const Category = require("../Modal/Category");

exports.createCategory = async (req, res) => {
    try {
        const { Categoryname } = req.body;
        const Categoryimage = req.file ? req.file.path : "";

        const category = new Category({
            Categoryname,
            Categoryimage
        });

        await category.save();

        res.status(201).json({
            success: true,
            data: category
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.getAllCategory = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { Categoryname } = req.body;
        let updateData = { Categoryname };

        if (req.file) {
            updateData.Categoryimage = req.file.path;
        }

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        res.status(200).json({ success: true, data: category });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Category deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
