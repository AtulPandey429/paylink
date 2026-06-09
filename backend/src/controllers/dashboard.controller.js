const dashboardService = require('../services/dashboard.service');
const asyncHandler = require('../utils/asyncHandler');

const getSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getSummary(req.user._id, req.query);
  res.json({
    success: true,
    data: summary
  });
});

module.exports = {
  getSummary
};
