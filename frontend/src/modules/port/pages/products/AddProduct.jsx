import React from 'react';
import PageTitle from '../../components/common/PageTitle';
import { useNavigate } from 'react-router-dom';

const AddProduct = () => {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Product added successfully!');
    navigate('/port/products');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageTitle 
        title="Add New Product" 
        subtitle="List new fish stock available at the port"
      />

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 space-y-8">
          {/* Image Upload Area */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Image</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100/50 hover:border-teal-500/50 transition-all cursor-pointer group">
              <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-teal-600 group-hover:scale-110 transition-all">
                <span className="material-icons-outlined text-3xl">cloud_upload</span>
              </div>
              <p className="mt-4 text-sm font-bold text-slate-700">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG or WebP (max. 2MB)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fish Name</label>
              <input type="text" required placeholder="e.g. Pomfret" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
              <select className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all">
                <option>Premium</option>
                <option>Fresh Catch</option>
                <option>Frozen</option>
                <option>Dried</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fish Type</label>
              <input type="text" placeholder="e.g. Sea Water" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Size/Weight Class</label>
              <input type="text" placeholder="e.g. 500g - 1kg" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quality Grade</label>
              <select className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all">
                <option>Grade A+</option>
                <option>Grade A</option>
                <option>Grade B</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Quantity (KG)</label>
              <input type="number" required placeholder="0.00" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price per KG (₹)</label>
              <input type="number" required placeholder="0.00" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Availability Date</label>
              <input type="date" required className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Description</label>
            <textarea rows="4" placeholder="Describe the freshness, source, or special handling..." className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"></textarea>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4">
          <button 
            type="button" 
            onClick={() => navigate('/port/products')}
            className="px-6 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-white hover:shadow-sm transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-8 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 hover:-translate-y-0.5 transition-all active:translate-y-0"
          >
            Save Product
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
