import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { authApi } from '@/services/authApi';

// Define our own User type compatible with UI usage
interface User {
    id: string;
    email: string;
    app_metadata?: any;
    user_metadata?: any;
    aud?: string;
    created_at?: string;
    full_name?: string;
    avatar_url?: string;
    cover_url?: string;
    github_link?: string;
    linkedin_link?: string;
}

interface AuthContextType {
    user: User | null;
    session: any | null; // JWT Token basically
    loading: boolean;
    signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signInWithOAuth: (provider: 'google' | 'github') => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const data = await authApi.getMe(token);
                    setUser({
                        id: data.user.id,
                        email: data.user.email,
                        full_name: data.user.full_name,
                        avatar_url: data.user.avatar_url,
                        cover_url: data.user.cover_url,
                        github_link: data.user.github_link,
                        linkedin_link: data.user.linkedin_link,
                        app_metadata: {},
                        user_metadata: {
                            full_name: data.user.full_name,
                            avatar_url: data.user.avatar_url,
                            cover_url: data.user.cover_url,
                            github_link: data.user.github_link,
                            linkedin_link: data.user.linkedin_link
                        }
                    });
                } catch (err) {
                    console.error("Session expired", err);
                    localStorage.removeItem('authToken');
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };
        initAuth();
    }, [token]);

    const signUp = async (email: string, password: string, fullName?: string) => {
        try {
            const data = await authApi.register(email, password, fullName);
            // If the backend returns a token, log them in (legacy behavior or if we turn off verification)
            if (data.token && data.user) {
                localStorage.setItem('authToken', data.token);
                setToken(data.token);
                setUser({
                    id: data.user.id,
                    email: data.user.email,
                    full_name: data.user.full_name,
                    // Register might not return all profile fields immediately, but often minimal
                    user_metadata: { full_name: data.user.full_name }
                });
            }
            // If no token, it means verification is required. Return success but don't set session.
            return { error: null };
        } catch (err: any) {
            return { error: err };
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            const data = await authApi.login(email, password);
            localStorage.setItem('authToken', data.token);
            setToken(data.token);
            setUser({
                id: data.user.id,
                email: data.user.email,
                full_name: data.user.full_name,
                avatar_url: data.user.avatar_url,
                cover_url: data.user.cover_url,
                github_link: data.user.github_link,
                linkedin_link: data.user.linkedin_link,
                user_metadata: {
                    full_name: data.user.full_name,
                    avatar_url: data.user.avatar_url,
                    cover_url: data.user.cover_url,
                    github_link: data.user.github_link,
                    linkedin_link: data.user.linkedin_link
                }
            });
            return { error: null };
        } catch (err: any) {
            return { error: err };
        }
    };

    const signInWithOAuth = async (provider: 'google' | 'github') => {
        // Redirect to backend OAuth endpoint
        window.location.href = `${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/auth/${provider}`;
        // The effective return happens via redirect, so this promise never really resolves in the current page context
        return { error: null };
    };

    const signOut = async () => {
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, session: token ? { access_token: token } : null, loading, signUp, signIn, signInWithOAuth, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
