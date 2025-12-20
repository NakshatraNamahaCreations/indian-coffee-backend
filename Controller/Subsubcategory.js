const SubSubcategory = require("../Modal/Subsubcategory");
const Category = require("../Modal/Category");
const Subcategory = require("../Modal/Subcategory");

exports.createSubSubcategory = async (req, res) => {
    try {
        const { categoryId, subcategoryId, subsubcategoryName } = req.body;

        let category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        let subcategory = await Subcategory.findById(subcategoryId);
        if (!subcategory) {
            return res.status(404).json({ success: false, message: "Subcategory not found" });
        }

        let imagePath = "";
        if (req.file) {
            imagePath = req.file.path.replace(/\\/g, "/");
        }

        const newSubSub = new SubSubcategory({
            categoryId,
            categoryName: category.Categoryname,
            subcategoryId,
            subcategoryName: subcategory.subcategoryName,
            subsubcategoryName,
            subsubcategoryImage: imagePath
        });

        await newSubSub.save();

        res.status(201).json({ success: true, data: newSubSub });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getAllSubSubcategories = async (req, res) => {
    try {
        const data = await SubSubcategory.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateSubSubcategory = async (req, res) => {
    try {
        const { categoryId, subcategoryId, subsubcategoryName } = req.body;

        const subSub = await SubSubcategory.findById(req.params.id);
        if (!subSub) {
            return res.status(404).json({ success: false, message: "Not found" });
        }

        let imagePath = subSub.subsubcategoryImage;
        if (req.file) {
            imagePath = req.file.path.replace(/\\/g, "/");
        }

        // Fetch category + subcategory names
        let category = await Category.findById(categoryId);
        let subcategory = await Subcategory.findById(subcategoryId);

        subSub.categoryId = categoryId;
        subSub.categoryName = category.Categoryname;
        subSub.subcategoryId = subcategoryId;
        subSub.subcategoryName = subcategory.subcategoryName;
        subSub.subsubcategoryName = subsubcategoryName;
        subSub.subsubcategoryImage = imagePath;

        await subSub.save();

        res.json({ success: true, data: subSub });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteSubSubcategory = async (req, res) => {
    try {
        const deleted = await SubSubcategory.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: "Not found" });
        }

        res.json({ success: true, message: "Deleted successfully" });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getSubSubcategoriesBySubcategory = async (req, res) => {
    try {
        const { subcategoryId } = req.params;

        if (!subcategoryId) {
            return res.status(400).json({
                success: false,
                message: "Subcategory ID is required"
            });
        }

        const data = await SubSubcategory.find({ subcategoryId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
