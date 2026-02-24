import Link from 'next/link';
import UserMenu from 'src/components/UserMenu/UserMenu';
import { FilterMode } from '../types';
import { useAuth } from 'src/context/AuthContext';

interface HeaderProps {
    isolatedCount: number;
    filterMode: FilterMode;
    onFilterModeChange: (mode: FilterMode) => void;
    onOpenGuestCodeModal: () => void;
}

export default function Header({ isolatedCount, filterMode, onFilterModeChange, onOpenGuestCodeModal }: HeaderProps) {
    const { isAdmin, logout, user } = useAuth();

    return (
        <header className="flex-shrink-0 flex items-center gap-3 px-4 h-14 bg-white border-b border-gray-200 shadow-sm">
            {/* Back to tree */}
            <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Cây gia phả
            </Link>

            <span className="text-gray-300">|</span>

            <h1 className="text-base font-semibold text-gray-800">Danh sách thành viên</h1>

            {/* Isolated filter badge */}
            {isolatedCount > 0 && (
                <button
                    onClick={() => onFilterModeChange(filterMode === 'isolated' ? 'all' : 'isolated')}
                    className={`ml-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        filterMode === 'isolated' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    }`}
                    title="Lọc người chưa có mối liên hệ nào trong cây"
                >
                    <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    {isolatedCount} chưa có liên hệ
                    {filterMode === 'isolated' && (
                        <svg className="w-3 h-3 ml-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                </button>
            )}

            <div className="ml-auto flex items-center gap-2">{user && <UserMenu user={user} isAdmin={isAdmin} onLogout={logout} onOpenGuestCodeModal={onOpenGuestCodeModal} />}</div>
        </header>
    );
}
