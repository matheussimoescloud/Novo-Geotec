import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { Button } from '../../components/ui/Button';

export const ListagemApontamentos: React.FC = () => {
    const [page, setPage] = useState(1);
    const itemsPerPage = 20;

    const fetchApontamentos = async () => {
        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data, count, error } = await supabase
            .from('apontamentos')
            .select('*, patrimonios(patrimonio, modelo)', { count: 'exact' })
            .order('data_envio', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return { data, count };
    };

    const { data, isLoading, isError } = useQuery({
        queryKey: ['apontamentos', page],
        queryFn: fetchApontamentos,
        staleTime: 1000 * 60 * 5, // 5 min
    });

    return (
        <div>
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold leading-6 text-gray-900">Apontamentos</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Lista de apontamentos diários de horímetro e quilometragem dos equipamentos.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <Link to="/apontamentos/novo">
                        <Button className="flex items-center">
                            <PlusIcon className="h-5 w-5 mr-1" />
                            Novo Apontamento
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Data</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Equipamento</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Operador</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Horímetro/KM</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">C. de Custo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {isLoading ? (
                                        <tr><td colSpan={6} className="text-center py-4">Carregando...</td></tr>
                                    ) : isError ? (
                                        <tr><td colSpan={6} className="text-center py-4 text-red-500">Erro ao carregar dados</td></tr>
                                    ) : data?.data?.map((apontamento) => (
                                        <tr key={apontamento.id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                {format(new Date(apontamento.data_envio), 'dd/MM/yyyy')}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {apontamento.patrimonios?.patrimonio}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{apontamento.operador}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{apontamento.hr_km}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${apontamento.status === 'Operando' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                        apontamento.status === 'Parado' ? 'bg-red-50 text-red-700 ring-red-600/10' :
                                                            apontamento.status === 'Em manutenção' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' :
                                                                'bg-blue-50 text-blue-700 ring-blue-700/10'
                                                    }`}>
                                                    {apontamento.status}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{apontamento.centro_custo}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <Button
                                variant="secondary"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Anterior
                            </Button>
                            <span className="text-sm text-gray-700">Página {page}</span>
                            <Button
                                variant="secondary"
                                onClick={() => setPage(p => p + 1)}
                                disabled={!data?.count || data.count <= page * itemsPerPage}
                            >
                                Próxima
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
