import React, { useEffect, useState } from 'react';
import { exploreProducts, PortProduct } from '../../services/api/portProductService';
import StatusBadge from './StatusBadge';
import LoadingSpinner from '../LoadingSpinner';
import { useThemeContext } from '../../context/ThemeContext';

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
  const { currentTheme } = useThemeContext();

  const [selectedProduct, setSelectedProduct] = useState<PortProductWithPort | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMessage, setContactMessage] = useState('');

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

  const handleViewDetails = (product: PortProductWithPort) => {
    setSelectedProduct(product);
    setShowModal(true);
    setShowContactForm(false);
  };

  const handleContact = (product: PortProductWithPort) => {
    setSelectedProduct(product);
    setShowModal(true);
    setShowContactForm(true);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Message sent to ${selectedProduct?.portId.managerName}: ${contactMessage}`);
    setContactMessage('');
    setShowContactForm(false);
    setShowModal(false);
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
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Explore Port Products</h2>
          <p className="text-gray-500 text-sm mt-1">Discover fresh arrivals directly from ports across the region</p>
        </div>
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search products, ports or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700">No products found</h3>
          <p className="text-gray-500 mt-1">Try adjusting your search or check back later for new arrivals.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div 
              key={product._id} 
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full"
            >
              <div className="relative h-48 overflow-hidden bg-gray-100">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.productName} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2zm4 8h-2V7h2v10z" />
                    </svg>
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-teal-700 text-xs font-bold rounded-full shadow-sm">
                    {product.category}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <StatusBadge status={product.qualityGrade} />
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{product.productName}</h3>
                    <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">ID: {product._id.slice(-8)}</p>
                  </div>
                  <p className="text-teal-600 font-bold text-lg">₹{product.pricePerKg}<span className="text-xs text-gray-400 font-normal">/kg</span></p>
                </div>
                
                <div className="space-y-3 mb-4 flex-1">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium text-gray-700">{product.portId.portName}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span>Stock: <span className="font-semibold text-gray-800">{product.availableQuantity} kg</span></span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 mt-auto">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-[10px] font-bold border border-teal-200">
                          {product.portId.managerName.charAt(0)}
                        </div>
                        <span className="text-xs text-gray-500 font-medium">{product.portId.managerName}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        className="px-3 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => handleViewDetails(product)}
                      >
                        View Details
                      </button>
                      <button 
                        className="px-3 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 transition-colors duration-200 shadow-sm shadow-teal-200"
                        onClick={() => handleContact(product)}
                      >
                        Contact
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleIn max-h-[90vh] flex flex-col">
            <div className="relative h-48 md:h-64 flex-shrink-0">
              {selectedProduct.image ? (
                <img src={selectedProduct.image} alt={selectedProduct.productName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2zm4 8h-2V7h2v10z" />
                  </svg>
                </div>
              )}
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l18 18" />
                </svg>
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-3xl font-black text-gray-900">{selectedProduct.productName}</h2>
                    <StatusBadge status={selectedProduct.qualityGrade} />
                  </div>
                  <p className="text-gray-400 font-mono text-sm">UNIQUE PRODUCT ID: {selectedProduct._id}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-teal-600">₹{selectedProduct.pricePerKg}<span className="text-sm text-gray-400 font-normal">/kg</span></p>
                  <p className="text-sm text-gray-500 font-medium">{selectedProduct.availableQuantity}kg available</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Port Information</h4>
                  <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center text-gray-700">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center mr-3 shadow-sm">
                        <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Port Name</p>
                        <p className="font-bold">{selectedProduct.portId.portName}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center mr-3 shadow-sm">
                        <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Manager</p>
                        <p className="font-bold">{selectedProduct.portId.managerName}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Details</h4>
                  <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center text-gray-700">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center mr-3 shadow-sm">
                        <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 12h.01M7 17h.01M17 7h.01M17 12h.01M17 17h.01" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Category</p>
                        <p className="font-bold">{selectedProduct.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center mr-3 shadow-sm">
                        <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Availability Date</p>
                        <p className="font-bold">{new Date(selectedProduct.availabilityDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {showContactForm ? (
                <div className="border-t pt-8 mt-8 animate-slideUp">
                  <h4 className="text-xl font-black text-gray-900 mb-4 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Contact Port Manager
                  </h4>
                  <form onSubmit={handleSendMessage} className="space-y-4">
                    <textarea
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder={`Inquire about ${selectedProduct.productName}...`}
                      className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-teal-100 focus:border-teal-500 outline-none transition-all h-32 resize-none"
                    />
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setShowContactForm(false)}
                        className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-2 py-3 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-200 px-8"
                      >
                        Send Message
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="border-t pt-8 mt-8 flex justify-center">
                  <button 
                    onClick={() => setShowContactForm(true)}
                    className="w-full md:w-auto px-12 py-4 bg-teal-600 text-white rounded-2xl font-black text-lg hover:bg-teal-700 transition-all shadow-xl shadow-teal-200 transform hover:-translate-y-1"
                  >
                    Contact Manager Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortProductExplore;
