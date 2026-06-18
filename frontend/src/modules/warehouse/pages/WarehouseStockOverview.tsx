import { useEffect, useState } from "react";
import api from "../../../services/api/config";

export default function WarehouseStockOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/warehouse/stock-overview");
      setData(res.data.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const summary = data?.summary;
  const products: any[] = data?.products || [];

  const filtered = products.filter((p) => {
    if (search && !p.productName.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "Low Stock") return p.isLowStock;
    if (filter === "Out of Stock") return p.isOutOfStock;
    if (filter === "Active") return p.status === "Active";
    if (filter === "Inactive") return p.status === "Inactive";
    return true;
  });

  return (
    <div className="min-h-screen bg-neutral-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Stock Overview</h1>
            <p className="text-sm text-neutral-500">Complete inventory status with alerts</p>
          </div>
          <button onClick={load} className="px-4 py-2 rounded-lg bg-white border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-10 text-center text-neutral-500">Loading...</div>
        ) : (
          <>
            {/* Summary cards */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                <div className="bg-white rounded-xl border p-3 text-center">
                  <p className="text-xl font-black text-neutral-900">{summary.totalProducts}</p>
                  <p className="text-[10px] text-neutral-500 font-medium">Products</p>
                </div>
                <div className="bg-white rounded-xl border p-3 text-center">
                  <p className="text-xl font-black text-green-700">{summary.activeProducts}</p>
                  <p className="text-[10px] text-neutral-500 font-medium">Active</p>
                </div>
                <div className="bg-white rounded-xl border p-3 text-center">
                  <p className="text-xl font-black text-blue-700">{summary.totalStockUnits}</p>
                  <p className="text-[10px] text-neutral-500 font-medium">In Stock</p>
                </div>
                <div className="bg-white rounded-xl border p-3 text-center">
                  <p className="text-xl font-black text-neutral-700">{summary.totalSoldUnits}</p>
                  <p className="text-[10px] text-neutral-500 font-medium">Sold</p>
                </div>
                <div className="bg-white rounded-xl border p-3 text-center">
                  <p className="text-xl font-black text-neutral-900">₹{(summary.totalRevenue || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-neutral-500 font-medium">Revenue</p>
                </div>
                <div className="bg-white rounded-xl border p-3 text-center border-amber-200">
                  <p className="text-xl font-black text-amber-600">{summary.lowStockCount}</p>
                  <p className="text-[10px] text-amber-600 font-medium">Low Stock</p>
                </div>
                <div className="bg-white rounded-xl border p-3 text-center border-red-200">
                  <p className="text-xl font-black text-red-600">{summary.outOfStockCount}</p>
                  <p className="text-[10px] text-red-600 font-medium">Out of Stock</p>
                </div>
                <div className="bg-white rounded-xl border p-3 text-center border-orange-200">
                  <p className="text-xl font-black text-orange-600">{summary.needsReorder}</p>
                  <p className="text-[10px] text-orange-600 font-medium">Reorder</p>
                </div>
              </div>
            )}

            {/* Alerts */}
            {data?.outOfStockProducts?.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="font-bold text-red-700 text-sm mb-2">Out of Stock ({data.outOfStockProducts.length})</p>
                <div className="flex flex-wrap gap-2">
                  {data.outOfStockProducts.map((p: any) => (
                    <span key={p._id} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">{p.productName}</span>
                  ))}
                </div>
              </div>
            )}
            {data?.lowStockProducts?.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="font-bold text-amber-700 text-sm mb-2">Low Stock — Reorder Soon ({data.lowStockProducts.length})</p>
                <div className="flex flex-wrap gap-2">
                  {data.lowStockProducts.map((p: any) => (
                    <span key={p._id} className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                      {p.productName} ({p.currentStock} left)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Filter + search */}
            <div className="bg-white rounded-xl border p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <select value={filter} onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-neutral-300 text-sm">
                <option>All</option>
                <option>Active</option>
                <option>Inactive</option>
                <option>Low Stock</option>
                <option>Out of Stock</option>
              </select>
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product..."
                className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <span className="text-xs text-neutral-500">{filtered.length} product(s)</span>
            </div>

            {/* Product table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-600 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Product</th>
                      <th className="text-left px-4 py-3 font-medium">Category</th>
                      <th className="text-right px-4 py-3 font-medium">Price</th>
                      <th className="text-right px-4 py-3 font-medium">Stock</th>
                      <th className="text-right px-4 py-3 font-medium">Inward</th>
                      <th className="text-right px-4 py-3 font-medium">Sold</th>
                      <th className="text-right px-4 py-3 font-medium">Revenue</th>
                      <th className="text-center px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filtered.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-neutral-500">No products found</td></tr>
                    ) : filtered.map((p) => (
                      <tr key={p._id} className={`hover:bg-neutral-50 ${p.isOutOfStock ? "bg-red-50/30" : p.isLowStock ? "bg-amber-50/30" : ""}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.image ? (
                              <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover border" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 text-xs">No img</div>
                            )}
                            <div>
                              <p className="font-semibold text-neutral-900 text-sm">{p.productName}</p>
                              {p.sku && <p className="text-[10px] text-neutral-400">SKU: {p.sku}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-neutral-600 text-xs">{p.category}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-neutral-900">₹{p.price}</span>
                          {p.discPrice > 0 && p.discPrice < p.price && (
                            <span className="block text-[10px] text-green-600">₹{p.discPrice}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-bold ${p.isOutOfStock ? "text-red-600" : p.isLowStock ? "text-amber-600" : "text-neutral-900"}`}>
                            {p.currentStock}
                          </span>
                          {p.isOutOfStock && <span className="block text-[10px] text-red-500 font-bold">OUT</span>}
                          {p.isLowStock && <span className="block text-[10px] text-amber-500 font-bold">LOW</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-neutral-600">{p.totalInward}</td>
                        <td className="px-4 py-3 text-right text-neutral-600">{p.totalSold}</td>
                        <td className="px-4 py-3 text-right font-medium text-neutral-900">₹{(p.totalRevenue || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === "Active" ? "bg-green-100 text-green-700"
                            : p.status === "Inactive" ? "bg-neutral-100 text-neutral-600"
                            : p.status === "Pending" ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                          }`}>{p.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
