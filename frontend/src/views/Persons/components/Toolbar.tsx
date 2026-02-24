import { PAGE_SIZE_OPTIONS, PageSize } from '../types';
import { useAuth } from 'src/context/AuthContext';

interface ToolbarProps {
    search: string;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    pageSize: PageSize;
    onPageSizeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onAddPerson: () => void;
}

export default function Toolbar({ search, onSearchChange, pageSize, onPageSizeChange, onAddPerson }: ToolbarProps) {
    const { isAdmin, isEditor } = useAuth();

    return (
        <div className="flex-shrink-0 bg-white border-b border-gray-200 z-10">
            <div className="max-w-[900px] mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Search */}
                <div className="relative w-full sm:max-w-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={onSearchChange}
                        placeholder="Tìm kiếm thành viên..."
                        className="block w-full pl-9 pr-3 py-2 text-sm border-gray-200 rounded-full bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-gray-400"
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <select
                        value={pageSize}
                        onChange={onPageSizeChange}
                        className="block pl-3 pr-8 py-1.5 text-sm border-gray-200 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer hover:bg-white transition-colors"
                    >
                        {PAGE_SIZE_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                                {s} / trang
                            </option>
                        ))}
                    </select>

                    {(isAdmin || isEditor) && (
                        <button
                            onClick={onAddPerson}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                        >
                            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="hidden sm:inline">Thêm</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
