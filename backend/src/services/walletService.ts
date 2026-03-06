import Warehouse from '../models/Warehouse';
import Customer from "../models/Customer";
import Commission from "../models/Commission";


/**
 * Process warehouse commission payment
 */
export const processwarehouseCommission = async (
  warehouseId: string,
  commissionId: string
) => {
  const commission = await Commission.findById(commissionId);
  if (!commission || !commission.warehouse || commission.warehouse.toString() !== warehouseId) {
    throw new Error("Commission not found or does not belong to warehouse");
  }

  if (commission.status !== "Pending") {
    throw new Error("Commission already processed");
  }

  const warehouseDoc = await Warehouse.findById(warehouseId);
  if (!warehouseDoc) {
    throw new Error("warehouse not found");
  }

  // Add commission to warehouse balance
  warehouseDoc.balance += commission.commissionAmount;
  await warehouseDoc.save();

  // Update commission status
  commission.status = "Paid";
  commission.paidAt = new Date();
  await commission.save();

  return {
    warehouse: warehouseDoc,
    commission,
  };
};

/**
 * Process withdrawal request
 */
export const processWithdrawal = async (
  warehouseId: string,
  amount: number,
  paymentReference?: string
) => {
  const warehouseDoc = await Warehouse.findById(warehouseId);
  if (!warehouseDoc) {
    throw new Error("warehouse not found");
  }

  if (warehouseDoc.balance < amount) {
    throw new Error("Insufficient balance");
  }

  // Deduct from warehouse balance
  warehouseDoc.balance -= amount;
  await warehouse.save();

  // Mark pending commissions as paid (if withdrawal covers them)
  const pendingCommissions = await Commission.find({
    warehouse: warehouseId,
    status: "Pending",
  }).sort({ createdAt: 1 });

  let remainingAmount = amount;
  for (const commission of pendingCommissions) {
    if (remainingAmount >= commission.commissionAmount) {
      commission.status = "Paid";
      commission.paidAt = new Date();
      commission.paymentReference = paymentReference;
      await commission.save();
      remainingAmount -= commission.commissionAmount;
    } else {
      break;
    }
  }

  return {
    warehouse,
    withdrawalAmount: amount,
    paymentReference,
  };
};

/**
 * Calculate warehouse earnings
 */
export const calculatewarehouseEarnings = async (
  warehouseId: string,
  period?: { start: Date; end: Date }
) => {
  const query: any = { warehouse: warehouseId, status: "Paid" };

  if (period) {
    query.paidAt = {
      $gte: period.start,
      $lte: period.end,
    };
  }

  const commissions = await Commission.find(query);

  const totalEarnings = commissions.reduce(
    (sum, c) => sum + c.commissionAmount,
    0
  );
  const totalOrders = commissions.length;

  return {
    totalEarnings,
    totalOrders,
    commissions,
  };
};

/**
 * Process customer wallet transaction
 */
export const processCustomerWalletTransaction = async (
  customerId: string,
  amount: number,
  type: "credit" | "debit",
  reason: string
) => {
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new Error("Customer not found");
  }

  if (type === "debit" && customer.walletAmount < amount) {
    throw new Error("Insufficient wallet balance");
  }

  const previousBalance = customer.walletAmount;
  customer.walletAmount =
    type === "credit"
      ? customer.walletAmount + amount
      : customer.walletAmount - amount;

  await customer.save();

  return {
    customer,
    transaction: {
      type,
      amount,
      reason,
      previousBalance,
      newBalance: customer.walletAmount,
    },
  };
};

/**
 * Process fund transfer between accounts
 */
export const processFundTransfer = async (
  fromType: "warehouse" | "customer",
  fromId: string,
  toType: "warehouse" | "customer",
  toId: string,
  amount: number
) => {
  // Get from account
  let fromAccount: any;
  if (fromType === "warehouse") {
    fromAccount = await warehouse.findById(fromId);
  } else {
    fromAccount = await Customer.findById(fromId);
  }

  if (!fromAccount) {
    throw new Error("From account not found");
  }

  const fromBalanceField = fromType === "warehouse" ? "balance" : "walletAmount";
  if (fromAccount[fromBalanceField] < amount) {
    throw new Error("Insufficient balance");
  }

  // Get to account
  let toAccount: any;
  if (toType === "warehouse") {
    toAccount = await warehouse.findById(toId);
  } else {
    toAccount = await Customer.findById(toId);
  }

  if (!toAccount) {
    throw new Error("To account not found");
  }

  // Process transfer
  fromAccount[fromBalanceField] -= amount;
  const toBalanceField = toType === "warehouse" ? "balance" : "walletAmount";
  toAccount[toBalanceField] += amount;

  await Promise.all([fromAccount.save(), toAccount.save()]);

  return {
    from: {
      type: fromType,
      id: fromId,
      previousBalance: fromAccount[fromBalanceField] + amount,
      newBalance: fromAccount[fromBalanceField],
    },
    to: {
      type: toType,
      id: toId,
      previousBalance: toAccount[toBalanceField] - amount,
      newBalance: toAccount[toBalanceField],
    },
    amount,
  };
};
