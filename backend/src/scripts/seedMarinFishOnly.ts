import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Category from "../models/Category";
import Product from "../models/Product";
import Warehouse from "../models/Warehouse";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/dhakadsnazzy";

type MarinSeedRow = {
  name: string;
  size: string | null;
  kg: number | null;
  price: number | null;
};

const MARIN_ROWS: MarinSeedRow[] = [
  { name: "Lobstar", size: "9-10 c", kg: null, price: null },
  { name: "S.W. prawns", size: "25-35 c", kg: 25, price: null },
  { name: "Sea TigerPrawns", size: "10-12 c", kg: 25, price: null },
  { name: "seer fish", size: "1-2 kg", kg: 50, price: null },
  { name: "seer fish", size: "2-4", kg: 50, price: null },
  { name: "mackerel", size: "6-8 c", kg: 300, price: null },
  { name: "barracuda", size: "1-2 kg", kg: 100, price: null },
  { name: "squid", size: "10-12 c", kg: 50, price: null },
  { name: "B.Pomfret", size: "500 gm to 3 kg", kg: 200, price: null },
  { name: "indian salman", size: "1 to 3 kg", kg: 100, price: null },
  { name: "Tune Yellowfin", size: "2 to 3 kg", kg: 50, price: null },
  { name: "sardin", size: "18 to 20 count", kg: 300, price: null },
  { name: "silver fish", size: "80 to 120 c", kg: 100, price: null },
  { name: "pearl spot", size: "100-150 gm", kg: 100, price: null },
  { name: "spot crab", size: "6-8 c", kg: 50, price: null },
  { name: "w. Pomfret", size: "300 to 600 gm", kg: 50, price: null },
  { name: "Pink Purch", size: "4 to 5 c", kg: 25, price: null },
  { name: "Red Snapper", size: "0.5 to 5 kg", kg: 25, price: null },
  { name: "lady Fish", size: "10-30 count", kg: 25, price: null },
  { name: "Blue Crab", size: "3-4 / 4-6 c", kg: 30, price: null },
  { name: "white Snapper", size: "1-2 kg", kg: 30, price: null },
  { name: "Parl", size: "5 kg up", kg: 30, price: null },
  { name: "atlatic salmon", size: "2 to 4 kg", kg: null, price: null },
];

function normalizeText(value: string | null): string | null {
  if (value === null) return null;
  const cleaned = value.trim().replace(/\s+/g, " ");
  return cleaned.length ? cleaned : null;
}

function dedupeRows(rows: MarinSeedRow[]): MarinSeedRow[] {
  const map = new Map<string, MarinSeedRow>();

  for (const raw of rows) {
    const name = normalizeText(raw.name) || raw.name;
    const size = normalizeText(raw.size);
    const key = `${name.toLowerCase()}::${(size ?? "__null__").toLowerCase()}`;
    const existing = map.get(key);

    if (!existing) {
      map.set(key, { name, size, kg: raw.kg, price: raw.price });
      continue;
    }

    map.set(key, {
      name: existing.name,
      size: existing.size,
      kg: raw.kg ?? existing.kg,
      price: raw.price ?? existing.price,
    });
  }

  return [...map.values()];
}

async function ensureMarinCategory() {
  const existing = await Category.findOne({ name: /^Marin Fish$/i });
  if (existing) return existing;

  const sibling = await Category.findOne({
    $or: [
      { name: /^Aqua Fish$/i },
      { name: /^Bangali Fish$/i },
      { name: /^Bengali Fish$/i },
      { name: /^Marine Fish$/i },
    ],
  }).sort({ order: 1 });

  const marinCategory = await Category.create({
    name: "Marin Fish",
    slug: "marin-fish",
    status: "Active",
    order: sibling ? sibling.order + 1 : 0,
    headerCategoryId: sibling?.headerCategoryId || null,
    groupCategory: sibling?.groupCategory || undefined,
    createdBy: "ADMIN",
  });

  return marinCategory;
}

async function upsertMarinProduct(
  warehouseId: mongoose.Types.ObjectId,
  categoryId: mongoose.Types.ObjectId,
  headerCategoryId: mongoose.Types.ObjectId | null | undefined,
  row: MarinSeedRow
): Promise<"created" | "updated"> {
  const size = normalizeText(row.size);
  const stock = row.kg ?? 0;
  const price = row.price ?? 0;
  const valueText = size ?? "N/A";
  const statusText = stock > 0 ? "Available" : "Sold out";

  let existingProduct: any = null;
  if (size === null) {
    existingProduct = await Product.findOne({
      warehouse: warehouseId,
      category: categoryId,
      productName: row.name,
      $or: [{ pack: { $exists: false } }, { pack: null }, { pack: "" }],
    });
  } else {
    existingProduct = await Product.findOne({
      warehouse: warehouseId,
      category: categoryId,
      productName: row.name,
      pack: size,
    });
  }

  if (existingProduct) {
    existingProduct.productName = row.name;
    if (size === null) {
      existingProduct.pack = undefined;
    } else {
      existingProduct.pack = size;
    }
    existingProduct.price = price;
    existingProduct.discPrice = price;
    existingProduct.compareAtPrice = price > 0 ? price : undefined;
    existingProduct.stock = stock;
    existingProduct.publish = true;
    existingProduct.popular = existingProduct.popular ?? false;
    existingProduct.dealOfDay = existingProduct.dealOfDay ?? false;
    existingProduct.status = "Active";
    existingProduct.isReturnable = false;
    existingProduct.requiresApproval = false;
    existingProduct.variationType = "Size";
    existingProduct.tags = Array.from(
      new Set([...(existingProduct.tags || []), "marin-fish"])
    );
    existingProduct.smallDescription = `Size: ${
      row.size ?? "N/A"
    } | Kg: ${row.kg ?? "N/A"} | Price: ${row.price ?? "N/A"}`;
    existingProduct.variations = [
      {
        name: "Size",
        value: valueText,
        price,
        discPrice: price,
        stock,
        status: statusText,
      },
    ];
    if (headerCategoryId) {
      existingProduct.headerCategoryId = headerCategoryId;
    }

    await existingProduct.save();
    return "updated";
  }

  await Product.create({
    productName: row.name,
    category: categoryId,
    headerCategoryId: headerCategoryId || undefined,
    warehouse: warehouseId,
    pack: size || undefined,
    price,
    discPrice: price,
    compareAtPrice: price > 0 ? price : undefined,
    stock,
    publish: true,
    popular: false,
    dealOfDay: false,
    status: "Active",
    isReturnable: false,
    requiresApproval: false,
    variationType: "Size",
    tags: ["marin-fish"],
    smallDescription: `Size: ${row.size ?? "N/A"} | Kg: ${row.kg ?? "N/A"} | Price: ${
      row.price ?? "N/A"
    }`,
    variations: [
      {
        name: "Size",
        value: valueText,
        price,
        discPrice: price,
        stock,
        status: statusText,
      },
    ],
  });

  return "created";
}

async function run() {
  await mongoose.connect(MONGO_URI);

  const marinCategory = await ensureMarinCategory();
  const warehouses = await Warehouse.find({ status: "ACTIVE" }).select("_id");
  const uniqueRows = dedupeRows(MARIN_ROWS);

  let created = 0;
  let updated = 0;

  for (const warehouse of warehouses) {
    for (const row of uniqueRows) {
      const result = await upsertMarinProduct(
        warehouse._id as mongoose.Types.ObjectId,
        marinCategory._id as mongoose.Types.ObjectId,
        marinCategory.headerCategoryId as
          | mongoose.Types.ObjectId
          | null
          | undefined,
        row
      );
      if (result === "created") created += 1;
      if (result === "updated") updated += 1;
    }
  }

  console.log(
    `Marin Fish seed complete. Created: ${created}, Updated: ${updated}, Warehouses: ${warehouses.length}, Unique Items: ${uniqueRows.length}`
  );
}

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Marin Fish seed failed:", error);
    try {
      await mongoose.disconnect();
    } catch (_e) {
      // ignore
    }
    process.exit(1);
  });
