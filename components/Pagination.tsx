
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  // Simple logic to show a window of pages if there are too many
  let pages = [];
  if (totalPages <= 7) {
    pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  } else {
    if (currentPage <= 4) {
      pages = [1, 2, 3, 4, 5, '...', totalPages];
    } else if (currentPage >= totalPages - 3) {
      pages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    } else {
      pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-10 animate-in fade-in slide-in-from-bottom-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white hover:text-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm disabled:shadow-none bg-slate-50"
        aria-label="Previous Page"
      >
        <ChevronLeft size={18} />
      </button>
      
      <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
        {pages.map((page, idx) => (
          typeof page === 'number' ? (
            <button
              key={idx}
              onClick={() => onPageChange(page)}
              className={`w-9 h-9 rounded-md text-sm font-bold transition-all ${
                currentPage === page
                  ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5'
                  : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={idx} className="w-9 h-9 flex items-center justify-center text-slate-400 font-bold text-xs select-none">
              ...
            </span>
          )
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white hover:text-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm disabled:shadow-none bg-slate-50"
        aria-label="Next Page"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default Pagination;
