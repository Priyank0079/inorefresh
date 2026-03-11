import { Request, Response } from 'express';
import HorecaUser from '../models/HorecaUser';
import RetailerUser from '../models/RetailerUser';
import { uploadDocumentFromBuffer } from '../services/cloudinaryService';
import { CLOUDINARY_FOLDERS } from '../config/cloudinary';
import { generateToken } from '../services/jwtService';

// Mock SMS OTP integration
const MOCK_OTP = "1234";

export const login = async (req: Request, res: Response): Promise<any> => {
    try {
        const { phone, userType, otp } = req.body;

        if (!phone || !userType) return res.status(400).json({ success: false, message: 'Phone and userType required' });

        let user;
        if (userType === 'horeca') {
            user = await HorecaUser.findOne({ $or: [{ ownerPhone: phone }, { shopPhone: phone }] });
        } else {
            user = await RetailerUser.findOne({ $or: [{ ownerPhone: phone }, { shopPhone: phone }] });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found. Please sign up.' });
        }

        // Verify OTP - require OTP if not provided initially
        if (!otp) {
            return res.json({
                success: true,
                message: 'User found. Please enter 4-digit OTP sent to your number.'
            });
        }

        if (otp !== MOCK_OTP) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        const token = generateToken(user._id.toString(), userType as any);

        res.json({ success: true, token, user });
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
        res.status(201).json({ success: true, message: 'HORECA user signed up successfully', user: newHoreca });
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
        res.status(201).json({ success: true, message: 'Retailer user signed up successfully', user: newRetailer });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
