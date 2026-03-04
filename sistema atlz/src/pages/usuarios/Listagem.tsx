import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

export const ListagemUsuarios: React.FC = () => {
    const [busca, setBusca] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['usuarios', busca],
        queryFn: async () => {
            let q = supabase.from('perfis_usuarios').select('*').order('nome');
            if (busca) {
                q = q.or(`nome.ilike.%${busca}%,email.ilike.%${busca}%`);
            }
            const { data, error } = await q;
            if (error) throw error;
            return data;
        },
    });

    return (
        <div>
            <div className="sm:flex sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold leading-6 text-gray-900">Usuários do Sistema</h1>
                    <p className="mt-2 text-sm text-gray-700">Gestão de perfis e acessos administrativos ou de operadores.</p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 flex space-x-3">
                    <input
                        type="text"
                        placeholder="Buscar usuário..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="flex h-10 w-full sm:w-64 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Nome</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Perfil</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                            <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {isLoading ? <tr><td colSpan={5} className="text-center py-4">Carregando...</td></tr> :
                            data?.map((user) => (
                                <tr key={user.id}>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{user.nome}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.email}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${user.tipo === 'ADM' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                            {user.tipo}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${user.ativo ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.ativo ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                        <Link to={`/usuarios/${user.id}/editar`} className="text-blue-600 hover:text-blue-900">
                                            <PencilSquareIcon className="h-5 w-5 inline" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
