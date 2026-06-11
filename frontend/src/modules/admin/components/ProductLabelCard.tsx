import React from 'react';

interface ProductLabelCardProps {
  name: string;
  tag: string;
  category: string;
  warehouse: string;
  variation: string;
}

const BAR_WIDTHS = [2,3,1,4,2,1,3,2,4,1,2,3,1,2,4,2,1,3,2,1,4,2,3,1,2,3,4,1,2,3];

const ProductLabelCard: React.FC<ProductLabelCardProps> = ({
  name,
  tag,
  category,
  warehouse,
  variation,
}) => {
  return (
    <div className="print-label bg-white border border-neutral-200 rounded-2xl shadow-lg w-full max-w-[340px] mx-auto font-sans overflow-hidden flex flex-col">

      {/* Header */}
      <div className="bg-[#0B2F3A] px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-semibold tracking-[0.25em] text-teal-400 uppercase">Inventory Management</p>
          <p className="text-[13px] font-black text-white tracking-wide mt-0.5">INORFRESH</p>
        </div>
        <div className="w-8 h-8 rounded-full border-2 border-teal-500 flex items-center justify-center">
          <div className="w-4 h-4 bg-teal-500 rounded-full" />
        </div>
      </div>

      <div className="px-4 pt-4 pb-3 flex flex-col gap-3">

        {/* Product Name + Badges */}
        <div>
          <h1 className="text-[20px] font-black text-neutral-900 leading-tight break-words mb-2">
            {name}
          </h1>
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold rounded border border-teal-200 uppercase tracking-wide">
              {category}
            </span>
            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-[10px] font-bold rounded border border-neutral-200 uppercase tracking-wide">
              {variation}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-neutral-200" />

        {/* Serial Number */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 flex flex-col items-center gap-1.5 relative overflow-hidden">
          {/* Static barcode decoration */}
          <div className="absolute inset-0 flex items-end justify-center gap-[2px] opacity-[0.04] pointer-events-none pb-1">
            {BAR_WIDTHS.map((w, i) => (
              <div key={i} className="bg-black rounded-sm" style={{ width: w, height: '60%' }} />
            ))}
          </div>

          <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.35em]">Serial Number</p>
          <p className="text-[22px] font-black text-neutral-900 font-mono tracking-tight leading-none">
            {tag}
          </p>
          {/* Decorative dots */}
          <div className="flex gap-1 mt-0.5">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full ${i % 4 === 0 ? 'w-3 bg-teal-500' : 'w-1.5 bg-neutral-300'}`}
              />
            ))}
          </div>
        </div>

        {/* Facility + Status */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2">
            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Facility</p>
            <p className="text-[13px] font-bold text-neutral-800 truncate">{warehouse}</p>
          </div>
          <div className="bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2">
            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Status</p>
            <p className="text-[13px] font-bold text-teal-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full inline-block" />
              VERIFIED
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-neutral-100 px-4 py-2 flex justify-between items-center">
        <span className="text-[9px] font-semibold text-neutral-400 uppercase tracking-wider">Original Stock Tag</span>
        <span className="text-[9px] font-semibold text-neutral-400">© 2025 INORFRESH</span>
      </div>

      {/* Punch holes */}
      <div className="absolute top-1/2 -left-2.5 w-5 h-5 border-2 border-neutral-200 rounded-full bg-white -translate-y-1/2" />
      <div className="absolute top-1/2 -right-2.5 w-5 h-5 border-2 border-neutral-200 rounded-full bg-white -translate-y-1/2" />

      <style dangerouslySetInnerHTML={{ __html: `
        .print-label { position: relative; }
        @media print {
          body * { visibility: hidden; }
          .print-label, .print-label * { visibility: visible; }
          .print-label {
            position: fixed;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: 95mm;
            border: 1px solid #ccc;
            box-shadow: none;
            border-radius: 12px;
          }
          .no-print { display: none !important; }
        }
      `}} />
    </div>
  );
};

export default ProductLabelCard;
