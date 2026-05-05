import React, { useEffect, useState } from 'react';
import { exploreProducts, PortProduct } from '../../services/api/portProductService';
import StatusBadge from './StatusBadge';
import LoadingSpinner from '../LoadingSpinner';

interface PortProductWithPort extends PortProduct {
  portId: {
    portName: string;
    location: string;
    managerName: string;
    mobile: string;
    email: string;
  };
}

const PortProductExplore: React.FC = () => {
  const [products, setProducts] = useState<PortProductWithPort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<PortProductWithPort | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await exploreProducts();
      if (response.success) {
        setProducts(response.data);
      } else {
        setError(response.message || 'Failed to fetch products');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching products');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product: PortProductWithPort) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const filteredProducts = products.filter(product => 
    product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.portId.portName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
      {error}
      <button onClick={fetchProducts} className="ml-4 underline font-medium">Try Again</button>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Refined Search Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Explore Port Products</h2>
          <p className="text-gray-500 text-sm mt-1">High-quality products directly from verified ports.</p>
        </div>
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search products or port names..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none text-sm"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Simplified Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl shadow-sm border border-gray-100 text-center">
          <p className="text-gray-400 font-medium">No results found for "{searchTerm}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <div 
              key={product._id} 
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-teal-200 transition-all duration-300 flex flex-col h-full hover:shadow-lg"
            >
              {/* Simple Image Section */}
              <div className="relative h-48 bg-gray-50">
                {product.image ? (
                  <img src={product.image} alt={product.productName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <StatusBadge status={product.qualityGrade} />
                </div>
              </div>

              {/* Clean Details Section */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1 leading-snug">{product.productName}</h3>
                  <p className="text-teal-600 font-bold text-lg">₹{product.pricePerKg}</p>
                </div>
                <div className="flex justify-between items-center mb-5">
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">ID: {product._id.slice(-6).toUpperCase()}</p>
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Per kg</p>
                </div>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span className="font-medium">{product.portId.portName}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="font-medium">Available: <span className="text-gray-900 font-semibold">{product.availableQuantity}kg</span></span>
                  </div>
                </div>

                <button 
                  onClick={() => handleOpenModal(product)}
                  className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-300 mt-auto"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Simple Professional Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleIn flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Product Specification</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto p-8">
              <div className="flex gap-6 mb-10">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {selectedProduct.image ? (
                    <img src={selectedProduct.image} alt={selectedProduct.productName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{selectedProduct.productName}</h2>
                    <StatusBadge status={selectedProduct.qualityGrade} />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-teal-600">₹{selectedProduct.pricePerKg}</p>
                    <p className="text-sm text-gray-400 font-medium">per kg</p>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Origin Port</p>
                    <p className="text-base font-semibold text-gray-900">{selectedProduct.portId.portName}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Current Stock</p>
                    <p className="text-base font-semibold text-gray-900">{selectedProduct.availableQuantity}kg</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Category</p>
                    <p className="text-base font-semibold text-gray-900">{selectedProduct.category}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Available Date</p>
                    <p className="text-base font-semibold text-gray-900">{new Date(selectedProduct.availabilityDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="pt-8 border-t">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Direct Contact Details</p>
                  <div className="grid grid-cols-1 gap-4">
                    <a href={`tel:${selectedProduct.portId.mobile}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-teal-50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-gray-400 group-hover:text-teal-600 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <span className="font-bold text-gray-800">{selectedProduct.portId.mobile}</span>
                      </div>
                      <span className="text-[10px] font-bold text-teal-600 opacity-0 group-hover:opacity-100 uppercase tracking-widest transition-opacity">Call Now</span>
                    </a>
                    <a href={`mailto:${selectedProduct.portId.email}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="font-bold text-gray-800 text-sm break-all">{selectedProduct.portId.email}</span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 uppercase tracking-widest transition-opacity">Email Now</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortProductExplore;
