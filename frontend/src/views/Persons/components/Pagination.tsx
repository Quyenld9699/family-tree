interface PaginationProps {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, pageSize, totalItems, onPageChange }: PaginationProps) {
    if (totalItems === 0) return null;

    return (
        <div className="flex-shrink-0 bg-white border-t border-gray-200">
            <div className="max-w-[900px] mx-auto flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-500">
                    Trang {currentPage} / {totalPages}
                    <span className="ml-2 text-gray-400">
                        ({(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} / {totalItems})
                    </span>
                </span>
                <div className="flex items-center gap-1">
                    <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let page: number;
                        if (totalPages <= 5) page = i + 1;
                        else if (currentPage <= 3) page = i + 1;
                        else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                        else page = currentPage - 2 + i;
                        return (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={`w-8 h-8 text-sm rounded-md transition-colors ${page === currentPage ? 'bg-blue-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                {page}
                            </button>
                        );
                    })}

                    <button
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
