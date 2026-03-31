const Razorpay = require("razorpay");
require("dotenv").config();

console.log("🔍 Testing Razorpay Configuration...\n");

// Check environment variables
console.log("📝 Environment Variables:");
console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID ? "✅ Set" : "❌ Missing");
console.log("RAZORPAY_KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET ? "✅ Set" : "❌ Missing");

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("\n❌ FATAL: Razorpay credentials not configured in .env");
  process.exit(1);
}

// Try to initialize Razorpay
try {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log("\n✅ Razorpay client initialized successfully");

  // Try to create a test order
  console.log("\n🧪 Testing order creation...");
  razorpay.orders.create({
    amount: 50000, // ₹500
    currency: "INR",
    receipt: `test_${Date.now()}`,
  })
    .then((order) => {
      console.log("✅ Order created successfully!");
      console.log("Order ID:", order.id);
      console.log("\n🎉 Razorpay is properly configured!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Order creation failed:");
      console.error(err.message);
      if (err.error) console.error("Details:", err.error);
      process.exit(1);
    });
} catch (err) {
  console.error("\n❌ Failed to initialize Razorpay:");
  console.error(err.message);
  process.exit(1);
}
