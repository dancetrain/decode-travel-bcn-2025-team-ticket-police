import React, { Fragment } from 'react';
import { Button } from './Button';
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
export function Pagination({
  currentPage,
  totalPages,
  onPageChange
}: PaginationProps) {
  if (totalPages <= 1) return null;
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;
    if (!showEllipsis) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      if (currentPage > 3) {
        pages.push('...');
      }
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      // Always show last page
      pages.push(totalPages);
    }
    return pages;
  };
  return <div className="flex items-center justify-center gap-2 mt-8">
      <Button variant="secondary" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2">
        Previous
      </Button>

      <div className="flex gap-1">
        {getPageNumbers().map((page, index) => <Fragment key={index}>
            {page === '...' ? <span className="px-3 py-2 text-neutral-500">...</span> : <button onClick={() => onPageChange(page as number)} className={`px-3 py-2 rounded-lg font-medium transition-all ${currentPage === page ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-300'}`}>
                {page}
              </button>}
          </Fragment>)}
      </div>

      <Button variant="secondary" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2">
        Next
      </Button>
    </div>;
}