import mongoose from "mongoose";
import Seller from "../models/Seller";
import Warehouse from "../models/Warehouse";

/**
 * Helper function to calculate distance between two coordinates (Haversine formula)
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
// Ray-casting algorithm for point-in-polygon check
// Point: [lng, lat], Polygon: [[[lng, lat], ...]] (GeoJSON structure)
export function isPointInPolygon(point: [number, number], polygon: number[][][]): boolean {
  if (!polygon || polygon.length === 0) return false;
  // We check the outer ring (index 0)
  const vs = polygon[0];
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y))
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Find sellers whose service radius covers the user's location
 * @param userLat User's latitude
 * @param userLng User's longitude
 * @returns Array of seller IDs within range
 */
export async function findSellersWithinRange(
  userLat: number,
  userLng: number
): Promise<mongoose.Types.ObjectId[]> {
  if (userLat === null || userLng === null || isNaN(userLat) || isNaN(userLng)) {
    return [];
  }

  // Validate coordinates
  if (userLat < -90 || userLat > 90 || userLng < -180 || userLng > 180) {
    return [];
  }

  try {
    // Fetch all approved sellers with location
    const sellers = await Seller.find({
      status: { $in: ["Approved", "ACTIVE"] },
    }).select("_id location serviceRadiusKm latitude longitude serviceAreaGeo");

    // Filter sellers where user is within their service radius
    const nearbySellerIds: mongoose.Types.ObjectId[] = [];

    for (const seller of sellers) {
      // 1. Check Custom Polygon Service Area First
      if (seller.serviceAreaGeo && seller.serviceAreaGeo.coordinates && seller.serviceAreaGeo.coordinates.length > 0) {
        if (isPointInPolygon([userLng, userLat], seller.serviceAreaGeo.coordinates)) {
          nearbySellerIds.push(seller._id as mongoose.Types.ObjectId);
        }
        continue; // If polygon exists, we ONLY check polygon (strict override)
      }

      let sellerLat: number | null = null;
      let sellerLng: number | null = null;


      // Try GeoJSON first
      if (seller.location && seller.location.coordinates && seller.location.coordinates.length === 2) {
        sellerLng = seller.location.coordinates[0];
        sellerLat = seller.location.coordinates[1];
      }
      // Fallback to string fields if GeoJSON missing
      else if (seller.latitude && seller.longitude) {
        sellerLat = parseFloat(seller.latitude);
        sellerLng = parseFloat(seller.longitude);
      }

      if (sellerLat !== null && sellerLng !== null && !isNaN(sellerLat) && !isNaN(sellerLng)) {
        const distance = calculateDistance(
          userLat,
          userLng,
          sellerLat,
          sellerLng
        );
        const serviceRadius = seller.serviceRadiusKm || 10; // Default to 10km if not set

        if (distance <= serviceRadius) {
          nearbySellerIds.push(seller._id as mongoose.Types.ObjectId);
        }
      }
    }

    // Include active warehouses as valid fulfillment sources.
    const warehouses = await Warehouse.find({
      status: "ACTIVE",
    }).select("_id location latitude longitude serviceRadiusKm");

    for (const warehouse of warehouses) {
      let warehouseLat: number | null = null;
      let warehouseLng: number | null = null;

      const coords = warehouse.location?.coordinates;
      if (coords && coords.length === 2) {
        warehouseLng = coords[0];
        warehouseLat = coords[1];
      } else if ((warehouse as any).latitude && (warehouse as any).longitude) {
        warehouseLat = parseFloat((warehouse as any).latitude);
        warehouseLng = parseFloat((warehouse as any).longitude);
      }

      if (warehouseLat === null || warehouseLng === null) continue;

      if (isNaN(warehouseLat) || isNaN(warehouseLng)) continue;

      const distance = calculateDistance(
        userLat,
        userLng,
        warehouseLat,
        warehouseLng
      );

      // Default warehouse service radius: 50km (configurable if present on doc)
      const serviceRadius =
        typeof (warehouse as any).serviceRadiusKm === "number" &&
        !isNaN((warehouse as any).serviceRadiusKm)
          ? (warehouse as any).serviceRadiusKm
          : 50;

      if (distance <= serviceRadius) {
        nearbySellerIds.push(warehouse._id as mongoose.Types.ObjectId);
      }
    }

    return nearbySellerIds;
  } catch (error) {
    console.error("Error finding nearby sellers:", error);
    return [];
  }
}
