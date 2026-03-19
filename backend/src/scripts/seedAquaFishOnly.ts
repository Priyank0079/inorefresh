import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Category from "../models/Category";
import Product from "../models/Product";
import Warehouse from "../models/Warehouse";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/dhakadsnazzy";

type AquaSeedRow = {
  name: string;
  size: string | null;
  kg: number | null;
  price: number | null;
};

const AQUA_ROWS: AquaSeedRow[] = [
  { name: "Katla Big", size: "2.5 to 5 kg", kg: 200, price: 100 },
  { name: "Katla Medium", size: "1 to 2 kg", kg: 200, price: 100 },
  { name: "Rohu Big", size: "2.5 kg up", kg: 200, price: 100 },
  { name: "Rohu Medium", size: "1 to 2 kg", kg: 200, price: 100 },
  { name: "Tilapia", size: "3 to 4 c", kg: 200, price: 40 },
  { name: "Pangus", size: "1 to 2 kg", kg: 200, price: 70 },
  { name: "Ropchand", size: "1 to 2 kg", kg: 200, price: 100 },
  { name: "Papada", size: "0.5 to 2 kg", kg: 25, price: null },
  { name: "Thenkara", size: null, kg: 25, price: null },
  { name: "Kari mean", size: null, kg: 50, price: null },
  { name: "Glass Curp", size: "1 to 2 kg", kg: 100, price: null },
  { name: "Glass Curp", size: "750 gm to 1 kg", kg: 100, price: null },
  { name: "Mirgal", size: "2 kg up", kg: 50, price: null },
  { name: "Mirgal", size: "1 to 2 kg", kg: 50, price: null },
  { name: "Mirgal", size: "750 gm to 1 kg", kg: 25, price: null },
  { name: "Silver", size: "5 kg up", kg: 25, price: null },
  { name: "Tilapia", size: "2 c", kg: 25, price: null },
  { name: "Tilapia", size: "3 to 4 c", kg: 30, price: null },
  { name: "Pangus", size: "1 to 2 kg", kg: null, price: null },
  { name: "Ropchand", size: "1 to 2 kg", kg: null, price: null },
];

function normalizeText(value: string | null): string | null {
  if (value === null) return null;
  const cleaned = value.trim().replace(/\s+/g, " ");
  return cleaned.length ? cleaned : null;
}

function dedupeRows(rows: AquaSeedRow[]): AquaSeedRow[] {
  const map = new Map<string, AquaSeedRow>();

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

async function ensureAquaCategory() {
  const existing = await Category.findOne({ name: /^Aqua Fish$/i });
  if (existing) return existing;

  const sibling = await Category.findOne({
    name: { $in: ["Marine Fish", "Marin Fish", "Bangali Fish", "Bengali Fish"] },
  }).sort({ order: 1 });

  const aquaCategory = await Category.create({
    name: "Aqua Fish",
    slug: "aqua-fish",
    status: "Active",
    order: sibling ? sibling.order + 1 : 0,
    headerCategoryId: sibling?.headerCategoryId || null,
    groupCategory: sibling?.groupCategory || undefined,
    createdBy: "ADMIN",
  });

  return aquaCategory;
}

async function upsertAquaProduct(
  warehouseId: mongoose.Types.ObjectId,
  categoryId: mongoose.Types.ObjectId,
  headerCategoryId: mongoose.Types.ObjectId | null | undefined,
  row: AquaSeedRow
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
      new Set([...(existingProduct.tags || []), "aqua-fish"])
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
    tags: ["aqua-fish"],
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

  const aquaCategory = await ensureAquaCategory();
  const warehouses = await Warehouse.find({ status: "ACTIVE" }).select("_id");
  const uniqueRows = dedupeRows(AQUA_ROWS);

  let created = 0;
  let updated = 0;

  for (const warehouse of warehouses) {
    for (const row of uniqueRows) {
      const result = await upsertAquaProduct(
        warehouse._id as mongoose.Types.ObjectId,
        aquaCategory._id as mongoose.Types.ObjectId,
        aquaCategory.headerCategoryId as mongoose.Types.ObjectId | null | undefined,
        row
      );
      if (result === "created") created += 1;
      if (result === "updated") updated += 1;
    }
  }

  console.log(
    `Aqua Fish seed complete. Created: ${created}, Updated: ${updated}, Warehouses: ${warehouses.length}, Unique Items: ${uniqueRows.length}`
  );
}

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Aqua Fish seed failed:", error);
    try {
      await mongoose.disconnect();
    } catch (_e) {
      // ignore
    }
    process.exit(1);
  });

