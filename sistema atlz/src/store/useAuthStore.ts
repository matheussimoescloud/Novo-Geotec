import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    profile: Record<string, unknown> | null;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setProfile: (profile: Record<string, unknown> | null) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    profile: null,
    isLoading: true,
    setUser: (user) => set({ user }),
    setProfile: (profile) => set({ profile }),
    setLoading: (isLoading) => set({ isLoading }),
    logout: () => set({ user: null, profile: null }),
}));
