'use client';

interface AddPersonButtonProps {
    onClick: () => void;
}

export default function AddPersonButton({ onClick }: AddPersonButtonProps) {
    return (
        <button
            onClick={onClick}
            className="absolute top-4 left-4 z-10 bg-blue-500 hover:bg-blue-600 text-white font-bold p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
            title="Thêm người mới"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
        </button>
    );
}
