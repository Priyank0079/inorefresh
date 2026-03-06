import api from './config';

export interface WalletStats {
    availableBalance: number;
    totalEarnings: number;
    pendingSettlement: number;
    totalWithdrawn: number;
}

export interface WalletTransaction {
    _id: string;
    amount: number;
    type: 'Credit' | 'Debit';
    description: string;
    status: 'Completed' | 'Pending' | 'Failed';
    reference: string;
    createdAt: string;
}

export interface WithdrawRequest {
    _id: string;
    amount: number;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
    paymentMethod: string;
    accountDetails: string;
    remarks?: string;
    createdAt: string;
}

export interface OrderEarning {
    id: string;
    orderId: string;
    source: string;
    amount: number;
    commission: number;
    netEarning: number;
    date: string;
    status: 'Settled' | 'Pending';
}

/**
 * Get warehouse wallet balance
 */
export const getWarehouseWalletBalance = async (): Promise<any> => {
    const response = await api.get('/auth/warehouse/wallet/balance');
    return response.data;
};

/**
 * Get warehouse wallet transactions
 */
export const getWarehouseWalletTransactions = async (params?: any): Promise<any> => {
    const response = await api.get('/auth/warehouse/wallet/transactions', { params });
    return response.data;
};

/**
 * Request warehouse withdrawal
 */
export const requestWarehouseWithdrawal = async (amount: number, paymentMethod: string): Promise<any> => {
    const response = await api.post('/auth/warehouse/wallet/withdraw', { amount, paymentMethod });
    return response.data;
};

/**
 * Get warehouse withdrawals
 */
export const getWarehouseWithdrawals = async (params?: any): Promise<any> => {
    const response = await api.get('/auth/warehouse/wallet/withdrawals', { params });
    return response.data;
};

/**
 * Get warehouse commissions
 */
export const getWarehouseCommissions = async (params?: any): Promise<any> => {
    const response = await api.get('/auth/warehouse/wallet/commissions', { params });
    return response.data;
};
