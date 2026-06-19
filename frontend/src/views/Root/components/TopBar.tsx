'use client';
import Link from 'next/link';
import UserMenu from 'src/components/UserMenu/UserMenu';
import { User } from 'src/services/authService';

interface TopBarProps {
    user: User | null;
    isAdmin: boolean;
    onLogout: () => void;
    onOpenGuestCodeModal: () => void;
}

export default function TopBar({ user, isAdmin, onLogout, onOpenGuestCodeModal }: TopBarProps) {
    return (
        <div className="fixed z-50 flex items-center gap-2" style={{ top: '0.75rem', right: '0.75rem' }}>
            {/* Link to persons list */}
            {user && (
                <Link
                    href="/persons"
                    className="flex items-center gap-1.5 px-2.5 py-2 md:px-3 text-[13px] font-medium rounded-[12px] border transition-colors"
                    style={{
                        backgroundColor: '#fefef9',
                        borderColor: '#e5e5e5',
                        color: '#3a3a3a',
                    }}
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
