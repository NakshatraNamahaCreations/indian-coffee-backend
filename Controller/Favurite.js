// Controller/Favurite.js
const Favorite = require('../Modal/Favurite');
const Product = require("../Modal/Product")

// Add to favorites
exports.addToFavorites = async (req, res) => {
    try {
        const { userId, productId } = req.body; // ← accept from body

        if (!userId || !productId) {
            return res.status(400).json({
                success: false,
                message: 'userId and productId are required'
            });
        }

        const existing = await Favorite.findOne({ userId, productId });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Already in favorites'
            });
        }

        const favorite = await Favorite.create({ userId, productId });
        res.status(201).json({ success: true, favorite });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Remove from favorites
exports.removeFromFavorites = async (req, res) => {
    try {
        const { productId } = req.params;
        const { userId } = req.body; // ← accept userId in body for DELETE (or use query)

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required'
            });
        }

        const result = await Favorite.findOneAndDelete({ userId, productId });
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Favorite not found'
            });
        }

        res.json({ success: true, message: 'Removed from favorites' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get user's favorites → accept userId as query param
// exports.getUserFavorites = async (req, res) => {
//     try {
//         const { userId } = req.params; // e.g. /getfavorites?userId=user123

//         if (!userId) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'userId is required'
//             });
//         }

//         const favorites = await Favorite.find({ userId }).select('productId');
//         const productIds = favorites.map(fav => fav.productId.toString());

//         res.json({
//             success: true,
//             data: productIds // or full objects if you prefer
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// };

exports.getUserFavorites = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required",
            });
        }

        const favorites = await Favorite.find({ userId }).select("productId");

        const productIds = favorites.map(f => f.productId);

        const products = await Product.find({ _id: { $in: productIds } });

        res.status(200).json({
            success: true,
            data: products,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


// Check favorite status
exports.checkFavoriteStatus = async (req, res) => {
    try {
        const { userId, productId } = req.query; // ✔ query params

        if (!userId || !productId) {
            return res.status(400).json({
                success: false,
                message: "userId and productId are required",
            });
        }

        const favorite = await Favorite.findOne({ userId, productId });

        res.status(200).json({
            success: true,
            isFavorite: !!favorite, // true or false
        });
    } catch (error) {
        console.error("Check favorite error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
