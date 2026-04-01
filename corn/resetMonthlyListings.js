// Cron job placeholder - currently unused as farmer subscriptions use one-time bid limits
// Kept for reference if future monthly reset logic is needed

const cron = require("node-cron");

function startResetMonthlyListingsCron() {
    // No-op: farmer subscriptions now use fixed bid limits that don't reset
    console.log("✅ Farmer cron job initialized (no reset logic needed)");
}

module.exports = { startResetMonthlyListingsCron };
