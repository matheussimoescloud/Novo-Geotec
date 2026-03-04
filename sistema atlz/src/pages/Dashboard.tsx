import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExclamationTriangleIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
    const [filterStatus, setFilterStatus] = useState<string>('ALL');

    const { data: dashboardData, isLoading, isError } = useQuery({
        queryKey: ['dashboard_data'],
        queryFn: async () => {
            const { data, error } = await supabase.from('vw_dashboard_completo').select('*');
            if (error) {
                console.warn('Dashboard view error:', error.message);
                return []; // Retorna vazio em vez de travar
            }
            return data ?? [];
        },
        refetchInterval: 30000,
        retry: false,
    });

    // Estatísticas do topo
    const stats = React.useMemo(() => {
        if (!dashboardData) return { total: 0, alert: 0, expired: 0, ok: 0 };
        return {
            total: dashboardData.length,
            alert: dashboardData.filter(d => d.status === 'ALERTA').length,
            expired: dashboardData.filter(d => d.status === 'VENCIDA').length,
            ok: dashboardData.filter(d => d.status === 'OK').length,
        };
    }, [dashboardData]);

    const filteredData = React.useMemo(() => {
        if (!dashboardData) return [];
        if (filterStatus === 'ALL') return dashboardData;
        if (filterStatus === 'CRITICAL') return dashboardData.filter(d => ['ALERTA', 'VENCIDA'].includes(d.status));
        return dashboardData.filter(d => d.status === filterStatus);
    }, [dashboardData, filterStatus]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OK': return 'text-green-600 bg-green-50 ring-green-500/20';
            case 'ALERTA': return 'text-yellow-600 bg-yellow-50 ring-yellow-500/20';
            case 'VENCIDA': return 'text-red-600 bg-red-50 ring-red-500/20';
            case 'INATIVO': return 'text-gray-600 bg-gray-50 ring-gray-500/20';
            default: return 'text-blue-600 bg-blue-50 ring-blue-500/20';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'OK': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
            case 'ALERTA': return <ClockIcon className="w-5 h-5 text-yellow-500" />;
            case 'VENCIDA': return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
            default: return <CheckCircleIcon className="w-5 h-5 text-gray-400" />;
        }
    };

    if (isLoading) {
        return <div className="text-center py-10">Carregando métricas...</div>;
    }

    if (isError) {
        return (
            <div className="rounded-md bg-yellow-50 p-6 text-center">
                <h2 className="text-lg font-semibold text-yellow-800">Setup do banco necessário</h2>
                <p className="mt-2 text-sm text-yellow-700">A view <code>vw_dashboard_completo</code> ainda não foi criada no Supabase. O sistema está funcionando, mas o dashboard precisa ser configurado no banco de dados.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:tracking-tight">SGPREV Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-500">Visão em tempo real da saúde dos equipamentos ({format(new Date(), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })})</p>
                </div>
                <div className="flex gap-2">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
                    >
                        <option value="ALL">Todos os Equipamentos</option>
                        <option value="CRITICAL">Apenas Críticos (Alerta/Vencido)</option>
                        <option value="OK">Apenas OK</option>
                    </select>
                </div>
            </div>

            {/* Cards KPI */}
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 cursor-pointer border-l-4 border-gray-400" onClick={() => setFilterStatus('ALL')}>
                    <dt className="truncate text-sm font-medium text-gray-500">Total Equipamentos</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stats.total}</dd>
                </div>
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 cursor-pointer border-l-4 border-red-500" onClick={() => setFilterStatus('VENCIDA')}>
                    <dt className="truncate text-sm font-medium text-gray-500">Preventivas Vencidas</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-red-600">{stats.expired}</dd>
                </div>
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 cursor-pointer border-l-4 border-yellow-500" onClick={() => setFilterStatus('ALERTA')}>
                    <dt className="truncate text-sm font-medium text-gray-500">Em Alerta (&lt; 100 hrs)</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-yellow-600">{stats.alert}</dd>
                </div>
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 cursor-pointer border-l-4 border-green-500" onClick={() => setFilterStatus('OK')}>
                    <dt className="truncate text-sm font-medium text-gray-500">Operando Normal</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-green-600">{stats.ok}</dd>
                </div>
            </dl>

            {/* Grid de Equipamentos */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-12">
                {filteredData?.map((item) => (
                    <div key={item.patrimonio_id} className="relative flex flex-col overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5 transition hover:shadow-md">
                        <div className="p-5 flex-1">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    {getStatusIcon(item.status)}
                                    <h3 className="text-lg font-bold text-gray-900">{item.patrimonio}</h3>
                                </div>
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(item.status)}`}>
                                    {item.status}
                                </span>
                            </div>

                            <dl className="mt-1 flex flex-col justify-between text-sm text-gray-500 space-y-2">
                                <div className="flex justify-between">
                                    <dt>Modelo</dt><dd className="font-medium text-gray-900">{item.modelo}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt>Próx. Nível</dt><dd className="font-medium text-blue-600">{item.proximo_nivel}</dd>
                                </div>
                                <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                                    <dt>Último Apont.</dt><dd className="font-medium">{item.data_ultimo_apontamento ? format(new Date(item.data_ultimo_apontamento), 'dd/MM') : 'N/A'}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt>KM Atual</dt><dd className="font-bold text-gray-900">{item.ultimo_km ?? 'N/A'}</dd>
                                </div>
                            </dl>

                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex justify-between text-xs font-medium mb-1">
                                    <span className="text-gray-500">Horas Restantes</span>
                                    <span className={item.horas_restantes <= 0 ? 'text-red-600 font-bold' : item.horas_restantes < 100 ? 'text-yellow-600 font-bold' : 'text-green-600'}>
                                        {item.horas_restantes != null ? Math.round(item.horas_restantes) : '--'} / {item.intervalo_aplicado || '--'}
                                    </span>
                                </div>
                                {item.intervalo_aplicado ? (
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${item.horas_restantes <= 0 ? 'bg-red-500' : item.horas_restantes < 100 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                            style={{
                                                width: `${Math.max(0, Math.min(100, 100 - ((item.horas_restantes / item.intervalo_aplicado) * 100)))}%`
                                            }}
                                        ></div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                ))}
                {filteredData.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500">Nenhum equipamento encontrado para este filtro.</div>
                )}
            </div>
        </div>
    );
};

export { Dashboard };
