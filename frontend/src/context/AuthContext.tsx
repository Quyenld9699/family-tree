'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import authService, { User } from '../services/authService';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    loginGuest: (code: string) => Promise<void>;
    logout: () => void;
    isAdmin: boolean;
    isGuest: boolean;
    isEditor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        setLoading(false);
    }, []);

    // Removed automatic redirect to login
    // useEffect(() => {
    //     if (!loading) {
    //         const publicPaths = ['/login', '/guest-login'];
    //         if (!user && !publicPaths.includes(pathname)) {
    //             router.push('/login');
    //         }
    //     }
    // }, [user, loading, pathname, router]);

    const login = async (username: string, password: string) => {
        await authService.login(username, password);
        setUser(authService.getCurrentUser());
        router.push('/');
    };

    const loginGuest = async (code: string) => {
        await authService.loginGuest(code);
        setUser(authService.getCurrentUser());
        router.push('/');
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                loginGuest,
                logout,
                isAdmin: user?.role === 'admin',
                isGuest: user?.role === 'guest',
                isEditor: user?.role === 'editor',
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
