import React, { useState, useEffect } from 'react';
import PageTitle from '../../components/common/PageTitle';
import StatusBadge from '../../components/common/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { getMyProducts, deleteProduct } from '../../../../services/api/portProductService';
import { useToast } from '../../../../context/ToastContext';

const MyProducts = () => {
  const { showToast } = useToast();
  const [viewType, setViewType] = useState('grid'); // 'grid' or 'table'
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await getMyProducts();
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await deleteProduct(id);
        if (response.success) {
          showToast('Product deleted successfully', 'success');
          fetchProducts();
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        showToast('Failed to delete product', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle 
        title="My Products" 
        subtitle="Manage your port inventory and fish stock"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button 
                onClick={() => setViewType('grid')}
                className={`p-1.5 rounded-md transition-all ${viewType === 'grid' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <span className="material-icons-outlined text-xl">grid_view</span>
              </button>
              <button 
                onClick={() => setViewType('table')}
                className={`p-1.5 rounded-md transition-all ${viewType === 'table' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <span className="material-icons-outlined text-xl">format_list_bulleted</span>
              </button>
            </div>
            <button 
              onClick={() => navigate('/port/products/add')}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all"
            >
              <span className="material-icons-outlined text-lg">add</span>
              Add Product
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-icons-outlined text-4xl text-slate-300">inventory_2</span>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No products found</h3>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">You haven't listed any fish stock yet. Start by adding your first product to the port hub.</p>
          <button 
            onClick={() => navigate('/port/products/add')}
            className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all"
          >
            Add Your First Product
          </button>
        </div>
      ) : viewType === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product._id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="relative h-48 overflow-hidden bg-slate-100">
                {product.image ? (
                  <img src={product.image} alt={product.productName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <span className="material-icons-outlined text-5xl">image</span>
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <StatusBadge status={product.status} />
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{product.category}</span>
                  <span className="text-sm font-bold text-slate-800">₹{product.pricePerKg}/kg</span>
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-1 truncate">{product.productName}</h4>
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 font-medium">
                  <span className="flex items-center gap-1"><span className="material-icons-outlined text-sm">scale</span>{product.availableQuantity} kg</span>
                  <span className="flex items-center gap-1"><span className="material-icons-outlined text-sm">workspace_premium</span>{product.qualityGrade}</span>
                </div>
                <div className="pt-4 border-t border-slate-50 flex items-center gap-2">
                  <button className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors">Edit</button>
                  <button 
                    onClick={() => handleDelete(product._id)}
                    className="px-3 py-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <span className="material-icons-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Product</th>
                  <th className="px-6 py-4 font-bold">Category</th>
                  <th className="px-6 py-4 font-bold">Quality</th>
                  <th className="px-6 py-4 font-bold">Stock</th>
                  <th className="px-6 py-4 font-bold">Price</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                          {product.image ? (
                            <img src={product.image} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <span className="material-icons-outlined text-slate-300">image</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{product.productName}</p>
                          <p className="text-[10px] text-slate-400 font-bold tracking-tight uppercase">{product.fishType || 'Unknown Type'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{product.category}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{product.qualityGrade}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{product.availableQuantity} kg</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">₹{product.pricePerKg}</td>
                    <td className="px-6 py-4"><StatusBadge status={product.status} /></td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button className="p-2 text-slate-400 hover:text-teal-600 transition-colors"><span className="material-icons-outlined">edit</span></button>
                      <button 
                        onClick={() => handleDelete(product._id)}
                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <span className="material-icons-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProducts;
