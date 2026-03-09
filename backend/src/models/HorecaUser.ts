import mongoose, { Document, Schema } from 'mongoose';

export interface IHorecaUser extends Document {
    shopName: string;
    address: string;
    googleMapLink: string;
    deliveryTime: string;
    paymentMode: string;
    highValueProducts: string[];
    inorRepresentative: string;
    shopPhone: string;
    ownerName: string;
    ownerPhone: string;
    documents: string[]; // URLs of uploaded files
    status: 'Pending' | 'Active' | 'Inactive';
    createdAt: Date;
    walletAmount: number;
    refCode?: string;
}

const HorecaUserSchema: Schema = new Schema(
    {
        shopName: { type: String, required: true },
        address: { type: String, required: true },
        googleMapLink: { type: String, required: true },
        deliveryTime: { type: String, required: true },
        paymentMode: { type: String, required: true },
        highValueProducts: [{ type: String }],
        inorRepresentative: { type: String, required: true },
        shopPhone: { type: String, required: true },
        ownerName: { type: String, required: true },
        ownerPhone: { type: String, required: true, unique: true },
        documents: [{ type: String }],
        status: { type: String, enum: ['Pending', 'Active', 'Inactive'], default: 'Pending' },
        walletAmount: { type: Number, default: 0 },
        refCode: { type: String },
    },
    { timestamps: true }
);

export default mongoose.models.HorecaUser || mongoose.model<IHorecaUser>('HorecaUser', HorecaUserSchema, 'horeca_users');
