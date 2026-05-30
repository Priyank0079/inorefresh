import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { PortRequirement, PortOffer } from '../../../models';
import { asyncHandler } from '../../../utils/asyncHandler';

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const portId = (req as any).user?.userId || (req as any).user?.id || (req as any).user?._id;

  const totalRequirements = await PortRequirement.countDocuments({ status: 'Open' });
  const activeOffers = await PortOffer.countDocuments({ portId, status: { $in: ['pending', 'countered', 'negotiating'] } });
  const approvedOffers = await PortOffer.countDocuments({ portId, status: 'approved' });

  // Calculate total revenue from approved offers
  const revenueStats = await PortOffer.aggregate([
    { $match: { portId: new mongoose.Types.ObjectId(portId), status: 'approved' } },
    { $group: { _id: null, total: { $sum: { $multiply: ["$offeredPrice", "$quantityOffered"] } } } }
  ]);

  const totalRevenue = revenueStats.length > 0 ? revenueStats[0].total : 0;

  // Generate chart data (last 6 months)
  const chartData = await PortOffer.aggregate([
    {
      $match: {
        portId: new mongoose.Types.ObjectId(portId),
        status: 'approved',
        updatedAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
      }
    },
    {
      $group: {
        _id: { month: { $month: "$updatedAt" }, year: { $year: "$updatedAt" } },
        revenue: { $sum: { $multiply: ["$offeredPrice", "$quantityOffered"] } }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formattedChartData = chartData.map(item => ({
    name: monthNames[item._id.month - 1],
    revenue: item.revenue
  }));

  res.status(200).json({
    success: true,
    data: {
      totalRequirements,
      activeOffers,
      approvedOffers,
      pendingOrders: activeOffers,
      completedOrders: approvedOffers,
      totalRevenue,
      chartData: formattedChartData.length > 0 ? formattedChartData : [
        { name: 'Jan', revenue: 0 },
        { name: 'Feb', revenue: 0 },
        { name: 'Mar', revenue: 0 },
        { name: 'Apr', revenue: 0 }
      ]
    }
  });
});

export const getRecentActivities = asyncHandler(async (req: Request, res: Response) => {
  // Simple recently updated offers as activity
  const portId = (req as any).user?.userId || (req as any).user?.id || (req as any).user?._id;

  const activities = await PortOffer.find({ portId })
    .sort({ updatedAt: -1 })
    .limit(5)
    .populate('requirementId', 'fishName');

  const mappedActivities = activities.map(act => ({
    title: act.status.charAt(0).toUpperCase() + act.status.slice(1),
    desc: `Offer for ${act.requirementId ? (act.requirementId as any).fishName : 'Requirement'} status changed to ${act.status}`,
    time: act.updatedAt,
    icon: act.status === 'approved' ? 'check_circle' : 'history',
    bgColor: 'bg-slate-50',
    iconColor: act.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
  }));

  res.status(200).json({
    success: true,
    data: mappedActivities
  });
});

export const getRecentRequirements = asyncHandler(async (req: Request, res: Response) => {
  const portId = (req as any).user?.userId || (req as any).user?.id || (req as any).user?._id;

  const requirements = await PortRequirement.find({ status: 'Open' })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('warehouseId', 'name');

  res.status(200).json({
    success: true,
    data: requirements
  });
});

export const getRecentOffers = asyncHandler(async (req: Request, res: Response) => {
  const portId = (req as any).user?.userId || (req as any).user?.id || (req as any).user?._id;

  const offers = await PortOffer.find({ portId })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('requirementId', 'fishName');

  res.status(200).json({
    success: true,
    data: offers
  });
});

export const getCompleteDashboard = asyncHandler(async (req: Request, res: Response) => {
  const portId = (req as any).user?.userId || (req as any).user?.id || (req as any).user?._id;

  const [stats, activities, requirements] = await Promise.all([
    // Get stats
    (async () => {
      const [totalReqs, activeOffs, approvedOffs, revenueStats] = await Promise.all([
        PortRequirement.countDocuments({ status: 'Open' }),
        PortOffer.countDocuments({ portId, status: { $in: ['pending', 'countered', 'negotiating'] } }),
        PortOffer.countDocuments({ portId, status: 'approved' }),
        PortOffer.aggregate([
          { $match: { portId: new mongoose.Types.ObjectId(portId), status: 'approved' } },
          { $group: { _id: null, total: { $sum: { $multiply: ["$offeredPrice", "$quantityOffered"] } } } }
        ])
      ]);

      return {
        totalRequirements: totalReqs,
        activeOffers: activeOffs,
        approvedOffers: approvedOffs,
        totalRevenue: revenueStats.length > 0 ? revenueStats[0].total : 0,
        chartData: []
      };
    })(),

    // Get activities
    PortOffer.find({ portId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('requirementId', 'fishName'),

    // Get requirements
    PortRequirement.find({ status: 'Open' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('warehouseId', 'name')
  ]);

  const mappedActivities = activities.map(act => ({
    title: act.status.charAt(0).toUpperCase() + act.status.slice(1),
    desc: `Offer for ${act.requirementId ? (act.requirementId as any).fishName : 'Requirement'} - ${act.status}`,
    time: act.updatedAt,
    icon: act.status === 'approved' ? 'check_circle' : 'history',
    bgColor: 'bg-slate-50',
    iconColor: act.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
  }));

  res.status(200).json({
    success: true,
    data: { stats, activities: mappedActivities, requirements }
  });
});
