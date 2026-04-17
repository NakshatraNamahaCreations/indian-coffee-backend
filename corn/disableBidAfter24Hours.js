const cron = require("node-cron");
const Product = require("../Modal/Product");

console.log("🔁 Bid auto-disable cron started (24 hours)");

// Run every 5 minutes to check for expired bids
cron.schedule("*/5 * * * *", async () => {
    try {
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const result = await Product.updateMany(
            {
                bidActive: true,
                bidActivatedAt: { $lt: twentyFourHoursAgo },
            },
            {
                bidActive: false,
                bidActivatedAt: null,
            }
        );

        if (result.modifiedCount > 0) {
            console.log(`✅ Auto-disabled bids for ${result.modifiedCount} products (24-hour expiry)`);
        }
    } catch (error) {
        console.error("❌ Cron bid disable error:", error.message);
    }
});
