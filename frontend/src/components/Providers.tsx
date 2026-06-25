'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        refetchOnWindowFocus: false,
                    },
                },
            }),
    );

    // ToastContainer được render ở app/layout.tsx (một chỗ duy nhất) để tránh toast lặp.
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
