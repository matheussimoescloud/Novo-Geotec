import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const Layout: React.FC = () => {
    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <Topbar />
                <main className="flex-1 overflow-y-auto relative no-scrollbar focus:outline-none">
                    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto h-full w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
