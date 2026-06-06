const mongoose = require('mongoose');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const User = require('../models/User');
const PaymentLink = require('../models/PaymentLink');
const PaymentTransaction = require('../models/PaymentTransaction');
const AuditLog = require('../models/AuditLog');
const config = require('../config/env');
const logger = require('../utils/logger');
const { toMinorUnits } = require('../utils/currency');

async function seed() {
  await connectDatabase();
  logger.info('Seeding database with demo merchant and initial links...');

  // 1. Create or update demo merchant
  const demoEmail = 'merchant@paylink.dev';
  let user = await User.findOne({ email: demoEmail });
  if (!user) {
    user = new User({
      name: 'Alex Rivera',
      email: demoEmail,
      passwordHash: 'Password123!', // will be hashed by pre-save
      role: 'merchant'
    });
    await user.save();
    logger.info(`Created demo user: ${demoEmail} / Password123!`);
  }

  // Clear existing links for demo user to ensure clean state
  await PaymentLink.deleteMany({ userId: user._id });
  await PaymentTransaction.deleteMany({ userId: user._id });
  await AuditLog.deleteMany({ userId: user._id });

  const sampleLinks = [
    {
      title: 'SaaS Pro Annual Subscription',
      amount: 199.00,
      currency: 'USD',
      gateway: 'stripe',
      status: 'paid',
      customer: { name: 'Sarah Connor', email: 'sarah@cyberdyne.io', phone: '+14155552671' },
      isDemo: true,
      paidAt: new Date(Date.now() - 3600000 * 4)
    },
    {
      title: 'Frontend Architecture Consultation',
      amount: 4500.00,
      currency: 'INR',
      gateway: 'razorpay',
      status: 'paid',
      customer: { name: 'Rajesh Kumar', email: 'rajesh@techcorp.in', phone: '+919876543210' },
      isDemo: true,
      paidAt: new Date(Date.now() - 3600000 * 18)
    },
    {
      title: 'Cloud DevOps Workshop Ticket',
      amount: 1499.00,
      currency: 'INR',
      gateway: 'cashfree',
      status: 'pending',
      customer: { name: 'Ananya Sharma', email: 'ananya@startup.in', phone: '+919123456789' },
      isDemo: true
    },
    {
      title: 'Design System Masterclass',
      amount: 49.00,
      currency: 'USD',
      gateway: 'stripe',
      status: 'pending',
      customer: { name: 'David Miller', email: 'david@agency.design' },
      isDemo: true
    },
    {
      title: 'Quarterly API Retainer (Q4)',
      amount: 25000.00,
      currency: 'INR',
      gateway: 'razorpay',
      status: 'cancelled',
      customer: { name: 'Vikram Malhotra', email: 'vikram@fintech.co' },
      isDemo: true
    }
  ];

  for (const item of sampleLinks) {
    const linkId = new mongoose.Types.ObjectId();
    const amountMinor = toMinorUnits(item.amount, item.currency);
    const gatewayLinkId = `demo_pl_${linkId.toString().slice(-8)}`;

    const link = await PaymentLink.create({
      _id: linkId,
      userId: user._id,
      title: item.title,
      amount: item.amount,
      amountMinor,
      currency: item.currency,
      gateway: item.gateway,
      gatewayLinkId,
      gatewayPaymentUrl: `${config.clientUrl}/pay/preview/${linkId}`,
      shortUrl: `${config.clientUrl}/pay/preview/${linkId}`,
      status: item.status,
      gatewayRawStatus: item.status,
      customer: item.customer,
      paidAt: item.paidAt,
      isDemo: true,
      paymentDetails: item.status === 'paid' ? {
        paymentId: `demo_pay_${Date.now().toString(36)}`,
        method: item.gateway === 'stripe' ? 'card' : 'upi',
        paidAt: item.paidAt
      } : undefined
    });

    if (item.status === 'paid') {
      await PaymentTransaction.create({
        paymentLinkId: link._id,
        userId: user._id,
        gateway: item.gateway,
        gatewayPaymentId: `demo_pay_${Date.now().toString(36)}`,
        amount: item.amount,
        amountMinor,
        currency: item.currency,
        status: 'captured',
        paymentMethod: item.gateway === 'stripe' ? 'card' : 'upi',
        rawGatewayResponse: { simulated: true }
      });
    }

    await AuditLog.create({
      userId: user._id,
      paymentLinkId: link._id,
      action: item.status === 'paid' ? 'PAYMENT_CAPTURED' : 'LINK_CREATED',
      gateway: item.gateway,
      details: { amount: item.amount, currency: item.currency }
    });
  }

  logger.info('Database seeded successfully with sample records.');
  await disconnectDatabase();
}

if (require.main === module) {
  seed().catch(err => {
    logger.error('Seed error', err);
    process.exit(1);
  });
}

module.exports = seed;
