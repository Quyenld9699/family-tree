import React from 'react';

interface LoadingOverlayProps {
    isLoading: boolean;
    message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, message = 'Đang tải dữ liệu gia phả...' }) => {
    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75">
            <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
                <p className="mt-4 text-lg font-semibold text-gray-700">{message}</p>
            </div>
        </div>
    );
};

export default LoadingOverlay;
