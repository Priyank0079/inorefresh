import mongoose, { Document, Schema } from 'mongoose';

export interface IPortUser extends Document {
  portName: string;
  managerName: string;
  mobile: string;
  email: string;
  location: string;
  licenseNumber: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'BLOCKED';
  userType: 'Port';
  profileImage?: string;
  fcmTokens?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PortUserSchema = new Schema<IPortUser>(
  {
    portName: {
      type: String,
      required: [true, 'Port name is required'],
      trim: true,
    },
    managerName: {
      type: String,
      required: [true, 'Manager name is required'],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^[0-9]{10}$/.test(v);
        },
        message: 'Mobile number must be 10 digits',
      },
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: [true, 'Fishing license number is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'REJECTED', 'BLOCKED'],
      default: 'PENDING',
    },
    userType: {
      type: String,
      default: 'Port',
    },
    fcmTokens: {
      type: [String],
      default: [],
    },
    profileImage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const PortUser = (mongoose.models.PortUser as mongoose.Model<IPortUser>) || mongoose.model<IPortUser>('PortUser', PortUserSchema);

export default PortUser;
