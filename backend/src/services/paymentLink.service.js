const mongoose = require('mongoose');
const PaymentLink = require('../models/PaymentLink');
const PaymentTransaction = require('../models/PaymentTransaction');
const AuditLog = require('../models/AuditLog');
const providerFactory = require('../providers');
const { toMinorUnits } = require('../utils/currency');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

async function createLink(userId, data) {
  const { title, amount, currency, gateway, customer, expiresAt, metadata } = data;
  const amountMinor = toMinorUnits(amount, currency);

  // 1. Resolve provider (or demo fallback)
  const { provider, isDemo, fallbackFrom } = providerFactory.getProvider(gateway, true);

  // 2. Create pending link model record in database
  const linkId = new mongoose.Types.ObjectId();
  const paymentLink = new PaymentLink({
    _id: linkId,
    userId,
    title,
    amount,
    amountMinor,
    currency,
    gateway: isDemo ? (fallbackFrom || 'demo') : gateway,
    isDemo,
    gatewayLinkId: `pending_${linkId}`,
    gatewayPaymentUrl: 'pending',
    status: 'pending',
    customer: customer || {},
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    metadata: metadata || {}
  });

  // 3. Delegate link generation to payment provider
  try {
    const providerResult = await provider.createPaymentLink({
      linkId,
      title,
      amount,
      amountMinor,
      currency,
      customer,
      expiresAt
    });

    paymentLink.gatewayLinkId = providerResult.gatewayLinkId;
    paymentLink.gatewayPaymentUrl = providerResult.gatewayPaymentUrl;
    paymentLink.shortUrl = providerResult.shortUrl;
    paymentLink.gatewayRawStatus = providerResult.rawStatus;

    await paymentLink.save();

    // 4. Record audit log
    await AuditLog.create({
      userId,
      paymentLinkId: linkId,
      action: 'LINK_CREATED',
      gateway: paymentLink.gateway,
      details: {
        amount,
        currency,
        isDemo,
        gatewayLinkId: paymentLink.gatewayLinkId,
        url: paymentLink.gatewayPaymentUrl
      }
    });

    return paymentLink;
  } catch (error) {
    logger.error('Failed to create payment link on provider', error, { linkId });
    throw error;
  }
}

async function listLinks(userId, query = {}) {
  const {
    page = 1,
    limit = 10,
    search = '',
    gateway = '',
    status = '',
    dateFrom = '',
    dateTo = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = query;

  const filter = { userId };

  // Search filter (title, customer name, email, or gatewayLinkId)
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { title: searchRegex },
      { 'customer.name': searchRegex },
      { 'customer.email': searchRegex },
      { gatewayLinkId: searchRegex }
    ];
  }

  // Gateway filter
  if (gateway && gateway.trim() !== 'all') {
    filter.gateway = gateway.toLowerCase().trim();
  }

  // Status filter
  if (status && status.trim() !== 'all') {
    filter.status = status.toLowerCase().trim();
  }

  // Date range filter
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const sortDirection = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortDirection };

  const [links, total] = await Promise.all([
    PaymentLink.find(filter).sort(sort).skip(skip).limit(limitNum),
    PaymentLink.countDocuments(filter)
  ]);

  return {
    links,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1
  };
}

async function getLinkById(userId, linkId) {
  if (!mongoose.Types.ObjectId.isValid(linkId)) {
    throw new AppError('Invalid payment link ID format.', 400);
  }

  // Strict tenant isolation / IDOR prevention
  const link = await PaymentLink.findOne({ _id: linkId, userId });
  if (!link) {
    throw new AppError('Payment link not found or access denied.', 404);
  }

  return link;
}

async function getPublicLink(linkId) {
  if (!mongoose.Types.ObjectId.isValid(linkId)) {
    throw new AppError('Invalid payment link ID format.', 400);
  }

  const link = await PaymentLink.findById(linkId).select(
    '_id title amount amountMinor currency gateway status customer expiresAt isDemo createdAt'
  );

  if (!link) {
    throw new AppError('Payment link not found.', 404);
  }

  return link;
}

async function syncLinkStatus(userId, linkId) {
  const link = await getLinkById(userId, linkId);

  // If already in a terminal state (paid), avoid unnecessary gateway mutations
  if (link.status === 'paid') {
    return link;
  }

  const providerKey = link.isDemo ? 'demo' : link.gateway;
  const { provider } = providerFactory.getProvider(providerKey, true);

  try {
    const statusResult = await provider.getPaymentStatus(link.gatewayLinkId);

    if (statusResult.status && statusResult.status !== link.status) {
      const oldStatus = link.status;
      link.status = statusResult.status;
      link.gatewayRawStatus = statusResult.rawStatus || link.gatewayRawStatus;

      if (statusResult.status === 'paid') {
        link.paidAt = statusResult.paidAt || new Date();
        link.paymentDetails = {
          paymentId: statusResult.paymentId,
          method: statusResult.method,
          gatewayFee: statusResult.gatewayFee
        };

        // Create transaction record
        await PaymentTransaction.create({
          paymentLinkId: link._id,
          userId: link.userId,
          gateway: link.gateway,
          gatewayPaymentId: statusResult.paymentId || link.gatewayLinkId,
          amount: link.amount,
          amountMinor: link.amountMinor,
          currency: link.currency,
          status: 'captured',
          paymentMethod: statusResult.method,
          rawGatewayResponse: statusResult.rawResponse
        });
      }

      await link.save();

      await AuditLog.create({
        userId,
        paymentLinkId: link._id,
        action: 'STATUS_SYNCED',
        gateway: link.gateway,
        details: {
          previousStatus: oldStatus,
          newStatus: link.status,
          paymentId: statusResult.paymentId
        }
      });
    }

    return link;
  } catch (error) {
    logger.error('Sync payment link status error', error, { linkId });
    throw error;
  }
}

async function cancelLink(userId, linkId) {
  const link = await getLinkById(userId, linkId);

  if (link.status === 'paid') {
    throw new AppError('Cannot cancel a payment link that has already been paid.', 400);
  }

  if (link.status === 'cancelled') {
    return link; // Already cancelled
  }

  const providerKey = link.isDemo ? 'demo' : link.gateway;
  const { provider } = providerFactory.getProvider(providerKey, true);

  try {
    await provider.cancelPaymentLink(link.gatewayLinkId);

    link.status = 'cancelled';
    link.gatewayRawStatus = 'cancelled';
    await link.save();

    await AuditLog.create({
      userId,
      paymentLinkId: link._id,
      action: 'LINK_CANCELLED',
      gateway: link.gateway,
      details: {
        cancelledAt: new Date().toISOString()
      }
    });

    return link;
  } catch (error) {
    logger.error('Failed to cancel payment link on gateway', error, { linkId });
    throw error;
  }
}

async function getLinkEvents(userId, linkId) {
  const link = await getLinkById(userId, linkId);

  const [auditLogs, transactions] = await Promise.all([
    AuditLog.find({ paymentLinkId: link._id }).sort({ createdAt: -1 }),
    PaymentTransaction.find({ paymentLinkId: link._id }).sort({ createdAt: -1 })
  ]);

  return {
    link,
    auditLogs,
    transactions
  };
}

/**
 * Public action for simulating payment actions on Demo / Preview links.
 */
async function simulatePayment(linkId, action) {
  const link = await getPublicLink(linkId);

  if (link.status === 'paid') {
    throw new AppError('This link has already been paid.', 400);
  }

  const { DemoProvider } = providerFactory;
  const webhookService = require('./webhook.service');
  const demoProvider = new DemoProvider();
  const isSuccess = action !== 'fail';

  const simulatedPayload = {
    eventId: `sim_evt_${Date.now()}`,
    eventType: isSuccess ? 'payment.simulated_success' : 'payment.simulated_failure',
    paymentLinkId: link._id.toString(),
    gatewayLinkId: link.gatewayLinkId,
    status: isSuccess ? 'paid' : 'failed',
    amount: link.amount,
    currency: link.currency,
    paymentId: `sim_pay_${Date.now()}`
  };

  const signature = demoProvider.signPayload(simulatedPayload);

  // Feed through webhook engine with HMAC signature verification
  const webhookResult = await webhookService.handleWebhook(
    'demo',
    { 'x-demo-signature': signature },
    Buffer.from(JSON.stringify(simulatedPayload))
  );

  return {
    isSuccess,
    webhookResult
  };
}

module.exports = {
  createLink,
  listLinks,
  getLinkById,
  getPublicLink,
  syncLinkStatus,
  cancelLink,
  getLinkEvents,
  simulatePayment
};
