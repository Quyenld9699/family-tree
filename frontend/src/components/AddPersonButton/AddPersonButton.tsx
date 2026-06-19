'use client';

interface AddPersonButtonProps {
    onClick: () => void;
}

export default function AddPersonButton({ onClick }: AddPersonButtonProps) {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 left-4 z-10 font-semibold p-3 rounded-[14px] transition-all duration-150 hover:scale-[1.04] flex items-center justify-center md:absolute md:top-4 md:bottom-auto md:left-4"
            style={{ backgroundColor: '#0a0a0a', color: '#ffffff', boxShadow: '0 4px 16px rgba(10,10,10,0.18)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1f1f1f')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0a0a0a')}
            title="Thêm người mới"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
        </button>
    );
}
