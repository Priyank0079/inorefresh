import mongoose from 'mongoose';
import dotenv from 'dotenv';
import HorecaUser from '../src/models/HorecaUser';
import RetailerUser from '../src/models/RetailerUser';

dotenv.config({ path: __dirname + '/../.env' });

const seedUser = async () => {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log("Connected.");

        const phone = "9111966732";

        // Check if exists
        const existsHoreca = await HorecaUser.findOne({ ownerPhone: phone });
        if (!existsHoreca) {
            const huser = new HorecaUser({
                ownerName: "Test Horeca",
                ownerPhone: phone,
                shopName: "Test Horeca Shop",
                shopPhone: phone,
                address: "Test Address",
                googleMapLink: "http://maps.google.com",
                deliveryTime: "6 AM to 7 AM",
                paymentMode: "COD",
                highValueProducts: ["Seer Fish"],
                inorRepresentative: "Test Rep",
                documents: [],
                status: "Active"
            });
            await huser.save();
            console.log("Created Horeca User with phone " + phone);
        } else {
            console.log("Horeca User already exists.");
        }

        const existsRetailer = await RetailerUser.findOne({ ownerPhone: phone });
        if (!existsRetailer) {
            const ruser = new RetailerUser({
                ownerName: "Test Retailer",
                ownerPhone: phone,
                shopName: "Test Retailer Shop",
                shopPhone: phone,
                address: "Test Address",
                googleMapLink: "http://maps.google.com",
                deliveryTime: "6 AM to 7 AM",
                paymentMode: "COD",
                highValueProducts: ["Seer Fish"],
                inorRepresentative: "Test Rep",
                documents: [],
                status: "Active"
            });
            await ruser.save();
            console.log("Created Retailer User with phone " + phone);
        } else {
            console.log("Retailer User already exists.");
        }

        console.log("Done seeding.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seedUser();
