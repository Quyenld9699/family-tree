'use client';
import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Person } from 'src/services/personService';
import { isMale } from 'src/utils/genderUtils';
import { Avatar_Male, Avatar_Female } from 'src/constants/imagePaths';

interface PersonListViewProps {
    persons: Person[];
    onPersonClick?: (person: Person) => void;
}

const PAGE_SIZE_OPTIONS = [30, 50] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export default function PersonListView({ persons, onPersonClick }: PersonListViewProps) {
    const [search, setSearch] = useState('');
    const [pageSize, setPageSize] = useState<PageSize>(30);
    const [currentPage, setCurrentPage] = useState(1);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return persons;
        return persons.filter((p) => p.name.toLowerCase().includes(q));
    }, [persons, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setCurrentPage(1);
    }, []);

    const handlePageSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setPageSize(Number(e.target.value) as PageSize);
        setCurrentPage(1);
    }, []);

    const handlePrev = useCallback(() => setCurrentPage((p) => Math.max(1, p - 1)), []);
    const handleNext = useCallback(() => setCurrentPage((p) => Math.min(totalPages, p + 1)), [totalPages]);

    const getBirthYear = (person: Person): string => {
        if (!person.birth) return '—';
        const year = new Date(person.birth).getFullYear();
        return isNaN(year) ? '—' : String(year);
    };

    return (
        <div className="w-full h-full flex flex-col bg-gray-50 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={handleSearch}
                        placeholder="Tìm kiếm theo tên..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Results count */}
                <span className="text-sm text-gray-500 whitespace-nowrap">{filtered.length} người</span>

                {/* Page size */}
                <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-sm text-gray-500 whitespace-nowrap">Hiển thị</span>
                    <select value={pageSize} onChange={handlePageSizeChange} className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {PAGE_SIZE_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                    <span className="text-sm text-gray-500">/trang</span>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {paginated.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                        <svg className="w-12 h-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87M16 3.13a4 4 0 0 1 0 7.75M12 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                            />
                        </svg>
                        <span>Không tìm thấy kết quả</span>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {paginated.map((person, idx) => {
                            const avatarSrc = person.avatar && person.avatar.trim() !== '' ? person.avatar : isMale(person.gender) ? Avatar_Male : Avatar_Female;
                            const birthYear = getBirthYear(person);
                            const isDeceased = person.isDead === true;
                            const genderColor = isMale(person.gender) ? 'border-blue-400' : 'border-pink-400';
                            const rowNum = (currentPage - 1) * pageSize + idx + 1;

                            return (
                                <li key={person._id ?? idx} className="flex items-center gap-4 px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => onPersonClick?.(person)}>
                                    {/* Row number */}
                                    <span className="text-xs text-gray-400 w-6 text-right flex-shrink-0">{rowNum}</span>

                                    {/* Avatar */}
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 ${genderColor} overflow-hidden`}>
                                        <Image src={avatarSrc} alt={person.name} width={40} height={40} className={`w-full h-full object-cover ${isDeceased ? 'grayscale' : ''}`} />
                                    </div>

                                    {/* Name */}
                                    <span className={`flex-1 font-medium text-sm ${isDeceased ? 'text-gray-500' : 'text-gray-800'}`}>{person.name}</span>

                                    {/* Birth year */}
                                    <span className="text-sm text-gray-500 w-16 text-center flex-shrink-0">
                                        {birthYear !== '—' ? (
                                            <span className="flex items-center gap-1 justify-center">
                                                <svg className="w-3.5 h-3.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"
                                                    />
                                                </svg>
                                                {birthYear}
                                            </span>
                                        ) : (
                                            '—'
                                        )}
                                    </span>

                                    {/* Status badge */}
                                    <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${isDeceased ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                                        {isDeceased ? 'Đã mất' : 'Còn sống'}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 flex-shrink-0">
                <span className="text-sm text-gray-500">
                    Trang {currentPage} / {totalPages}
                    <span className="ml-2 text-gray-400">
                        ({(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} / {filtered.length})
                    </span>
                </span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Trang đầu"
                    >
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={handlePrev}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Trang trước"
                    >
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* Page number buttons */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let page: number;
                        if (totalPages <= 5) {
                            page = i + 1;
                        } else if (currentPage <= 3) {
                            page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                            page = totalPages - 4 + i;
                        } else {
                            page = currentPage - 2 + i;
                        }
                        return (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-8 h-8 text-sm rounded-md transition-colors ${page === currentPage ? 'bg-blue-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                {page}
                            </button>
                        );
                    })}

                    <button
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Trang sau"
                    >
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Trang cuối"
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
