import React, { useState, useRef } from 'react';
import PageTitle from '../../components/common/PageTitle';
import { useNavigate } from 'react-router-dom';
import { createProduct } from '../../../../services/api/portProductService';
import { uploadImage } from '../../../../services/api/uploadService';
import { useToast } from '../../../../context/ToastContext';

const AddProduct = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    productName: '',
    category: 'Premium',
    fishType: '',
    sizeWeightClass: '',
    qualityGrade: 'Grade A+',
    availableQuantity: '',
    pricePerKg: '',
    availabilityDate: new Date().toISOString().split('T')[0],
    description: '',
    image: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploading(true);
    try {
      const result = await uploadImage(file, 'port-products');
      setFormData(prev => ({ ...prev, image: result.secureUrl }));
      showToast('Image uploaded successfully', 'success');
    } catch (error) {
      console.error('Image upload failed:', error);
      showToast('Failed to upload image', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading) {
      showToast('Please wait for image to upload', 'info');
      return;
    }
    
    setLoading(true);
    try {
      const response = await createProduct({
        ...formData,
        availableQuantity: Number(formData.availableQuantity),
        pricePerKg: Number(formData.pricePerKg),
      });

      if (response.success) {
        showToast('Product added successfully!', 'success');
        navigate('/port/products');
      } else {
        showToast(response.message || 'Failed to add product', 'error');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      showToast(error.response?.data?.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
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
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden" 
            />
            <div 
              onClick={() => fileInputRef.current.click()}
              className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100/50 transition-all cursor-pointer group relative overflow-hidden h-48 ${uploading ? 'opacity-50 pointer-events-none' : ''} ${imagePreview ? 'border-teal-500/50' : 'border-slate-200 hover:border-teal-500/50'}`}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-bold">Change Image</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-teal-600 group-hover:scale-110 transition-all">
                    <span className="material-icons-outlined text-3xl">cloud_upload</span>
                  </div>
                  <p className="mt-4 text-sm font-bold text-slate-700">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG or WebP (max. 2MB)</p>
                </>
              )}
              
              {uploading && (
                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mb-2"></div>
                  <span className="text-xs font-bold text-teal-600">Uploading...</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fish Name</label>
              <input 
                type="text" 
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                required 
                placeholder="e.g. Pomfret" 
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
              <select 
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
              >
                <option value="Premium">Premium</option>
                <option value="Fresh Catch">Fresh Catch</option>
                <option value="Frozen">Frozen</option>
                <option value="Dried">Dried</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fish Type</label>
              <input 
                type="text" 
                name="fishType"
                value={formData.fishType}
                onChange={handleChange}
                placeholder="e.g. Sea Water" 
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Size/Weight Class</label>
              <input 
                type="text" 
                name="sizeWeightClass"
                value={formData.sizeWeightClass}
                onChange={handleChange}
                placeholder="e.g. 500g - 1kg" 
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quality Grade</label>
              <select 
                name="qualityGrade"
                value={formData.qualityGrade}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
              >
                <option value="Grade A+">Grade A+</option>
                <option value="Grade A">Grade A</option>
                <option value="Grade B">Grade B</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Quantity (KG)</label>
              <input 
                type="number" 
                name="availableQuantity"
                value={formData.availableQuantity}
                onChange={handleChange}
                required 
                placeholder="0.00" 
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price per KG (₹)</label>
              <input 
                type="number" 
                name="pricePerKg"
                value={formData.pricePerKg}
                onChange={handleChange}
                required 
                placeholder="0.00" 
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Availability Date</label>
              <input 
                type="date" 
                name="availabilityDate"
                value={formData.availabilityDate}
                onChange={handleChange}
                required 
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Description</label>
            <textarea 
              rows="4" 
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the freshness, source, or special handling..." 
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
            ></textarea>
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
            disabled={loading}
            className={`px-8 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 hover:-translate-y-0.5 transition-all active:translate-y-0 flex items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                Saving...
              </>
            ) : (
              'Save Product'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
