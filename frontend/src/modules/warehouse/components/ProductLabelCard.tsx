import React from 'react';

interface ProductLabelCardProps {
  name: string;
  tag: string;
  category: string;
  warehouse: string;
  variation: string;
}

const ProductLabelCard: React.FC<ProductLabelCardProps> = ({
  name,
  tag,
  category,
  warehouse,
  variation,
}) => {
  return (
    <div className="print-label bg-white border-2 border-neutral-900 rounded-2xl shadow-2xl w-full max-w-[360px] mx-auto font-sans relative overflow-hidden flex flex-col">
      {/* Top Header - Industrial Look */}
      <div className="bg-neutral-900 text-white p-4 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-black tracking-[0.3em] text-neutral-400">Inventory Management</span>
          <span className="text-sm font-bold tracking-tight">ZETO-MART SYSTEMS</span>
        </div>
        <div className="w-10 h-10 border-2 border-teal-500 rounded-full flex items-center justify-center">
          <div className="w-6 h-6 bg-teal-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-6">
        {/* Main Product Info */}
        <div className="border-b-2 border-neutral-100 pb-4">
          <h1 className="text-2xl font-black text-neutral-900 leading-none mb-3 break-words">
            {name}
          </h1>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-teal-50 text-teal-700 text-[10px] font-black rounded uppercase border border-teal-100 italic">
              {category}
            </span>
            <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-[10px] font-black rounded uppercase border border-neutral-200">
              {variation}
            </span>
          </div>
        </div>

        {/* The "Identity" Section - Taking center stage instead of QR */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white border border-neutral-200 rounded-xl p-5 flex flex-col items-center justify-center gap-2 overflow-hidden">
            {/* Faux Barcode background element */}
            <div className="absolute inset-0 flex gap-1 opacity-[0.03] pointer-events-none">
              {Array.from({length: 40}).map((_, i) => (
                <div key={i} className="h-full bg-black" style={{ width: Math.random() * 4 + 1 + 'px' }}></div>
              ))}
            </div>

            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.4em]">Serial Number</p>
            <p className="text-3xl font-black text-neutral-900 font-mono tracking-tighter leading-none py-1">
              {tag}
            </p>
            <div className="w-full h-1.5 flex gap-1 mt-1">
              {Array.from({length: 12}).map((_, i) => (
                <div key={i} className={`flex-1 rounded-full ${i % 3 === 0 ? 'bg-teal-500' : 'bg-neutral-200'}`}></div>
              ))}
            </div>
          </div>
        </div>

        {/* Secondary Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Facility</p>
            <p className="text-sm font-bold text-neutral-800 truncate">{warehouse}</p>
          </div>
          <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Status</p>
            <p className="text-sm font-bold text-teal-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
              VERIFIED
            </p>
          </div>
        </div>
      </div>

      {/* Footer / Safety Markings */}
      <div className="bg-neutral-50 p-4 border-t border-neutral-100 flex justify-between items-center text-[10px] font-bold text-neutral-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-neutral-300 rounded-full"></div>
          <span>ORIGINAL STOCK TAG</span>
        </div>
        <span>© 2025 ZM-INV</span>
      </div>

      {/* Circular Cutouts for "Punch Hole" feel */}
      <div className="absolute top-1/2 -left-3 w-6 h-6 bg-transparent border-2 border-neutral-900 rounded-full transform -translate-y-1/2"></div>
      <div className="absolute top-1/2 -right-3 w-6 h-6 bg-transparent border-2 border-neutral-900 rounded-full transform -translate-y-1/2"></div>

      <style dangerouslySetInnerHTML={{ __html: `
        @font-face {
          font-family: 'Inter';
          src: url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        }
        .print-label { 
          font-family: 'Inter', sans-serif !important; 
          background-image: radial-gradient(#f0f0f0 1px, transparent 1px);
          background-size: 20px 20px;
        }
        @media print {
          body * { visibility: hidden; }
          .print-label, .print-label * { visibility: visible; }
          .print-label {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100mm;
            height: auto;
            border: 2px solid #000;
            box-shadow: none;
            padding: 0;
            margin: 0;
            border-radius: 20px;
          }
          .no-print { display: none !important; }
        }
      `}} />
    </div>
  );
};

export default ProductLabelCard;
