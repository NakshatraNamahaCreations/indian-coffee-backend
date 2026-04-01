const cron = require("node-cron");
const Farmer = require("../Modal/Farmer");

function startResetMonthlyListingsCron() {
    cron.schedule(
        "0 0 1 * *",   // At 00:00 on day-of-month 1
        async () => {
            try {
                // Reset monthlyCountUsed for farmers with "monthly" reset type plans
                await Farmer.updateMany(
                    { countResetType: "monthly" },
                    { $set: { monthlyCountUsed: 0 } }
                );
                console.log("✅ Monthly count used reset for farmers with monthly plan type");
            } catch (err) {
                console.log("❌ Monthly count reset error:", err);
            }
        },
        { timezone: "Asia/Kolkata" }
    );
}

module.exports = { startResetMonthlyListingsCron };
