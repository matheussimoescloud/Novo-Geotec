import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
    HomeIcon,
    WrenchScrewdriverIcon,
    ClipboardDocumentCheckIcon,
    ArchiveBoxIcon,
    UsersIcon,
    ChartBarIcon,
} from '@heroicons/react/24/outline';

const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, adminOnly: true },
    { name: 'Apontamentos', href: '/apontamentos', icon: ClipboardDocumentCheckIcon, adminOnly: false },
    { name: 'Preventivas', href: '/preventivas', icon: WrenchScrewdriverIcon, adminOnly: true },
    { name: 'Equipamentos', href: '/equipamentos', icon: ArchiveBoxIcon, adminOnly: true },
    { name: 'Relatórios', href: '/relatorios', icon: ChartBarIcon, adminOnly: true },
    { name: 'Usuários', href: '/usuarios', icon: UsersIcon, adminOnly: true },
];

export const Sidebar: React.FC = () => {
    const { profile } = useAuthStore();
    const isAdmin = profile?.tipo === 'ADM';

    return (
        <div className="flex flex-col w-64 bg-gray-900 border-r border-gray-800 h-screen">
            <div className="flex h-16 items-center px-6">
                <h1 className="text-xl font-bold tracking-tight text-white">SG<span className="text-blue-500">PREV</span></h1>
            </div>
            <div className="flex-1 overflow-y-auto mt-6">
                <nav className="flex-1 space-y-1 px-4">
                    {menuItems.map((item) => {
                        if (item.adminOnly && !isAdmin) return null;
                        return (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                className={({ isActive }) =>
                                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive
                                        ? 'bg-gray-800 text-white'
                                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                    }`
                                }
                            >
                                <item.icon
                                    className="mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-300"
                                    aria-hidden="true"
                                />
                                {item.name}
                            </NavLink>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
};
