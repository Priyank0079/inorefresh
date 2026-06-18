import OrderItem from "../models/OrderItem";
import "../models/Product"; // ensure Product is registered for populate("product")

/**
 * Compute total weight per order = Σ(item.quantity × product.weight).
 * Returns a Map of orderId(string) → weight. Orders with no weighted
 * products simply map to 0.
 */
export async function computeOrderWeights(orderIds: any[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!orderIds || orderIds.length === 0) return map;

  const items = await OrderItem.find({ order: { $in: orderIds } })
    .populate("product", "weight")
    .select("order quantity product")
    .lean();

  for (const it of items as any[]) {
    const perUnit = it.product?.weight || 1;
    const w = perUnit * (it.quantity || 0);
    const key = String(it.order);
    map.set(key, (map.get(key) || 0) + w);
  }
  return map;
}
