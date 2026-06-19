import { Request, Response } from 'express';
import HorecaUser from '../models/HorecaUser';
import RetailerUser from '../models/RetailerUser';
import { uploadDocumentFromBuffer } from '../services/cloudinaryService';
import { CLOUDINARY_FOLDERS } from '../config/cloudinary';
import { generateToken } from '../services/jwtService';
import Admin from '../models/Admin';
import Customer from '../models/Customer';
import { sendNotification } from '../services/notificationService';


import { sendSmsOtp, verifySmsOtp } from '../services/otpService';

export const login = async (req: Request, res: Response): Promise<any> => {
    try {
        const { phone, userType, otp } = req.body;

        if (!phone || !userType) return res.status(400).json({ success: false, message: 'Phone and userType required' });

        let user;
        let resolvedUserType = userType;
        if (userType === 'horeca') {
            user = await HorecaUser.findOne({ $or: [{ ownerPhone: phone }, { shopPhone: phone }] });
        } else if (userType === 'retailer') {
            user = await RetailerUser.findOne({ $or: [{ ownerPhone: phone }, { shopPhone: phone }] });
        }

        // Fallback: search across all user types if not found
        if (!user) {
            const horecaUser = await HorecaUser.findOne({ $or: [{ ownerPhone: phone }, { shopPhone: phone }] });
            if (horecaUser) { user = horecaUser; resolvedUserType = 'horeca'; }
        }
        if (!user) {
            const retailerUser = await RetailerUser.findOne({ $or: [{ ownerPhone: phone }, { shopPhone: phone }] });
            if (retailerUser) { user = retailerUser; resolvedUserType = 'retailer'; }
        }
        if (!user) {
            const customer = await Customer.findOne({ phone });
            if (customer) { user = customer; resolvedUserType = 'Customer'; }
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found. Please sign up.' });
        }

        // Step 1: No OTP provided — send OTP via SMS
        if (!otp) {
            const otpUserType = resolvedUserType === 'Customer' ? 'Customer' : 'Customer';
            await sendSmsOtp(phone, otpUserType as any);
            return res.json({
                success: true,
                message: 'OTP sent to your phone number.',
                sessionId: 'DB_VERIFIED_' + phone,
            });
        }

        // Step 2: Verify OTP
        const otpUserType = resolvedUserType === 'Customer' ? 'Customer' : 'Customer';
        const isValid = await verifySmsOtp('DB_VERIFIED_' + phone, otp, phone, otpUserType as any);
        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please try again.' });
        }

        const token = generateToken(user._id.toString(), resolvedUserType as any);

        res.json({
            success: true,
            token,
            user: {
                ...user.toObject(),
                userType: resolvedUserType
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const signupHoreca = async (req: Request, res: Response): Promise<any> => {
    try {
        const userData = { ...req.body };

        // Parse highValueProducts if it's sent as a stringified array
        if (typeof userData.highValueProducts === 'string') {
            try {
                userData.highValueProducts = JSON.parse(userData.highValueProducts);
            } catch (e) {
                userData.highValueProducts = [userData.highValueProducts];
            }
        }

        // Handle file uploads
        const documentUrls: string[] = [];
        if (req.files && Array.isArray(req.files)) {
            const uploadPromises = (req.files as any[]).map(file =>
                uploadDocumentFromBuffer(file.buffer, {
                    folder: CLOUDINARY_FOLDERS.warehouse_DOCUMENTS,
                    resourceType: file.mimetype.startsWith('image/') ? 'image' : 'raw'
                })
            );
            const results = await Promise.all(uploadPromises);
            results.forEach(res => documentUrls.push(res.secureUrl));
        }
        userData.documents = documentUrls;

        const newHoreca = new HorecaUser(userData);
        await newHoreca.save();

        // Notify all admins in real time (DB persist + socket popup + push)
        try {
            const { getIO } = await import('../socket/socketService');
            let io: any = null;
            try { io = getIO(); } catch { /* socket not yet running in tests */ }

            const title = 'New HORECA Registration';
            const message = `New HORECA user ${newHoreca.shopName} (${newHoreca.ownerName}) has registered.`;
            const admins = await Admin.find({}).select('_id').lean();

            for (const admin of admins) {
                await sendNotification('Admin', admin._id.toString(), title, message, {
                    type: 'System',
                    priority: 'High',
                    link: '/admin/customers',
                });
            }

            if (io) {
                io.to('admin-notifications').emit('new-horeca-registration', {
                    title, message, shopName: newHoreca.shopName, link: '/admin/customers', timestamp: new Date(),
                });
            }
        } catch (notifyErr) {
            console.error('Failed to notify admin of HORECA registration:', notifyErr);
        }

        // Process Signup Rewards (1000 bonus + referral check)
        const { processSignupRewards } = require('../services/rewardService');
        await processSignupRewards(newHoreca._id.toString(), 'horeca', userData.referralCode);

        res.status(201).json({ 
            success: true, 
            message: 'HORECA user signed up successfully', 
            user: {
                ...newHoreca.toObject(),
                userType: 'horeca'
            } 
        });
    } catch (error: any) {

        res.status(500).json({ success: false, message: error.message });
    }
};

export const signupRetailer = async (req: Request, res: Response): Promise<any> => {
    try {
        const userData = { ...req.body };

        // Parse highValueProducts if it's sent as a stringified array
        if (typeof userData.highValueProducts === 'string') {
            try {
                userData.highValueProducts = JSON.parse(userData.highValueProducts);
            } catch (e) {
                userData.highValueProducts = [userData.highValueProducts];
            }
        }

        // Handle file uploads
        const documentUrls: string[] = [];
        if (req.files && Array.isArray(req.files)) {
            const uploadPromises = (req.files as any[]).map(file =>
                uploadDocumentFromBuffer(file.buffer, {
                    folder: CLOUDINARY_FOLDERS.warehouse_DOCUMENTS,
                    resourceType: file.mimetype.startsWith('image/') ? 'image' : 'raw'
                })
            );
            const results = await Promise.all(uploadPromises);
            results.forEach(res => documentUrls.push(res.secureUrl));
        }
        userData.documents = documentUrls;

        const newRetailer = new RetailerUser(userData);
        await newRetailer.save();

        // Notify all admins in real time (DB persist + socket popup + push)
        try {
            const { getIO } = await import('../socket/socketService');
            let io: any = null;
            try { io = getIO(); } catch { /* socket not yet running in tests */ }

            const title = 'New Retailer Registration';
            const message = `New Retailer user ${newRetailer.shopName} (${newRetailer.ownerName}) has registered.`;
            const admins = await Admin.find({}).select('_id').lean();

            for (const admin of admins) {
                await sendNotification('Admin', admin._id.toString(), title, message, {
                    type: 'System',
                    priority: 'High',
                    link: '/admin/customers',
                });
            }

            if (io) {
                io.to('admin-notifications').emit('new-retailer-registration', {
                    title, message, shopName: newRetailer.shopName, link: '/admin/customers', timestamp: new Date(),
                });
            }
        } catch (notifyErr) {
            console.error('Failed to notify admin of Retailer registration:', notifyErr);
        }

        // Process Signup Rewards (1000 bonus + referral check)
        const { processSignupRewards } = require('../services/rewardService');
        await processSignupRewards(newRetailer._id.toString(), 'retailer', userData.referralCode);

        res.status(201).json({ 
            success: true, 
            message: 'Retailer user signed up successfully', 
            user: {
                ...newRetailer.toObject(),
                userType: 'retailer'
            } 
        });
    } catch (error: any) {

        res.status(500).json({ success: false, message: error.message });
    }
};
