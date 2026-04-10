import Customer from "../models/Customer";
import HorecaUser from "../models/HorecaUser";
import RetailerUser from "../models/RetailerUser";
import WalletTransaction from "../models/WalletTransaction";


/**
 * Award signup bonus and process referral if code provided
 */
export const processSignupRewards = async (userId: string, userType: string, referralCode?: string) => {
    try {
        let userModel: any;
        let mappedUserType: 'CUSTOMER' | 'horeca' | 'retailer';

        if (userType.toLowerCase() === 'customer') {
            userModel = Customer;
            mappedUserType = 'CUSTOMER';
        } else if (userType.toLowerCase() === 'horeca') {
            userModel = HorecaUser;
            mappedUserType = 'horeca';
        } else if (userType.toLowerCase() === 'retailer') {
            userModel = RetailerUser;
            mappedUserType = 'retailer';
        } else {
            console.error(`Unknown user type for rewards: ${userType}`);
            return;
        }

        const user = await userModel.findById(userId);
        if (!user) return;

        // 1. Award Signup Bonus (1000 coins)
        user.walletAmount = (user.walletAmount || 0) + 1000;
        await user.save();

        // Record signup transaction
        await WalletTransaction.create({
            userId: user._id,
            userType: mappedUserType,
            amount: 1000,
            type: 'Credit',
            description: 'Signup Bonus',
            status: 'Completed',
            reference: `SIGNUP-${Date.now()}-${user.phone || userId.substring(0, 5)}`
        });

        // 2. Process Referral Bonus (250 coins)
        if (referralCode) {
            await processReferralBonus(referralCode, user.phone || 'New User');
        }

    } catch (error) {
        console.error('Error processing signup rewards:', error);
    }
};

/**
 * Find referrer and award 250 coins
 */
export const processReferralBonus = async (referralCode: string, newUserName: string) => {
    try {
        // Search in all three collections for the referral code
        let referrer = await Customer.findOne({ refCode: referralCode.toUpperCase() });
        let referrerType: 'CUSTOMER' | 'horeca' | 'retailer' = 'CUSTOMER';

        if (!referrer) {
            referrer = await HorecaUser.findOne({ refCode: referralCode.toUpperCase() });
            referrerType = 'horeca';
        }

        if (!referrer) {
            referrer = await RetailerUser.findOne({ refCode: referralCode.toUpperCase() });
            referrerType = 'retailer';
        }

        if (referrer) {
            referrer.walletAmount = (referrer.walletAmount || 0) + 250;
            await referrer.save();

            // Record referral transaction for referrer
            await WalletTransaction.create({
                userId: referrer._id,
                userType: referrerType,
                amount: 250,
                type: 'Credit',
                description: `Referral Bonus for ${newUserName}`,
                status: 'Completed',
                reference: `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`
            });

            console.log(`Referral bonus of 250 awarded to ${referrerType} with code ${referralCode}`);
        } else {
            console.log(`Referral code ${referralCode} not found`);
        }
    } catch (error) {
        console.error('Error processing referral bonus:', error);
    }
};
