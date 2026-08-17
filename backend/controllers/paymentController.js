const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_for_server_start";
const stripe = require("stripe")(stripeKey);

exports.createPaymentIntent = async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({
        message: "Stripe secret key is not set in backend/.env"
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 500,
      currency: "usd",
      payment_method_types: ["card"]
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({
      message: "Payment creation failed"
    });
  }
};