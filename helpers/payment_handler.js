
const paytabs = require('paytabs_pt2');
require('dotenv').config();
const User = require('../models/User');

// من الأفضل وضع البيانات الحقيقية في ملف env. إذا لم توجد، سيتم استخدام القيم الافتراضية هنا فقط للتجربة.
const profileID = process.env.PAYTABS_PROFILE_ID || '148198';
const serverKey = process.env.PAYTABS_SERVER_KEY || 'SKJ9TBKRMW-JMDJZ2LHHT-N9MRZNRBBB';
const region = process.env.PAYTABS_REGION || 'EGY'; // مثال: EGY, ARE, SAU ...

paytabs.setConfig(profileID, serverKey, region);

// هذه الدالة تنشئ صفحة دفع لاشتراك Premium
// استدعها من المسار POST /api/premium/checkout
const createPremiumSubscriptionPayment = (req, res) => {
  try {
    console.log('createPremiumSubscriptionPayment called with body:', req.body);
    const {
      userId,
      name,
      paymentMethods,
    //   email,
    //   phone,
      amount,
      currency,
      returnUrl,
      callbackUrl,
      
    } = req.body;

    // المبلغ والعملة الافتراضية (يمكنك تعديلها كما تريد)
    const cartAmount = amount || 100; // مثال: 100
    // تأكد أن العملة كود من 3 أحرف مثل SAR أو EGP، وإلا استخدم SAR
    const cartCurrency =
      typeof currency === 'string' && currency.trim().length === 3
        ? currency.trim().toUpperCase()
        : 'SAR';

    // رقم العربة/الطلب (ضع هنا ID من قاعدة البيانات أو أي رقم فريد)
    const cartId = `premium-${userId || Date.now()}`;

    const paymentData = {
      profile_id: profileID,
      tran_type: 'sale',
      tran_class: 'ecom',
      cart_id: cartId,
      cart_currency: cartCurrency,
      cart_amount: cartAmount,
      cart_description: 'Premium Account Subscription',
      payment_methods: Array.isArray(paymentMethods) && paymentMethods.length > 0 ? paymentMethods : undefined,
      customer_details: {
        name: name || 'Premium User',
        // email: email || 'no-email@example.com',
        // phone: phone || '0000000000',
        // street1: 'N/A',
        // city: 'N/A',
        // state: 'N/A',
        // country: 'SA',
        // zip: '00000',
      },
      shipping_details: {
        name: name || 'Premium User',
        // email: email || 'no-email@example.com',
        // phone: phone || '0000000000',
        // street1: 'N/A',
        // city: 'N/A',
        // state: 'N/A',
        // country: 'SA',
        // zip: '00000',
      },
      callback: callbackUrl || `${req.protocol}://${req.get('host')}/api/premium/paytabs/callback`,
      return: returnUrl || `${req.protocol}://${req.get('host')}/premium-success`
      ,
    };

    console.log('PayTabs paymentData:', paymentData);

    // Basic validation to avoid passing malformed data to the SDK
    const missing = [];
    if (!paymentData.profile_id) missing.push('profile_id');
    if (!paymentData.cart_id) missing.push('cart_id');
    if (!paymentData.cart_currency) missing.push('cart_currency');
    if (!paymentData.cart_amount && paymentData.cart_amount !== 0) missing.push('cart_amount');
    if (!paymentData.callback) missing.push('callback');
    if (!paymentData.return) missing.push('return');
    if (!paymentData.customer_details || !paymentData.customer_details.name) missing.push('customer_details.name');

    if (missing.length > 0) {
      console.error('PayTabs paymentData missing required fields:', missing);
      return res.status(400).json({ message: 'Invalid payment data', missing });
    }

    // ملاحظة: دالة createPaymentPage تأتي من مكتبة paytabs_pt2
    // بعض إصدارات قد تمرر (err, result) والبعض قد تمرر (result). ندعم الحالتين.
    try {
      // Map our paymentData object into the positional arrays expected by the paytabs_pt2 SDK
      // paytabs_pt2 expects payment_code to be an array of payment method strings
      const payment_code = Array.isArray(paymentData.payment_methods)
        ? paymentData.payment_methods
        : (paymentData.payment_methods ? [paymentData.payment_methods] : ['card','mada']);
      const transaction = [paymentData.tran_type || 'sale', paymentData.tran_class || 'ecom'];
      const cart = [paymentData.cart_id, paymentData.cart_currency, String(paymentData.cart_amount), paymentData.cart_description];
      const cust = paymentData.customer_details || {};
      const customer = [
        cust.name || '',
        cust.email || '',
        cust.phone || '',
        cust.street1 || '',
        cust.city || '',
        cust.state || '',
        cust.country || '',
        cust.zip || '',
        cust.ip || req.ip || ''
      ];
      const ship = paymentData.shipping_details || {};
      const shipping = [
        ship.name || '',
        ship.email || '',
        ship.phone || '',
        ship.street1 || '',
        ship.city || '',
        ship.state || '',
        ship.country || '',
        ship.zip || '',
        ship.ip || req.ip || ''
      ];
      const urls = [paymentData.callback, paymentData.return];

      paytabs.createPaymentPage(payment_code, transaction, cart, customer, shipping, urls, paymentData.paypage_lang, (result) => {
        // paytabs_pt2 calls callback with a single `result` argument
        if (!result) {
          console.error('PayTabs createPaymentPage returned empty result:', result);
          return res.status(500).json({ message: 'No response from PayTabs', paytabsResponse: result });
        }

        // Check if PayTabs returned an error
        if (result.error || result.message || result.error_code) {
          const errorMsg = result.message || result.error || result.error_message || 'PayTabs returned an error';
          console.error('PayTabs error in response:', result);
          return res.status(500).json({ 
            message: 'PayTabs payment error', 
            error: errorMsg,
            paytabsResponse: result 
          });
        }

        const redirectUrl = result.redirect_url || result.payment_url || result.url;
        if (!redirectUrl) {
          console.error('PayTabs createPaymentPage missing redirect URL, response:', JSON.stringify(result, null, 2));
          return res.status(500).json({ 
            message: 'Failed to create PayTabs payment page', 
            error: 'No redirect URL in PayTabs response',
            paytabsResponse: result 
          });
        }

        return res.json({ success: true, redirect_url: redirectUrl, paytabsResponse: result });
      });
    } catch (callErr) {
      console.error('Exception calling paytabs.createPaymentPage:', callErr);
      if (callErr && callErr.stack) console.error(callErr.stack);
      const payload = { message: 'Exception calling PayTabs SDK', error: callErr.message };
      if (callErr && callErr.stack) payload.stack = callErr.stack;
      return res.status(500).json(payload);
    }
  } catch (err) {
    console.error('PayTabs error:', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// هذا هو مسار الـ callback من PayTabs بعد الدفع
// هنا يجب عليك التحقق من حالة العملية ثم ترقية المستخدم إلى Premium في قاعدة البيانات

const processPaymentAndUpdateUser = async (data) => {
  try {
    // Handle nested query parameters and different parameter names
    if (!data.cart_id && data.cartId) data.cart_id = data.cartId;
    if (!data.payment_result && data.paymentResult) data.payment_result = data.paymentResult;
    
    // Check payment status
    let paymentResult = data.payment_result || data.paymentResult;
    let status;
    
    if (paymentResult) {
      if (typeof paymentResult === 'string') {
        status = paymentResult;
      } else if (typeof paymentResult === 'object') {
        if (typeof paymentResult.response_status === 'string') {
          status = paymentResult.response_status;
        } else if (Array.isArray(paymentResult.response_status) && paymentResult.response_status.length > 0) {
          status = paymentResult.response_status[0];
        }
      } else if (Array.isArray(paymentResult) && paymentResult.length > 0) {
        status = paymentResult[0];
      }
    }
    
    if (!status) {
      status = data.response_status || data.respStatus || data.status;
    }
    
    const isApproved = status === 'A' || status === 'S' || status === 'success' || 
                       status === 'Success' || status === true || status === 'true' ||
                       (typeof status === 'string' && status.toLowerCase() === 'approved');
    
    if (!isApproved) {
      return { success: false, message: 'Payment not approved', status };
    }

    // Extract userId from cart_id
    const cartId = data.cart_id || data.cartId || data.cart_id_string || data.orderId;
    let userId = null;

    if (cartId) {
      const cartIdStr = String(cartId);
      if (cartIdStr.startsWith('premium-')) {
        userId = cartIdStr.replace('premium-', '');
      }
    }
    
    if (!userId && data.userId) {
      userId = data.userId;
    }

    if (!userId) {
      return { success: false, message: 'Cannot extract user id from cart_id', cartId };
    }
    
    const userIdInt = parseInt(userId, 10);
    if (isNaN(userIdInt)) {
      return { success: false, message: `Invalid userId: ${userId}` };
    }
    
    // Update user to Prime
    const updateResult = await User.update(
      { isPrime: true },
      { where: { id: userIdInt } }
    );
    
    let updatedCount = 0;
    if (Array.isArray(updateResult)) {
      updatedCount = updateResult[0];
    } else if (typeof updateResult === 'number') {
      updatedCount = updateResult;
    } else if (updateResult && typeof updateResult === 'object' && updateResult.hasOwnProperty('affectedRows')) {
      updatedCount = updateResult.affectedRows;
    }

    if (!updatedCount || updatedCount === 0) {
      return { success: false, message: 'User not found to set isPrime', userId: userIdInt };
    }

    return { success: true, message: 'User upgraded to Prime successfully', userId: userIdInt };
  } catch (err) {
    console.error('processPaymentAndUpdateUser error:', err);
    return { success: false, message: 'Error processing payment', error: err.message };
  }
};





const handlePaytabsCallback = async (req, res) => {
  console.log('PayTabs callback/return URL received');
  
  try {
    // PayTabs may send data via:
    // 1. POST body (server-to-server callback webhook)
    // 2. GET query parameters (user return URL redirect)
    // Check both locations
    const bodyData = req.body || {};
    const queryData = req.query || {};
    
    // Merge data, with body taking precedence
    const data = { ...queryData, ...bodyData };
    
    console.log('PayTabs callback data (body):', bodyData);
    console.log('PayTabs callback data (query):', queryData);
    console.log('PayTabs callback data (merged):', data);

    // Process payment and update user
    const result = await processPaymentAndUpdateUser(data);
    
    console.log('Payment processing result:', result);

    if (!result.success) {
      return res.status(400).json({
        received: true,
        ...result
      });
    }

    return res.json({
      received: true,
      ...result
    });
  } catch (err) {
    console.error('PayTabs callback error:', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

module.exports = {
  createPremiumSubscriptionPayment,
  handlePaytabsCallback,
  processPaymentAndUpdateUser,
};
      
