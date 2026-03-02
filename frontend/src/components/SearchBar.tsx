import { useNavigate } from 'react-router-dom';

export default function SearchBar() {
  const navigate = useNavigate();

  const handleSearchClick = () => {
    navigate('/search');
  };

  return (
    <div className="px-4 mb-6">
      <div
        onClick={handleSearchClick}
        className="w-full bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-neutral-100 px-5 py-3.5 flex items-center gap-3 cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-neutral-200 transition-all duration-300 group"
      >
        <div className="text-[#009999] opacity-70 group-hover:opacity-100 transition-opacity">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <span className="flex-1 text-[15px] text-neutral-500 font-medium tracking-tight">
          Search for atta, dal, coke and more
        </span>
        <div className="px-2 py-1 bg-neutral-50 rounded-lg border border-neutral-100 text-[10px] text-neutral-400 font-bold uppercase tracking-wider hidden sm:block">
          Search
        </div>
      </div>
    </div>
  );
}


