const cron = require("node-cron");
const Product = require("../Modal/Product");

console.log("🔁 Product unlock cron started");

cron.schedule("* * * * *", async () => {
    try {
        const result = await Product.updateMany(
            {
                isLocked: true,
                lockExpiresAt: { $lt: new Date() },
            },
            {
                isLocked: false,
                lockedBy: null,
                lockExpiresAt: null,
            }
        );

        if (result.modifiedCount > 0) {
            console.log(`🔓 Auto-unlocked ${result.modifiedCount} products`);
        }
    } catch (error) {
        console.error("❌ Cron unlock error:", error.message);
    }
});
