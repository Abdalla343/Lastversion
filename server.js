// const express = require('express');
// const { sequelize, testConnection } = require('./config/database');
// const User = require('./models/User');
// const authRoutes = require('./routes/authRoutes');
// const classRoutes = require('./routes/classRoutes');
// const subjectRoutes = require('./routes/subjectRoutes');
// const gradeRoutes = require('./routes/gradeRoutes');
// // Import all models to establish relationships
// require('./models/index');
// require('dotenv').config();
// //if u need add admin const seedAdmin = require('./scripts/seedAdmin');

// // Initialize Express app
// const app = express();

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));

// // Serve frontend static files
// app.use('/frontend', express.static('frontend'));

// // Test database connection
// testConnection().then(() => {
//   // Sync database models only if connection is successful
//   return sequelize.sync({ alter: true });
// }).then(() => {
//   console.log('Database synced');
// }).catch(err => {
//   console.warn('Database connection warning: You may need to set up MySQL with correct credentials in .env file');
//   console.warn('Skipping database sync due to connection issues');
// });

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/classes', classRoutes);
// app.use('/api/subjects', subjectRoutes);
// app.use('/api/grades', gradeRoutes);

// // Basic route for testing
// app.get('/', (req, res) => {
//   res.json({ message: 'Authentication API is running' });
// });

// // Start server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {console.log(`Server running on port ${PORT}`);
// });



// /////////////////////
// const express = require('express');
// const app = express();
// require("dotenv").config();
// const Stripe = require("stripe");
// const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
// app.use(express.static("public")); // علشان صفحة HTML تشتغل
// app.use(express.json());

// // إنشاء اشتراك
// app.post("/create-subscription", async (req, res) => {
//   try {
//     const { email, paymentMethod } = req.body;

//     // Create customer
//     const customer = await stripe.customers.create({
//       email,
//       payment_method: paymentMethod,
//       invoice_settings: { default_payment_method: paymentMethod },
//     });

//     const subscription = await stripe.subscriptions.create({
//       customer: customer.id,
//       items: [{ price: process.env.PRICE_ID }],
//       payment_behavior: "default_incomplete", 
//       expand: ["latest_invoice.payment_intent"],
//     });

//     res.send({
//       clientSecret: subscription.latest_invoice.payment_intent.client_secret,
//       subscriptionId: subscription.id,
//     });
//   } catch (err) {
//     res.status(400).send({ error: err.message });
//   }
// });

// app.get('/', (req, res) => {
//   res.json({ message: 'Authentication API is running sss' });
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {console.log(`Server running on port ${PORT}`);
// });





// require("dotenv").config();
// const express = require("express");
// const axios = require("axios"); // ⬅✔ مهم جداً

// const app = express();

// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

// // مسار الدفع
// app.post("/checkout", async (req, res) => {
//   try {
//     const { amount, source } = req.body;

//     const response = await axios.post(
//   "https://api.moyasar.com/v1/payments",
//   {
//     amount: 10000,        // 100 ريال = 10000 هللة
//     currency: "SAR",
//     description: "Test payment",
//     source: {
//       type: "creditcard",
//       name: "Abdullah",
//       number: "4111111111111111",
//       month: "12",
//       year: "2026",
//       cvv: "123"
//     }
//   },
//   {
//     auth: {
//       username: process.env.MOYASAR_SECRET_KEY,
//       password: ""
//     },
//   }
// );


//     res.json(response.data);

//   } catch (err) {
//     console.log("PAYMENT ERROR:", err.response?.data || err);
//     res.status(500).json(err.response?.data || err);
//   }
// });

// // Static + root
// app.use(express.static("public"));
// app.use("/frontend", express.static("frontend"));

// app.get("/", (req, res) => {
//   res.json({ message: "Server is running" });
// });

// app.listen(3000, () => console.log("Server running on port 3000"));


// // Endpoint لإنشاء Checkout Session
// app.post("/create-checkout-session", async (req, res) => {
//   try {
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'], // هنا ممكن تضيف ['card', 'mada'] لو مدعوم
//       mode: 'payment',
//       line_items: [
//         {
//           price: process.env.PRICE_ID,
//           quantity: 1,
//         },
//       ],
//       success_url: `${req.headers.origin}/success.html`,
//       cancel_url: `${req.headers.origin}/cancel.html`,
//     });
//     res.json({ url: session.url });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.get('/', (req, res) => {
//   res.json({ message: 'Authentication API is running sssssss' });
// });
// app.listen(3000, () => console.log("Server running on port 3000"));

const https = require('https');
const http = require('http');
const selfsigned = require('selfsigned');
const express = require('express');
const { sequelize, testConnection } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const examRoutes = require('./routes/examRoutes');
const {
  createPremiumSubscriptionPayment,
  handlePaytabsCallback,
  processPaymentAndUpdateUser,
} = require('./helpers/payment_handler');
const User = require('./models/User');
require('./models/index');
require('dotenv').config();

const app = express();

// ================================
// --------------------------------

// Generate self-signed certificate

// --------------------------------
// ================================



// app.use('/frontend', express.static('frontend'));
const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, { days: 365 });

const options = {
  key: pems.private,
  cert: pems.cert,
};

// =============================
// Middleware
// =============================
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use('/frontend', express.static('frontend'));

app.use('/frontend', express.static('frontend'));
// =============================
// API Routes
// =============================
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/exams', examRoutes);

// PayTabs Premium routes
app.post('/api/premium/checkout', createPremiumSubscriptionPayment);

// PayTabs callback endpoint - handles POST requests from PayTabs after payment
// This updates the user's isPrime status in the database
app.post('/api/premium/paytabs/callback', handlePaytabsCallback);

// PayTabs return URL: Shows success page after payment
// PayTabs redirects user here after successful payment
// app.get('/premium-success', async (req, res) => {
//   console.log('Received GET to /premium-success with query:', req.query);
  
//   // Process payment callback if data is present
//   // Use the helper function that doesn't send HTTP responses
//   try {
//     const bodyData = {};
//     const queryData = req.query || {};
//     const data = { ...queryData, ...bodyData };
    
//     if (Object.keys(data).length > 0) {
//       console.log('Processing payment from return URL...');
//       const result = await processPaymentAndUpdateUser(data);
//       console.log('Payment processing result:', result);
      
//       if (result.success) {
//         console.log(`✅ User ${result.userId} successfully upgraded to Prime`);
//       } else {
//         console.warn('⚠️ Payment processing failed:', result.message);
//       }
//     } else {
//       console.log('No payment data in return URL');
//     }
//   } catch (err) {
//     console.error('Error processing payment in return URL:', err);
//     // Continue with redirect even if processing fails
//   }
  
//   // Always redirect to student page
//   return res.redirect('myapp://home?payment=success');
// });
// app.post('/premium-success', async (req, res) => {
//   console.log('Received POST to /premium-success with body:', req.body);
  
//   // Process payment callback
//   try {
//     const bodyData = req.body || {};
//     const queryData = req.query || {};
//     const data = { ...queryData, ...bodyData };
    
//     if (Object.keys(data).length > 0) {
//       console.log('Processing payment from return URL POST...');
//       const result = await processPaymentAndUpdateUser(data);
//       console.log('Payment processing result:', result);
      
//       if (result.success) {
//         console.log(`✅ User ${result.userId} successfully upgraded to Prime`);
//       } else {
//         console.warn('⚠️ Payment processing failed:', result.message);
//       }
//     }
//   } catch (err) {
//     console.error('Error processing payment in return URL:', err);
//   }
  
//   // Redirect to student page
//   return res.redirect(303, 'myapp://home?payment=success');
// });
app.get('/premium-success', (req, res) => {
  console.log('User returned from payment');
  console.log('Query params:', req.query);

  // Return a simple HTML page that the WebView can detect
  // This way the WebView can detect the URL change and handle it properly
  return res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Successful</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .container {
          text-align: center;
          background: rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
        h1 {
          font-size: 32px;
          margin-bottom: 20px;
        }
        p {
          font-size: 18px;
          margin: 10px 0;
        }
        .icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">✅</div>
        <h1>Payment Successful!</h1>
        <p>Your account has been upgraded to Premium.</p>
        <p>Please wait while we process your payment...</p>
      </div>
    </body>
    </html>
  `);
});
app.post('/payment-webhook', async (req, res) => {
  console.log('Payment webhook received:', req.body);

  try {
    const data = req.body;

    const result = await processPaymentAndUpdateUser(data);

    if (result.success) {
      console.log(`✅ User ${result.userId} upgraded to Prime`);
    } else {
      console.warn('⚠️ Webhook payment failed');
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    res.sendStatus(500);
  }
});



// Apple Pay merchant-session endpoint (must be implemented with Apple credentials).
app.post('/api/premium/applepay/merchant-session', express.json(), async (req, res) => {
  console.log('Received merchant-session request (local test)');
  // For security and correctness you must implement merchant validation with Apple using your merchant credentials.
  // Here we return 501 to indicate it's not configured. The client page will handle this and fall back to mock flow.
  return res.status(501).json({ message: 'Merchant session not configured on server. Provide Apple merchant credentials to enable real Apple Pay.' });
});

// Apple Pay processing endpoint (mock support)
app.post('/api/premium/applepay/process', express.json(), async (req, res) => {
  try {
    const { mock, userId } = req.body || {};
    if (mock) {
      // In mock mode, optionally upgrade user to Prime if userId provided (best-effort)
      if (userId) {
        try { await User.update({ isPrime: true }, { where: { id: userId } }); } catch (e) { console.warn('Mock upgrade failed', e); }
      }
      return res.json({ success: true, mock: true });
    }
    // Real processing requires payment gateway integration (not implemented)
    return res.status(501).json({ message: 'Apple Pay processing not implemented on server. Use mock mode for local testing.' });
  } catch (err) {
    console.error('Apple Pay process error:', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// Test endpoint
app.get('/', (req, res) => {
  res.json({ message: 'HTTPS Express Server is running!' });
});

// =============================
// Connect Database
// =============================
// testConnection()
//   .then(() => sequelize.sync({ alter: true }))
//   .then(() => console.log('Database synced'))
//   .catch((err) => {
//     console.warn('DB connection failed — check .env credentials');
//   });
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synced');
  })
  .catch(err => {
    console.error('Sync error:', err);
  });
// =============================
// Start HTTP and HTTPS servers
// =============================
const HTTP_PORT = 3000;  // HTTP for local development (React Native, etc.)
const HTTPS_PORT = 3001; // HTTPS for secure connections

// Start HTTP server (for local development, especially React Native)
// This makes it easier to connect from mobile emulators/simulators
http.createServer(app).listen(HTTP_PORT, () => {
  console.log(`🚀 HTTP Server running on http://localhost:${HTTP_PORT}`);
  console.log(`   Use this for React Native development`);
  console.log(`   Android Emulator: http://10.0.2.2:${HTTP_PORT}`);
  console.log(`   iOS Simulator: http://localhost:${HTTP_PORT}`);
  console.log(`   Physical Device: http://YOUR_IP:${HTTP_PORT}`);
});

// Start HTTPS server (for production/secure connections)
https.createServer(options, app).listen(HTTPS_PORT, () => {
  console.log(`🚀 HTTPS Server running on https://localhost:${HTTPS_PORT}`);
});
// # STRIPE_SECRET_KEY=sk_test_51Pq7yPGQiFmzJ0mzDU9xRfRyqy2IHlXX1Kkk1KCe8OAYmRRufJxxFfRPxvMpjc1pDo20lLe5C5m28aZbPCqVeLrC00VnKq0NdG
