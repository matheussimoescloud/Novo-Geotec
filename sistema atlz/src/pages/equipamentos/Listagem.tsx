import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { PlusIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';

export const ListagemEquipamentos: React.FC = () => {
    const [busca, setBusca] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['patrimonios', busca],
        queryFn: async () => {
            let q = supabase.from('patrimonios').select('*').order('patrimonio');
            if (busca) {
                q = q.ilike('patrimonio', `%${busca}%`);
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
                    <h1 className="text-2xl font-semibold leading-6 text-gray-900">Equipamentos</h1>
                    <p className="mt-2 text-sm text-gray-700">Gestão do cadastro e planos de preventivas dos patrimônios.</p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 flex space-x-3">
                    <input
                        type="text"
                        placeholder="Buscar patrimônio..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="flex h-10 w-full sm:w-64 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Link to="/equipamentos/novo">
                        <Button className="flex items-center">
                            <PlusIcon className="h-5 w-5 mr-1" />
                            Novo Equipamento
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Patrimônio</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Depto / Grupo</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Modelo</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Plano (Ciclo)</th>
                            <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {isLoading ? <tr><td colSpan={5} className="text-center py-4">Carregando...</td></tr> :
                            data?.map((eq) => (
                                <tr key={eq.id}>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{eq.patrimonio}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        <span className="font-semibold">{eq.departamento}</span> - {eq.grupo || 'N/A'}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{eq.modelo}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${eq.md_prev === 'INATIVO' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {eq.md_prev}
                                        </span>
                                    </td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                        <Link to={`/equipamentos/${eq.id}/editar`} className="text-blue-600 hover:text-blue-900">
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
