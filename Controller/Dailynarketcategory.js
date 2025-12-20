const DailyMarketCategory = require("../Modal/Dailynarketcategory");

exports.createCategory = async (req, res) => {
    try {
        const { categoryName, dailycategoryName } = req.body;

        if (!categoryName || !dailycategoryName) {
            return res.status(400).json({
                message: "Both categoryName and dailycategoryName are required",
            });
        }

        const exists = await DailyMarketCategory.findOne({
            categoryName,
            dailycategoryName,
        });

        if (exists) {
            return res.status(400).json({
                message: "Category already exists",
            });
        }

        const category = new DailyMarketCategory({
            categoryName,
            dailycategoryName,
        });

        await category.save();

        res.status(201).json({
            success: true,
            message: "Daily market category added successfully",
            data: category,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await DailyMarketCategory.find().sort({
            createdAt: -1,
        });

        res.status(200).json({
            success: true,
            data: categories,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { categoryName, dailycategoryName } = req.body;

        const updated = await DailyMarketCategory.findByIdAndUpdate(
            req.params.id,
            { categoryName, dailycategoryName },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: updated,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        await DailyMarketCategory.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
