import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export const Topbar: React.FC = () => {
    const { profile, logout } = useAuthStore();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        logout();
    };

    return (
        <div className="flex h-16 items-center flex-shrink-0 bg-white shadow-sm px-6 justify-between z-10">
            <div className="flex items-center">
                <span className="text-gray-600 font-medium">Painel de Manutenções</span>
            </div>
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <UserCircleIcon className="w-8 h-8 text-gray-400" />
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-900 leading-none">{profile?.nome || 'Usuário'}</span>
                        <span className="text-xs text-blue-600 mt-1">{profile?.tipo === 'ADM' ? 'Administrador' : 'Operador'}</span>
                    </div>
                </div>
                <div className="h-6 w-px bg-gray-200" />
                <button
                    onClick={handleLogout}
                    className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowRightOnRectangleIcon className="w-5 h-5 mr-1" />
                    Sair
                </button>
            </div>
        </div>
    );
};
