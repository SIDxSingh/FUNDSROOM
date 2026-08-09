import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ total, page, limit, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="pagination">
      <span className="pagination-info">
        Showing {start}–{end} of {total} results
      </span>
      <div className="pagination-controls">
        <button
          className="page-btn"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>…</span>
          ) : (
            <button
              key={p}
              className={`page-btn${p === page ? ' active' : ''}`}
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </button>
          )
        )}
        <button
          className="page-btn"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
