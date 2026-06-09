const paymentLinkService = require('../services/paymentLink.service');
const asyncHandler = require('../utils/asyncHandler');

const createLink = asyncHandler(async (req, res) => {
  const link = await paymentLinkService.createLink(req.user._id, req.body);
  res.status(201).json({
    success: true,
    message: 'Payment link created successfully',
    data: { link }
  });
});

const listLinks = asyncHandler(async (req, res) => {
  const result = await paymentLinkService.listLinks(req.user._id, req.query);
  res.json({
    success: true,
    data: result
  });
});

const getLinkById = asyncHandler(async (req, res) => {
  const link = await paymentLinkService.getLinkById(req.user._id, req.params.id);
  res.json({
    success: true,
    data: { link }
  });
});

const getPublicLink = asyncHandler(async (req, res) => {
  const link = await paymentLinkService.getPublicLink(req.params.id);
  res.json({
    success: true,
    data: { link }
  });
});

const syncLinkStatus = asyncHandler(async (req, res) => {
  const link = await paymentLinkService.syncLinkStatus(req.user._id, req.params.id);
  res.json({
    success: true,
    message: `Status synced. Current status: ${link.status}`,
    data: { link }
  });
});

const cancelLink = asyncHandler(async (req, res) => {
  const link = await paymentLinkService.cancelLink(req.user._id, req.params.id);
  res.json({
    success: true,
    message: 'Payment link cancelled successfully',
    data: { link }
  });
});

const getLinkEvents = asyncHandler(async (req, res) => {
  const events = await paymentLinkService.getLinkEvents(req.user._id, req.params.id);
  res.json({
    success: true,
    data: events
  });
});

const simulateDemoPayment = asyncHandler(async (req, res) => {
  const { isSuccess, webhookResult } = await paymentLinkService.simulatePayment(req.params.id, req.body.action);
  res.json({
    success: true,
    message: isSuccess ? 'Simulated payment succeeded!' : 'Simulated payment failed as requested',
    data: webhookResult
  });
});

module.exports = {
  createLink,
  listLinks,
  getLinkById,
  getPublicLink,
  syncLinkStatus,
  cancelLink,
  getLinkEvents,
  simulateDemoPayment
};
