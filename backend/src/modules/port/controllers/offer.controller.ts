import { Request, Response } from "express";
import PortOffer from "../../../models/PortOffer";
import PortRequirement from "../../../models/PortRequirement";
import InwardStock from "../../../models/InwardStock";
import PortUser from "../../../models/PortUser";
import { asyncHandler } from "../../../utils/asyncHandler";
import mongoose from "mongoose";
import { sendPortOfferNotification } from "../../../services/notificationService";
import { getIO } from "../../../socket/socketService";

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
    .populate('warehouseId', 'warehouseName managerName mobile address location')
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
    .populate('warehouseId', 'warehouseName managerName mobile address location');

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
  try {
    const io = getIO();
    io.to('admin-notifications').emit('new-port-offer', {
      offerId: offer._id,
      requirementId: requirement.requirementId,
      fishName: requirement.fishName,
      offeredPrice: offer.offeredPrice,
      quantityOffered: offer.quantityOffered,
      portName: portUser?.name || portUser?.portName || 'A Port User',
      timestamp: new Date()
    });
  } catch (socketErr) {
    console.error("Socket emission failed:", socketErr);
  }

  // Create persistent Notification (always create, even if socket fails)
  try {
    await sendPortOfferNotification(
      'Admin',
      '',
      'New Port Offer',
      `${portUser?.name || 'A Port'} has sent an offer for ${requirement.fishName}`,
      { link: `/admin/manage-warehouse/port-negotiations`, type: 'Info' }
    );
  } catch (notifErr) {
    console.error("Failed to create persistent notification:", notifErr);
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

  // Update Requirement status
  const requirement = await PortRequirement.findByIdAndUpdate(offer.requirementId, { status: 'Closed' });

  // Update corresponding InwardStock status in Warehouse
  if (requirement) {
    await InwardStock.findOneAndUpdate(
      { invoiceNumber: requirement.requirementId },
      { status: 'Received' }
    );
  }

  // Notify Admin & Warehouse
  try {
    const io = getIO();
    io.to('admin-notifications').emit('offer-approved', {
      offerId: offer._id,
      message: 'Port has accepted your counter offer'
    });
    
    const reqId = requirement?.requirementId || 'N/A';
    
    await sendPortOfferNotification(
      'Admin',
      '',
      'Counter Offer Accepted',
      `Port has accepted the counter offer for REQ-${reqId}. Deal is confirmed.`,
      { link: `/admin/manage-warehouse/port-negotiations`, status: 'approved' }
    );
    
    await sendPortOfferNotification(
      'Warehouse',
      offer.warehouseId.toString(),
      'Offer Confirmed',
      `An offer for your requirement REQ-${reqId} has been successfully negotiated and confirmed.`,
      { link: `/warehouse/port-shipments`, status: 'approved' }
    );
  } catch (err) {
    console.error("Failed to send acceptCounter notifications:", err);
  }

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

  // Notify Admin
  try {
    const io = getIO();
    io.to('admin-notifications').emit('new-port-offer', {
      offerId: offer._id,
      requirementId: offer.requirementId,
      price,
      message: 'Port has sent a counter offer'
    });
    
    // Also populate port user to get the name
    const portUser = await PortUser.findById(portId);
    
    await sendPortOfferNotification(
      'Admin',
      '',
      'Counter Offer from Port',
      `${portUser?.name || 'A Port'} has sent a counter offer of ₹${price}.`,
      { link: `/admin/manage-warehouse/port-negotiations`, type: 'Info' }
    );
  } catch (err) {
    console.error("Failed to send counterOffer notifications:", err);
  }

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
  try {
    const io = getIO();
    io.to(`port-${offer.portId}`).emit('new-counter-offer', {
      offerId: offer._id,
      requirementId: offer.requirementId,
      price,
      message: 'Admin has sent a counter offer'
    });
  } catch (err) {
    console.error("Socket emission failed:", err);
  }

  // Create persistent notification for Port
  try {
    await sendPortOfferNotification(
      'Port',
      offer.portId.toString(),
      'Counter Offer Received',
      `Admin has sent a counter offer of ₹${price} for your offer.`,
      { link: `/port/offers`, type: 'Info' }
    );
  } catch (err) {
    console.error("Failed to create persistent notification:", err);
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
  const { notes } = req.body;

  const offer = await PortOffer.findById(offerId);
  if (!offer) {
    return res.status(404).json({ success: false, message: "Offer not found" });
  }

  offer.status = 'approved';
  offer.negotiationHistory.push({
    price: offer.offeredPrice,
    offeredBy: 'admin',
    timestamp: new Date(),
    notes: notes || 'Order confirmed by Admin'
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
  try {
    const io = getIO();
    io.to(`port-${offer.portId}`).emit('offer-approved', {
      offerId: offer._id,
      message: 'Your offer has been approved by Admin'
    });
  } catch (err) {
    console.error("Socket emission failed:", err);
  }

  // Create Notification records
  try {
    const reqId = (offer.requirementId as any).requirementId || 'N/A';
    
    // Notify Port
    await sendPortOfferNotification(
      'Port',
      offer.portId.toString(),
      'Offer Approved',
      `Your offer for REQ-${reqId} has been approved.`,
      { link: `/port/orders/track/${offer._id}`, status: 'approved' }
    );
    
    // Notify Warehouse
    await sendPortOfferNotification(
      'Warehouse',
      offer.warehouseId.toString(),
      'Offer Confirmed',
      `An offer for your requirement REQ-${reqId} has been successfully negotiated and confirmed by Admin.`,
      { link: `/warehouse/port-shipments`, status: 'approved' }
    );
  } catch (err) {
    console.error("Failed to send notification:", err);
  }

  return res.status(200).json({
    success: true,
    message: "Offer confirmed successfully",
    data: offer,
  });
});

/**
 * Update delivery details for an approved offer
 */
export const updateDeliveryDetails = asyncHandler(async (req: Request, res: Response) => {
  const { offerId } = req.params;
  const { vehicleType, estimatedArrival, additionalInfo, trackingNumber, status } = req.body;
  const user = (req as any).user;
  const userId = user.userId || user.id || user._id;

  const offer = await PortOffer.findById(offerId);
  if (!offer) {
    return res.status(404).json({ success: false, message: "Offer not found" });
  }

  // Authorization Check
  if (user.userType === 'Port') {
    if (offer.portId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized: You can only update your own offers" });
    }
  } else if (user.userType === 'Warehouse') {
    if (offer.warehouseId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized: You can only update offers for your warehouse" });
    }
  } else if (user.userType !== 'Admin') {
    return res.status(403).json({ success: false, message: "Unauthorized user type" });
  }

  if (offer.status !== 'approved' && offer.status !== 'In Transit' && offer.status !== 'Delivered') {
    return res.status(400).json({ success: false, message: "Only approved or active shipments can have delivery updates" });
  }

  // Preserve existing delivery details if not provided
  const updatedDeliveryDetails = {
    vehicleType: vehicleType || offer.deliveryDetails?.vehicleType,
    estimatedArrival: estimatedArrival ? new Date(estimatedArrival) : offer.deliveryDetails?.estimatedArrival,
    additionalInfo: additionalInfo || offer.deliveryDetails?.additionalInfo,
    trackingNumber: trackingNumber || offer.deliveryDetails?.trackingNumber,
    status: status || offer.deliveryDetails?.status || 'In Transit',
    updatedAt: new Date()
  };

  offer.deliveryDetails = updatedDeliveryDetails;

  // If status is provided, update the main offer status too
  if (status) {
    offer.status = status;
  } else if (offer.status === 'approved') {
    offer.status = 'In Transit';
  }

  await offer.save();

  // Notify Admin/Warehouse/Port via Socket
  try {
    const io = getIO();
    // Notify all relevant rooms
    io.to('admin-notifications').emit('delivery-update', {
      offerId: offer._id,
      requirementId: offer.requirementId,
      status: offer.status,
      updatedBy: user.userType
    });
    
    io.to(`warehouse-${offer.warehouseId}`).emit('delivery-update', {
      offerId: offer._id,
      status: offer.status
    });

    io.to(`port-${offer.portId}`).emit('delivery-update', {
      offerId: offer._id,
      status: offer.status
    });
  } catch (err) {
    console.error("Socket emission failed:", err);
  }

  // Create Notification records for everyone
  try {
    const reqId = (offer.requirementId as any).requirementId || 'N/A';
    const statusMsg = `Shipment for REQ-${reqId} is now ${offer.status}`;

    // 1. Notify Admin
    await sendPortOfferNotification('Admin', '', 'Delivery Update', statusMsg, { link: '/admin/port-shipments' });
    
    // 2. Notify Warehouse
    await sendPortOfferNotification('Warehouse', offer.warehouseId.toString(), 'Inward Shipment Update', statusMsg, { link: '/warehouse/port-shipments' });

    // 3. Notify Port
    await sendPortOfferNotification('Port', offer.portId.toString(), 'Shipment Status Updated', statusMsg, { link: `/port/orders/track/${offer._id}` });
  } catch (err) {
    console.error("Failed to send notification:", err);
  }

  return res.status(200).json({
    success: true,
    message: "Delivery details updated successfully",
    data: offer,
  });
});

/**
 * Get port orders for a specific warehouse
 */
export const getWarehousePortOrders = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userId = user.userId || user.id || user._id;
  
  console.log(`[DEBUG] getWarehousePortOrders called. UserType: ${user.userType}, UserId: ${userId}`);

  let query: any = { 
    status: { $in: ['pending', 'approved', 'In Transit', 'Delivered', 'Cancelled'] } 
  };

  // If it's a warehouse user, filter by their specific warehouseId
  if (user.userType === 'Warehouse') {
    query.warehouseId = new mongoose.Types.ObjectId(userId);
  } 
  // If it's an admin, they can see all or filter by warehouseId if provided in query
  else if (user.userType === 'Admin') {
    const { warehouseId } = req.query;
    if (warehouseId) {
      query.warehouseId = new mongoose.Types.ObjectId(warehouseId as string);
    }
    // else: no warehouseId filter for admin, show all port orders
  } else {
    return res.status(403).json({ success: false, message: "Unauthorized: Invalid user type for this endpoint" });
  }

  console.log(`[DEBUG] Querying PortOffers with:`, JSON.stringify(query));

  const orders = await PortOffer.find(query)
    .populate({
      path: 'requirementId',
      select: 'requirementId fishName grade category unit'
    })
    .populate('portId', 'portName managerName mobile location profileImage')
    .populate('warehouseId', 'warehouseName managerName mobile address location')
    .sort({ updatedAt: -1 });

  console.log(`[DEBUG] Found ${orders.length} orders`);

  return res.status(200).json({
    success: true,
    data: orders
  });
});
