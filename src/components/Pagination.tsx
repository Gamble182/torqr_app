'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}


export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  const pages = [];

  // Calculate page numbers to show (max 7 pages at a time)
  let startPage = Math.max(1, currentPage - 3);
  let endPage = Math.min(totalPages, currentPage + 3);

  // Adjust if we're near the beginning or end
  if (currentPage <= 3) {
    endPage = Math.min(7, totalPages);
  }
  if (currentPage >= totalPages - 2) {
    startPage = Math.max(1, totalPages - 6);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between border-t border-border pt-4">
      {/* Info */}
      {totalItems && itemsPerPage && (
        <div className="text-sm text-muted-foreground">
          Zeige {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} bis{' '}
          {Math.min(currentPage * itemsPerPage, totalItems)} von {totalItems} Einträgen
        </div>
      )}

      {/* Page controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="gap-1"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Zurück
        </Button>

        {/* First page */}
        {startPage > 1 && (
          <>
            <Button
              variant={currentPage === 1 ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(1)}
            >
              1
            </Button>
            {startPage > 2 && (
              <span className="text-muted-foreground px-2">...</span>
            )}
          </>
        )}

        {/* Page numbers */}
        {pages.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}

        {/* Last page */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="text-muted-foreground px-2">...</span>
            )}
            <Button
              variant={currentPage === totalPages ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="gap-1"
        >
          Weiter
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
