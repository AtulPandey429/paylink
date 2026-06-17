const mongoose = require('mongoose');
const PaymentLink = require('../models/PaymentLink');
const PaymentTransaction = require('../models/PaymentTransaction');
const WebhookEvent = require('../models/WebhookEvent');
const AuditLog = require('../models/AuditLog');
const providerFactory = require('../providers');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

async function handleWebhook(gateway, headers, rawBody) {
  const { provider } = providerFactory.getProvider(gateway, true);

  // 1. Verify cryptographic signature
  const verification = await provider.verifyWebhook(headers, rawBody);
  if (!verification.isValid) {
    logger.warn(`Rejected invalid webhook signature for gateway ${gateway}`, {
      error: verification.error
    });
    throw new AppError(`Invalid webhook signature: ${verification.error}`, 400);
  }

  const { eventId, eventType, paymentLinkId, gatewayLinkId, status, amount, currency, paymentId, rawPayload } = verification;
  const idempotencyKey = `${gateway}_${eventId}`;

  // 2. Atomic Insert-First Idempotency Lock (TOCTOU guard)
  let webhookRecord;
  try {
    webhookRecord = await WebhookEvent.create({
      gateway,
      eventId,
      idempotencyKey,
      eventType,
      payload: rawPayload,
      processed: false
    });
  } catch (err) {
    if (err.code === 11000 || (err.name === 'MongoServerError' && err.code === 11000)) {
      logger.info(`Webhook event ${idempotencyKey} already recorded or being processed concurrently. Idempotent return.`);
      return {
        success: true,
        alreadyProcessed: true,
        message: 'Event already processed'
      };
    }
    throw err;
  }

  try {
    // 3. Locate matching payment link safely without CastError
    let link = null;
    if (paymentLinkId && mongoose.Types.ObjectId.isValid(paymentLinkId)) {
      link = await PaymentLink.findById(paymentLinkId);
    }
    if (!link && gatewayLinkId) {
      link = await PaymentLink.findOne({ gatewayLinkId });
    }
    // Also try extracting Mongo ObjectId from plink_<mongoId>_<suffix> format
    if (!link && gatewayLinkId && gatewayLinkId.startsWith('plink_')) {
      const parts = gatewayLinkId.split('_');
      if (parts[1] && mongoose.Types.ObjectId.isValid(parts[1])) {
        link = await PaymentLink.findById(parts[1]);
      }
    }
    // Fallback: search by gateway payment URL or paymentDetails
    if (!link && gatewayLinkId) {
      link = await PaymentLink.findOne({
        $or: [
          { 'paymentDetails.paymentId': gatewayLinkId },
          { gatewayPaymentUrl: { $regex: gatewayLinkId, $options: 'i' } }
        ]
      });
    }

    if (!link) {
      logger.warn(`Webhook received for unknown payment link ID: ${paymentLinkId || gatewayLinkId}`);
      webhookRecord.processed = true;
      webhookRecord.processedAt = new Date();
      webhookRecord.error = 'No matching PaymentLink found in database';
      await webhookRecord.save();
      return {
        success: true,
        message: 'Webhook acknowledged but link not found'
      };
    }

    // 4. State transition guard
    // Terminal state 'paid' cannot be downgraded
    if (link.status === 'paid' && status !== 'paid') {
      logger.info(`Link ${link._id} is already paid. Ignoring out-of-order ${status} event.`);
      webhookRecord.processed = true;
      webhookRecord.processedAt = new Date();
      await webhookRecord.save();
      return { success: true, message: 'Terminal state preserved' };
    }

    const previousStatus = link.status;
    link.status = status;
    link.gatewayRawStatus = eventType;

    if (status === 'paid') {
      link.paidAt = new Date();
      link.paymentDetails = {
        paymentId: paymentId || link.gatewayLinkId,
        method: rawPayload?.method || 'online',
        paidAt: link.paidAt
      };

      // Record transaction with idempotent upsert to prevent duplicates
      await PaymentTransaction.findOneAndUpdate(
        {
          gateway: link.gateway,
          gatewayPaymentId: paymentId || link.gatewayLinkId
        },
        {
          $setOnInsert: {
            paymentLinkId: link._id,
            userId: link.userId,
            gateway: link.gateway,
            gatewayPaymentId: paymentId || link.gatewayLinkId,
            amount: link.amount,
            amountMinor: link.amountMinor,
            currency: link.currency,
            status: 'captured',
            rawGatewayResponse: rawPayload
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    await link.save();

    // Create Audit Log
    await AuditLog.create({
      userId: link.userId,
      paymentLinkId: link._id,
      action: status === 'paid' ? 'PAYMENT_CAPTURED' : 'WEBHOOK_RECEIVED',
      gateway,
      details: {
        eventType,
        previousStatus,
        newStatus: status,
        paymentId
      }
    });

    webhookRecord.processed = true;
    webhookRecord.processedAt = new Date();
    await webhookRecord.save();

    logger.info(`Successfully processed webhook ${idempotencyKey} for link ${link._id}. Status: ${status}`);

    return {
      success: true,
      linkId: link._id,
      status: link.status
    };
  } catch (err) {
    webhookRecord.error = err.message;
    await webhookRecord.save();
    logger.error('Error processing webhook event in database', err, { idempotencyKey });
    throw err;
  }
}

module.exports = {
  handleWebhook
};
