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
                        app_metadata: {},
                        user_metadata: { full_name: data.user.full_name, avatar_url: data.user.avatar_url }
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
            localStorage.setItem('authToken', data.token);
            setToken(data.token);
            setUser({
                id: data.user.id,
                email: data.user.email,
                full_name: data.user.full_name,
                user_metadata: { full_name: data.user.full_name }
            });
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
                user_metadata: { full_name: data.user.full_name, avatar_url: data.user.avatar_url }
            });
            return { error: null };
        } catch (err: any) {
            return { error: err };
        }
    };

    const signInWithOAuth = async (provider: 'google' | 'github') => {
        alert("OAuth is not yet implemented with MySQL backend.");
        return { error: new Error("Not implemented") };
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
