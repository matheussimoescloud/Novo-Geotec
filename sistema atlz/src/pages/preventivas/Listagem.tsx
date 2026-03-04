import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { Button } from '../../components/ui/Button';

export const ListagemPreventivas: React.FC = () => {
    const [page, setPage] = useState(1);
    const itemsPerPage = 20;

    const fetchPreventivas = async () => {
        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data, count, error } = await supabase
            .from('preventivas')
            .select('*, patrimonios(patrimonio, modelo)', { count: 'exact' })
            .order('data_realizacao', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return { data, count };
    };

    const { data, isLoading } = useQuery({
        queryKey: ['preventivas', page],
        queryFn: fetchPreventivas,
    });

    return (
        <div>
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold leading-6 text-gray-900">Manutenções Preventivas</h1>
                    <p className="mt-2 text-sm text-gray-700">Histórico de todas as preventivas realizadas.</p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <Link to="/preventivas/novo">
                        <Button className="flex items-center">
                            <PlusIcon className="h-5 w-5 mr-1" />
                            Nova Preventiva
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Data</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Equipamento</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tipo</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Horímetro/KM</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">COD</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {isLoading ? <tr><td colSpan={5} className="text-center py-4">Carregando...</td></tr> :
                            data?.data?.map((prev) => (
                                <tr key={prev.id}>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{format(new Date(prev.data_realizacao), 'dd/MM/yyyy')}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{prev.patrimonios?.patrimonio}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">{prev.tipo_prev}</span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{prev.hr_km}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{prev.cod}</td>
                                </tr>
                            ))}
                    </tbody>
                </table>

                <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
                    <Button variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
                    <span className="text-sm text-gray-700">Página {page}</span>
                    <Button variant="secondary" onClick={() => setPage(p => p + 1)} disabled={!data?.count || data.count <= page * itemsPerPage}>Próxima</Button>
                </div>
            </div>
        </div>
    );
};
