'use client';

interface AddPersonButtonProps {
    onClick: () => void;
}

export default function AddPersonButton({ onClick }: AddPersonButtonProps) {
    return (
        <button
            onClick={onClick}
            className="absolute top-4 left-4 z-10 font-semibold p-3 rounded-[12px] transition-all duration-150 hover:scale-[1.04] flex items-center justify-center"
            style={{ backgroundColor: '#0a0a0a', color: '#ffffff' }}
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
