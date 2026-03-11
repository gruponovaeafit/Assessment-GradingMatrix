import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  setCurrentPage,
}) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (page) =>
      page === 1 ||
      page === totalPages ||
      Math.abs(page - currentPage) <= 1
  );

  return (
    <div className="w-full max-w-7xl mt-6 px-1 sm:px-2">
      <div className="flex flex-wrap justify-center items-center gap-2 bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded bg-gray-100 text-gray-900 hover:bg-[color:var(--color-accent)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold transition"
        >
          ««
        </button>
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded bg-gray-100 text-gray-900 hover:bg-[color:var(--color-accent)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold transition"
        >
          «
        </button>
        {pages.map((page, index, arr) => (
          <span key={page} className="flex items-center">
            {index > 0 && arr[index - 1] !== page - 1 && (
              <span className="text-gray-300 px-1">...</span>
            )}
            <button
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded text-sm font-bold transition ${
                currentPage === page
                  ? "bg-[color:var(--color-accent)] text-white shadow-md shadow-purple-200"
                  : "bg-gray-100 text-gray-900 hover:bg-[color:var(--color-accent)] hover:text-white"
              }`}
            >
              {page}
            </button>
          </span>
        ))}
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded bg-gray-100 text-gray-900 hover:bg-[color:var(--color-accent)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold transition"
        >
          »
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded bg-gray-100 text-gray-900 hover:bg-[color:var(--color-accent)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold transition"
        >
          »»
        </button>
      </div>
    </div>
  );
};
