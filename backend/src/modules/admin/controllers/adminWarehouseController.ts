import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import Warehouse from "../../../models/Warehouse";
import Notification from "../../../models/Notification";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeCoordinate = (value: unknown): number => {
    const parsed = typeof value === "number" ? value : parseFloat(String(value));
    return parsed;
};

/**
 * Create warehouse account (Admin only)
 */
export const createWarehouse = asyncHandler(async (req: Request, res: Response) => {
    const {
        warehouseName,
        managerName,
        mobile,
        email,
        address,
        latitude: lat,
        longitude: lng,
        status = "ACTIVE",
        password,
        storeName
    } = req.body || {};

    if (
        !warehouseName ||
        !managerName ||
        !mobile ||
        !email ||
        !address ||
        lat === undefined ||
        lng === undefined
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Required fields: warehouseName, managerName, mobile, email, address, latitude, longitude",
        });
    }

    if (!/^[0-9]{10}$/.test(String(mobile))) {
        return res.status(400).json({
            success: false,
            message: "Mobile must be a valid 10-digit number",
        });
    }

    if (!EMAIL_REGEX.test(String(email))) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid email address",
        });
    }

    const latitude = normalizeCoordinate(lat);
    const longitude = normalizeCoordinate(lng);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return res.status(400).json({
            success: false,
            message: "Location must include valid latitude and longitude",
        });
    }

    const existingWarehouse = await Warehouse.findOne({
        $or: [{ email: String(email).toLowerCase() }, { mobile: String(mobile) }],
    });

    if (existingWarehouse) {
        return res.status(409).json({
            success: false,
            message: "Warehouse already exists with this mobile or email",
        });
    }

    const warehouse = await Warehouse.create({
        warehouseName: String(warehouseName).trim(),
        managerName: String(managerName).trim(),
        mobile: String(mobile).trim(),
        email: String(email).trim().toLowerCase(),
        password: password || "Warehouse@123", // Default password if not provided
        storeName: storeName || String(warehouseName).trim(),
        address: String(address).trim(),
        location: {
            type: "Point",
            coordinates: [longitude, latitude],
        },
        status,
        role: "warehouse",
        createdBy: "ADMIN",
        balance: 0,
    });

    await Notification.create({
        recipientType: "Warehouse",
        recipientId: warehouse._id,
        title: "Warehouse Created",
        message: `Warehouse ${warehouseName} has been created. Manager: ${managerName}.`,
        type: "System",
        priority: "High",
        createdBy: req.user?.userId,
    });

    return res.status(201).json({
        success: true,
        message: "Warehouse created successfully",
        data: warehouse
    });
});

/**
 * Get all warehouses
 */
export const getAllWarehouses = asyncHandler(async (_req: Request, res: Response) => {
    const warehouses = await Warehouse.find({
        email: { $ne: "admin-warehouse@zetomart.com" },
        $nor: [
            { warehouseName: { $regex: /^Warehouse W\d+$/i } },
            { managerName: { $regex: /^Manager W\d+$/i } },
            { email: { $regex: /^manager@w\d+\.com$/i } },
            { mobile: { $regex: /^999999990\d$/ } },
            { address: { $regex: /Hub Address,\s*City/i } },
        ],
    })
        .sort({ warehouseName: 1 });

    return res.status(200).json({
        success: true,
        message: "Warehouses fetched successfully",
        data: warehouses,
    });
});
