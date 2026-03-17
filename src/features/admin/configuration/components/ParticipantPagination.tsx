import React from 'react';

interface ParticipantPaginationProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
}

export const ParticipantPagination: React.FC<ParticipantPaginationProps> = ({
  currentPage,
  totalPages,
  setCurrentPage,
}) => {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Paginación de participantes" className="w-full max-w-[900px] mt-4 px-2">
      <div className="flex flex-wrap justify-center items-center gap-2 bg-white rounded-xl p-3 border border-gray-100 shadow">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          aria-label="Ir a la primera página"
          className="px-3 py-1 rounded bg-gray-200 text-gray-900 hover:bg-[color:var(--color-accent)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm transition"
        >
          ««
        </button>
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          aria-label="Ir a la página anterior"
          className="px-3 py-1 rounded bg-gray-200 text-gray-900 hover:bg-[color:var(--color-accent)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm transition"
        >
          «
        </button>
        
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
          .map((page, index, arr) => (
            <span key={page} className="flex items-center">
              {index > 0 && arr[index - 1] !== page - 1 && <span className="text-gray-400 px-1" aria-hidden="true">...</span>}
              <button
                onClick={() => setCurrentPage(page)}
                aria-current={currentPage === page ? "page" : undefined}
                aria-label={`Ir a la página ${page}`}
                className={`px-3 py-1 rounded text-sm transition ${
                  currentPage === page
                    ? "bg-[color:var(--color-accent)] text-white font-bold"
                    : "bg-gray-200 text-gray-900 hover:bg-[color:var(--color-accent)] hover:text-white"
                }`}
              >
                {page}
              </button>
            </span>
          ))}

        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          aria-label="Ir a la página siguiente"
          className="px-3 py-1 rounded bg-gray-200 text-gray-900 hover:bg-[color:var(--color-accent)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm transition"
        >
          »
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Ir a la última página"
          className="px-3 py-1 rounded bg-gray-200 text-gray-900 hover:bg-[color:var(--color-accent)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm transition"
        >
          »»
        </button>
      </div>
    </nav>
  );
};
