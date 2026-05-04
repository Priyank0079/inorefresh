import { Request, Response } from "express";
import PortRequirement from "../../../models/PortRequirement";
import { asyncHandler } from "../../../utils/asyncHandler";

/**
 * Get all requirements for port users
 */
export const getRequirements = asyncHandler(async (req: Request, res: Response) => {
  const { search, status, page = 1, limit = 10 } = req.query;

  const query: any = {};

  if (status && status !== 'All') {
    if (Array.isArray(status)) {
      query.status = { $in: status };
    } else {
      query.status = status;
    }
  }

  if (search) {
    query.$or = [
      { fishName: { $regex: search, $options: 'i' } },
      { requirementId: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const requirements = await PortRequirement.find(query)
    .populate('warehouseId', 'name location city state')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await PortRequirement.countDocuments(query);

  return res.status(200).json({
    success: true,
    data: requirements,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * Update requirement status (e.g., when an offer is made)
 */
export const updateRequirementStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const requirement = await PortRequirement.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  if (!requirement) {
    return res.status(404).json({
      success: false,
      message: "Requirement not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Requirement status updated successfully",
    data: requirement,
  });
});
