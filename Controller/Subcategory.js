const Subcategory = require("../Modal/Subcategory");
const Category = require("../Modal/Category");

exports.createSubcategory = async (req, res) => {
    try {
        let { categoryId, subcategoryName } = req.body;

        let category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        let imagePath = "";
        if (req.file) {
            imagePath = req.file.path.replace(/\\/g, "/");
        }

        let subcategory = new Subcategory({
            categoryId,
            categoryName: category.Categoryname,
            subcategoryName,
            subcategoryImage: imagePath
        });

        await subcategory.save();

        res.status(201).json({ success: true, data: subcategory });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


exports.getAllSubcategories = async (req, res) => {
    try {
        let data = await Subcategory.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


exports.updateSubcategory = async (req, res) => {
    try {
        let { categoryId, subcategoryName } = req.body;

        let updateData = {
            subcategoryName
        };

        if (categoryId) {
            let category = await Category.findById(categoryId);
            if (category) {
                updateData.categoryId = categoryId;
                updateData.categoryName = category.Categoryname;
            }
        }

        if (req.file) {
            updateData.subcategoryImage = req.file.path.replace(/\\/g, "/");
        }

        let data = await Subcategory.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        res.status(200).json({ success: true, data });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


exports.deleteSubcategory = async (req, res) => {
    try {
        await Subcategory.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Subcategory deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


exports.getSubcategoriesByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        if (!categoryId) {
            return res.status(400).json({
                success: false,
                message: "Category ID is required"
            });
        }

        const subcategories = await Subcategory.find({ categoryId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: subcategories
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
