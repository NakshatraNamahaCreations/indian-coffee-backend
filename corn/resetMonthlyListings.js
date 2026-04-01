const cron = require("node-cron");
const Farmer = require("../Modal/Farmer");

function startResetMonthlyListingsCron() {
    cron.schedule(
        "0 0 1 * *",   // At 00:00 on day-of-month 1
        async () => {
            try {
                await Farmer.updateMany({}, {
                    $set: {
                        monthlyListingCount: 0,
                        featuredListingCount: 0
                    }
                });
                console.log("✅ Monthly listing count reset for all farmers");
            } catch (err) {
                console.log("❌ Monthly listing reset error:", err);
            }
        },
        { timezone: "Asia/Kolkata" }
    );
}

module.exports = { startResetMonthlyListingsCron };
