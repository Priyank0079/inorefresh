import React, { useState } from 'react';
import PageTitle from '../../components/common/PageTitle';
import StatusBadge from '../../components/common/StatusBadge';
import { dummyProducts } from '../../data/dummyProducts';
import { useNavigate } from 'react-router-dom';

const MyProducts = () => {
  const [viewType, setViewType] = useState('grid'); // 'grid' or 'table'
  const navigate = useNavigate();

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

      {viewType === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dummyProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="relative h-48 overflow-hidden bg-slate-100">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-3 right-3">
                  <StatusBadge status={product.status} />
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{product.category}</span>
                  <span className="text-sm font-bold text-slate-800">₹{product.price}/kg</span>
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-1">{product.name}</h4>
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 font-medium">
                  <span className="flex items-center gap-1"><span className="material-icons-outlined text-sm">scale</span>{product.quantity}</span>
                  <span className="flex items-center gap-1"><span className="material-icons-outlined text-sm">workspace_premium</span>{product.quality}</span>
                </div>
                <div className="pt-4 border-t border-slate-50 flex items-center gap-2">
                  <button className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors">Edit</button>
                  <button className="px-3 py-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                    <span className="material-icons-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
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
              {dummyProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={product.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">{product.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold tracking-tight">{product.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{product.category}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{product.quality}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{product.quantity}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">₹{product.price}</td>
                  <td className="px-6 py-4"><StatusBadge status={product.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-teal-600 transition-colors"><span className="material-icons-outlined">edit</span></button>
                    <button className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><span className="material-icons-outlined">delete</span></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyProducts;
