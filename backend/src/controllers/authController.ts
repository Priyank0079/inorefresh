import { Request, Response } from 'express';
import HorecaUser from '../models/HorecaUser';
import RetailerUser from '../models/RetailerUser';
import jwt from 'jsonwebtoken';

// Mock SMS OTP integration
const MOCK_OTP = "1234";

export const login = async (req: Request, res: Response): Promise<any> => {
    try {
        const { phone, userType, otp } = req.body;

        // Simplistic mock implementation for demo
        if (!phone || !userType) return res.status(400).json({ success: false, message: 'Phone and userType required' });

        // Depending on logic, verify OTP
        if (otp && otp !== MOCK_OTP) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        let user;
        if (userType === 'horeca') {
            user = await HorecaUser.findOne({ ownerPhone: phone }) || await HorecaUser.findOne({ shopPhone: phone });
        } else {
            user = await RetailerUser.findOne({ ownerPhone: phone }) || await RetailerUser.findOne({ shopPhone: phone });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found. Please sign up.' });
        }

        const token = jwt.sign({ id: user._id, type: userType }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

        res.json({ success: true, token, user });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const signupHoreca = async (req: Request, res: Response): Promise<any> => {
    try {
        const newHoreca = new HorecaUser(req.body);
        await newHoreca.save();
        res.status(201).json({ success: true, message: 'HORECA user signed up successfully', user: newHoreca });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const signupRetailer = async (req: Request, res: Response): Promise<any> => {
    try {
        const newRetailer = new RetailerUser(req.body);
        await newRetailer.save();
        res.status(201).json({ success: true, message: 'Retailer user signed up successfully', user: newRetailer });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
