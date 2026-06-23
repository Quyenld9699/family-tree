'use client';
import Link from 'next/link';
import UserMenu from 'src/components/UserMenu/UserMenu';
import GioBellIcon from 'src/components/GioBellIcon/GioBellIcon';
import { User } from 'src/services/authService';
import { useEventNotifications } from 'src/hooks/useEvents';

interface TopBarProps {
    user: User | null;
    isAdmin: boolean;
    onLogout: () => void;
    onOpenGuestCodeModal: () => void;
    onOpenSearch: () => void;
    isSearchActive: boolean;
}

export default function TopBar({ user, isAdmin, onLogout, onOpenGuestCodeModal, onOpenSearch, isSearchActive }: TopBarProps) {
    const { data: notifications = [] } = useEventNotifications();
    return (
        <div className="fixed z-50 flex items-center gap-2" style={{ top: '0.75rem', right: '0.75rem' }}>
            {/* Gio reminder bell */}
            <GioBellIcon notifications={notifications} />

            {/* Search toggle button */}
            <button
                onClick={onOpenSearch}
                className="relative w-9 h-9 flex items-center justify-center rounded-[12px] border transition-all duration-150 hover:scale-[1.04]"
                style={{ backgroundColor: '#fefef9', borderColor: isSearchActive ? '#1a3a3a' : '#e5e5e5', color: isSearchActive ? '#1a3a3a' : '#6a6a6a' }}
                title="Tìm kiếm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                {isSearchActive && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#1a3a3a' }} />}
            </button>

            {/* Link to persons list */}
            {user && (
                <Link
                    href="/persons"
                    className="flex items-center gap-1.5 px-2.5 py-2 md:px-3 text-[13px] font-medium rounded-[12px] border transition-colors"
                    style={{ backgroundColor: '#fefef9', borderColor: '#e5e5e5', color: '#3a3a3a' }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#f9f7f2';
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#fefef9';
                    }}
                    title="Xem danh sách thành viên"
                >
                    <svg className="w-4 h-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    <span className="hidden sm:inline">Danh sách</span>
                </Link>
            )}

            {!user ? (
                <a
                    href="/guest-login"
                    className="px-3 py-2 md:px-4 text-[13px] font-semibold rounded-[12px] transition-colors flex items-center"
                    style={{ backgroundColor: '#0a0a0a', color: '#ffffff' }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#1f1f1f';
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#0a0a0a';
                    }}
                >
                    Đăng nhập
                </a>
            ) : (
                <UserMenu user={user} isAdmin={isAdmin} onLogout={onLogout} onOpenGuestCodeModal={onOpenGuestCodeModal} />
            )}
        </div>
    );
}
