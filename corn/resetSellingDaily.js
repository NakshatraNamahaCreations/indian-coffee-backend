const cron = require("node-cron");
const Product = require("../Modal/Product");

function startResetSellingCron() {
    cron.schedule(
        "0 0 * * *",
        async () => {
            try {
                await Product.updateMany(
                    {},
                    {
                        $unset: { sellingDate: "" },
                        $set: { sellingQuantity: 0 },
                    }
                );
                console.log("✅ Daily reset done: sellingDate unset, sellingQuantity=0");
            } catch (err) {
                console.log("❌ Daily reset error:", err);
            }
        },
        {
            timezone: "Asia/Kolkata",
        }
    );
}

module.exports = { startResetSellingCron };
