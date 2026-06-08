const mongoose = require('mongoose');
const PaymentLink = require('../models/PaymentLink');

async function getSummary(userId, query = {}) {
  const { dateFrom, dateTo, gateway } = query;
  const match = { userId: new mongoose.Types.ObjectId(userId) };

  if (gateway && gateway !== 'all') {
    match.gateway = gateway.toLowerCase();
  }

  if (dateFrom || dateTo) {
    match.createdAt = {};
    if (dateFrom) match.createdAt.$gte = new Date(dateFrom);
    if (dateTo) match.createdAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
  }

  // Aggregate metrics
  const [metrics, gatewayBreakdown, recentLinks, timeSeries, revenueByCurrency] = await Promise.all([
    // Overall stats
    PaymentLink.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalLinks: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0]
            }
          },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          expiredCount: {
            $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
          },
          failedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      }
    ]),

    // Gateway breakdown
    PaymentLink.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$gateway',
          totalCount: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          paidAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] }
          }
        }
      },
      { $sort: { totalCount: -1 } }
    ]),

    // Recent 5 links
    PaymentLink.find(match)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id title amount currency gateway status customer createdAt'),

    // Time-series volume (last 7-14 days or filtered period)
    PaymentLink.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] }
          }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]),

    // Multi-currency revenue grouping to prevent corrupted multi-currency sums
    PaymentLink.aggregate([
      { $match: { ...match, status: 'paid' } },
      {
        $group: {
          _id: '$currency',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ])
  ]);

  const stats = metrics[0] || {
    totalLinks: 0,
    totalRevenue: 0,
    paidCount: 0,
    pendingCount: 0,
    cancelledCount: 0,
    expiredCount: 0,
    failedCount: 0
  };

  const formattedRevenueByCurrency = revenueByCurrency.map(c => ({
    currency: c._id,
    totalAmount: parseFloat(c.totalAmount.toFixed(2)),
    count: c.count
  }));

  const conversionRate = stats.totalLinks > 0
    ? parseFloat(((stats.paidCount / stats.totalLinks) * 100).toFixed(1))
    : 0;

  return {
    overview: {
      ...stats,
      totalRevenue: parseFloat(stats.totalRevenue.toFixed(2)),
      revenueByCurrency: formattedRevenueByCurrency,
      conversionRate
    },
    gatewayBreakdown: gatewayBreakdown.map(g => ({
      gateway: g._id,
      totalCount: g.totalCount,
      totalAmount: parseFloat(g.totalAmount.toFixed(2)),
      paidCount: g.paidCount,
      paidAmount: parseFloat(g.paidAmount.toFixed(2)),
      conversionRate: g.totalCount > 0 ? parseFloat(((g.paidCount / g.totalCount) * 100).toFixed(1)) : 0
    })),
    recentLinks,
    timeSeries: timeSeries.map(t => ({
      date: t._id,
      count: t.count,
      revenue: parseFloat(t.revenue.toFixed(2))
    }))
  };
}

module.exports = {
  getSummary
};
