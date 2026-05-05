import { Request, Response } from "express";
import PortOffer from "../../../models/PortOffer";
import PortRequirement from "../../../models/PortRequirement";
import InwardStock from "../../../models/InwardStock";
import PortUser from "../../../models/PortUser";
import { asyncHandler } from "../../../utils/asyncHandler";
import mongoose from "mongoose";

/**
 * Get all negotiations for the logged-in port user
 */
export const getMyNegotiations = asyncHandler(async (req: Request, res: Response) => {
  const portId = (req as any).user.userId || (req as any).user.id || (req as any).user._id;

  const negotiations = await PortOffer.find({ 
    portId,
    status: { $in: ['pending', 'countered', 'negotiating'] }
  })
    .populate('requirementId')
    .populate('warehouseId', 'name location city state')
    .sort({ updatedAt: -1 });

  return res.status(200).json({
    success: true,
    data: negotiations,
  });
});

/**
 * Get all confirmed orders (approved offers) for the logged-in port user
 */
export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const portId = (req as any).user.userId || (req as any).user.id || (req as any).user._id;

  const orders = await PortOffer.find({ 
    portId,
    status: 'approved'
  })
    .populate('requirementId')
    .populate('warehouseId', 'name location city state')
    .sort({ updatedAt: -1 });

  return res.status(200).json({
    success: true,
    data: orders,
  });
});

/**
 * Get a single offer/order by ID
 */
export const getOfferById = asyncHandler(async (req: Request, res: Response) => {
  const { offerId } = req.params;
  const portId = (req as any).user.userId || (req as any).user.id || (req as any).user._id;

  const offer = await PortOffer.findOne({ _id: offerId, portId })
    .populate('requirementId')
    .populate('warehouseId', 'name location city state managerName mobile address');

  if (!offer) {
    return res.status(404).json({ success: false, message: "Offer not found" });
  }

  return res.status(200).json({
    success: true,
    data: offer,
  });
});

/**
 * Create a new offer for a requirement
 */
export const createOffer = asyncHandler(async (req: Request, res: Response) => {
  // DEBUG: Inspect the user object
  console.log("DEBUG: createOffer req.user:", JSON.stringify(req.user, null, 2));
  console.log("DEBUG: createOffer req.body:", JSON.stringify(req.body, null, 2));

  const portId = (req as any).user?.userId || (req as any).user?.id || (req as any).user?._id || req.body.portId;
  const { requirementId, offeredPrice, quantityOffered, deliveryDate, notes } = req.body;

  if (!portId) {
    return res.status(400).json({
      success: false,
      message: "Port ID could not be identified from your session. Please re-login.",
      debug_user: req.user
    });
  }

  const requirement = await PortRequirement.findById(requirementId);
  if (!requirement) {
    return res.status(404).json({ success: false, message: "Requirement not found" });
  }

  let offer;
  try {
    offer = await PortOffer.create({
      requirementId,
      portId: portId ? new mongoose.Types.ObjectId(portId) : undefined,
      warehouseId: requirement.warehouseId,
      offeredPrice,
      quantityOffered,
      deliveryDate: new Date(deliveryDate), // Ensure Date object
      notes,
      status: 'pending',
      negotiationHistory: [{
        price: offeredPrice,
        offeredBy: 'port',
        timestamp: new Date(),
        notes
      }]
    });
  } catch (err: any) {
    console.error("DEBUG: PortOffer.create failed:", err);
    return res.status(400).json({
      success: false,
      message: err.message || "Validation failed during offer creation",
      errors: err.errors
    });
  }

  // Update requirement status to Negotiating
  await PortRequirement.findByIdAndUpdate(requirementId, { status: 'Negotiating' });

  // Get Port user name for notification
  const portUser = await PortUser.findById(portId);

  // Notify Admin via Socket
  const io = req.app.get('io');
  if (io) {
    io.to('admin-notifications').emit('new-port-offer', {
      offerId: offer._id,
      requirementId: requirement.requirementId,
      fishName: requirement.fishName,
      offeredPrice: offer.offeredPrice,
      quantityOffered: offer.quantityOffered,
      portName: portUser?.name || portUser?.portName || 'A Port User',
      timestamp: new Date()
    });
  }

  return res.status(201).json({
    success: true,
    message: "Offer submitted successfully",
    data: offer,
  });
});

/**
 * Accept a counter offer from the warehouse
 */
export const acceptCounter = asyncHandler(async (req: Request, res: Response) => {
  const { offerId } = req.params;
  const portId = (req as any).user.userId || (req as any).user.id || (req as any).user._id;

  const offer = await PortOffer.findOne({ _id: offerId, portId });
  if (!offer) {
    return res.status(404).json({ success: false, message: "Offer not found" });
  }

  if (offer.status !== 'countered') {
    return res.status(400).json({ success: false, message: "No counter offer to accept" });
  }

  offer.offeredPrice = offer.counterPrice!;
  offer.status = 'approved';
  offer.negotiationHistory.push({
    price: offer.counterPrice!,
    offeredBy: 'port',
    timestamp: new Date(),
    notes: 'Counter accepted by port user'
  });

  await offer.save();

  // Also update requirement if all quantity is met? 
  // For now just mark as approved
  
  return res.status(200).json({
    success: true,
    message: "Counter offer accepted successfully",
    data: offer,
  });
});

/**
 * Send a new counter offer back to the warehouse
 */
export const counterOffer = asyncHandler(async (req: Request, res: Response) => {
  const { offerId } = req.params;
  const { price, notes } = req.body;
  const portId = (req as any).user.userId || (req as any).user.id || (req as any).user._id;

  const offer = await PortOffer.findOne({ _id: offerId, portId });
  if (!offer) {
    return res.status(404).json({ success: false, message: "Offer not found" });
  }

  offer.offeredPrice = price;
  offer.status = 'negotiating';
  offer.negotiationHistory.push({
    price,
    offeredBy: 'port',
    timestamp: new Date(),
    notes
  });

  await offer.save();

  return res.status(200).json({
    success: true,
    message: "Counter offer sent successfully",
    data: offer,
  });
});

/**
 * Get all offers for Admin to review
 */
export const adminGetAllOffers = asyncHandler(async (req: Request, res: Response) => {
  const { status, requirementId } = req.query;
  const filter: any = {};
  
  if (status) filter.status = status;
  if (requirementId) filter.requirementId = requirementId;

  const offers = await PortOffer.find(filter)
    .populate('requirementId')
    .populate('portId')
    .populate('warehouseId')
    .sort({ updatedAt: -1 });

  return res.status(200).json({
    success: true,
    data: offers,
  });
});

/**
 * Admin sends a counter-offer to a Port
 */
export const adminCounterOffer = asyncHandler(async (req: Request, res: Response) => {
  const { offerId } = req.params;
  const { price, notes } = req.body;

  const offer = await PortOffer.findById(offerId);
  if (!offer) {
    return res.status(404).json({ success: false, message: "Offer not found" });
  }

  offer.counterPrice = price;
  offer.status = 'countered';
  offer.negotiationHistory.push({
    price,
    offeredBy: 'admin',
    timestamp: new Date(),
    notes: notes || 'Counter offer from Admin'
  });

  await offer.save();

  // Notify Port via Socket
  const io = req.app.get('io');
  if (io) {
    io.to(`port-${offer.portId}`).emit('new-counter-offer', {
      offerId: offer._id,
      requirementId: offer.requirementId,
      price,
      message: 'Admin has sent a counter offer'
    });
  }

  return res.status(200).json({
    success: true,
    message: "Counter offer sent to port",
    data: offer,
  });
});

/**
 * Admin confirms/approves an offer directly
 */
export const adminConfirmOffer = asyncHandler(async (req: Request, res: Response) => {
  const { offerId } = req.params;

  const offer = await PortOffer.findById(offerId);
  if (!offer) {
    return res.status(404).json({ success: false, message: "Offer not found" });
  }

  offer.status = 'approved';
  offer.negotiationHistory.push({
    price: offer.offeredPrice,
    offeredBy: 'admin',
    timestamp: new Date(),
    notes: 'Order confirmed by Admin'
  });

  await offer.save();

  // Update Requirement status
  const requirement = await PortRequirement.findByIdAndUpdate(offer.requirementId, { status: 'Closed' });

  // Update corresponding InwardStock status in Warehouse
  if (requirement) {
    await InwardStock.findOneAndUpdate(
      { invoiceNumber: requirement.requirementId },
      { status: 'Received' }
    );
  }

  // Notify Port
  const io = req.app.get('io');
  if (io) {
    io.to(`port-${offer.portId}`).emit('offer-approved', {
      offerId: offer._id,
      message: 'Your offer has been confirmed by Admin'
    });
  }

  return res.status(200).json({
    success: true,
    message: "Offer confirmed successfully",
    data: offer,
  });
});
