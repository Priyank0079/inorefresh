import Warehouse from "../models/Warehouse";
import Product from "../models/Product";
import mongoose from "mongoose";

export interface NearestWarehouseResult {
    warehouseId: mongoose.Types.ObjectId;
    warehouseName: string;
    distanceKm: number;
}

export interface WarehouseStockItem {
    productId: string;
    quantity: number;
}

/**
 * Find the nearest active warehouse within maxDistanceKm that has ALL the given products in stock.
 * Falls back to nearest per-product assignment if no single warehouse has all items.
 *
 * @param latitude  - User delivery latitude
 * @param longitude - User delivery longitude
 * @param items     - Array of { productId, quantity }
 * @param maxDistanceMeters - Default 10,000 (10 KM)
 */
export async function findNearestWarehouseWithStock(
    latitude: number,
    longitude: number,
    items: WarehouseStockItem[],
    maxDistanceMeters = 10_000
): Promise<NearestWarehouseResult | null> {

    // ── Step 1: Find all ACTIVE warehouses within radius, sorted by proximity ──
    let nearbyWarehouses: any[];
    try {
        nearbyWarehouses = await Warehouse.find({
            status: "ACTIVE",
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude], // MongoDB: [lng, lat]
                    },
                    $maxDistance: maxDistanceMeters,
                },
            },
        })
            .select("_id warehouseName location")
            .lean();
    } catch (geoErr) {
        // If 2dsphere index isn't present yet, fall back to returning null gracefully
        console.warn("[WarehouseFulfillment] $near query failed (index may not exist yet):", (geoErr as Error).message);
        return null;
    }

    if (nearbyWarehouses.length === 0) {
        console.log(`[WarehouseFulfillment] No warehouses within ${maxDistanceMeters / 1000} km.`);
        return null;
    }

    console.log(`[WarehouseFulfillment] ${nearbyWarehouses.length} warehouses within radius.`);

    // ── Step 2: For each warehouse (closest first), check if it has ALL items in stock ──
    for (const warehouse of nearbyWarehouses) {
        let hasAllItems = true;

        for (const item of items) {
            // Check if this warehouse has this product with sufficient stock
            const product = await Product.findOne({
                _id: item.productId,
                warehouse: warehouse._id,
                publish: true,
                $or: [
                    // Product-level stock check
                    { stock: { $gte: item.quantity } },
                    // Variations-level stock check (at least one variation has enough)
                    { "variations.stock": { $gte: item.quantity } },
                ],
            })
                .select("_id stock")
                .lean();

            if (!product) {
                hasAllItems = false;
                console.log(
                    `[WarehouseFulfillment] Warehouse "${warehouse.warehouseName}" missing product ${item.productId}`
                );
                break;
            }
        }

        if (hasAllItems) {
            // Calculate distance in km for reporting
            const coords = warehouse.location?.coordinates;
            let distanceKm = 0;
            if (coords && coords.length === 2) {
                distanceKm = haversineDistanceKm(latitude, longitude, coords[1], coords[0]);
            }

            console.log(
                `[WarehouseFulfillment] ✅ Selected warehouse: "${warehouse.warehouseName}" | Distance: ${distanceKm.toFixed(2)} km`
            );

            return {
                warehouseId: warehouse._id,
                warehouseName: warehouse.warehouseName,
                distanceKm,
            };
        }
    }

    // No single warehouse covers all items
    console.log("[WarehouseFulfillment] No single warehouse has all items in stock within radius.");
    return null;
}

/** Haversine formula: distance between two lat/lng points in KM */
function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}
