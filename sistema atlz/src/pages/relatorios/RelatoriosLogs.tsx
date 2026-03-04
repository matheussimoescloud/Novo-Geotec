import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

export const RelatoriosLogs: React.FC = () => {
    const [tab, setTab] = useState<'relatorios' | 'logs'>('relatorios');

    // Logs Query
    const { data: logs, isLoading: logsLoading } = useQuery({
        queryKey: ['logs'],
        queryFn: async () => {
            const { data, error } = await supabase.from('logs_auditoria').select('*').order('timestamp', { ascending: false }).limit(50);
            if (error) throw error;
            return data;
        },
        enabled: tab === 'logs',
    });

    return (
        <div>
            <div className="sm:flex sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold leading-6 text-gray-900">Relatórios e Auditoria</h1>
                    <p className="mt-2 text-sm text-gray-700">Visualize métricas do sistema e histórico de alterações (Logs).</p>
                </div>
            </div>

            <div className="mt-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setTab('relatorios')}
                        className={`${tab === 'relatorios' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Métricas
                    </button>
                    <button
                        onClick={() => setTab('logs')}
                        className={`${tab === 'logs' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Logs de Auditoria
                    </button>
                </nav>
            </div>

            {tab === 'relatorios' && (
                <div className="mt-8">
                    <div className="bg-white p-6 rounded-lg shadow h-96">
                        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Métricas Gráficas</h3>
                        <div className="w-full flex items-center justify-center p-8 text-gray-500">
                            <p>Funcionalidade de Relatórios avançados em construção. Retorne quando houverem mais dados lançados.</p>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'logs' && (
                <div className="mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Data/Hora</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Usuário</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Ação / Tabela</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Registro ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {logsLoading ? <tr><td colSpan={4} className="text-center py-4">Carregando logs...</td></tr> :
                                logs?.map((log) => (
                                    <tr key={log.id}>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900 w-48">
                                            {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            <div>{log.usuario_email}</div>
                                            <div className="text-xs text-gray-400">IP: {log.ip_address}</div>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            <span className="font-semibold text-blue-600">{log.acao}</span> em <span className="text-gray-900">{log.tabela}</span>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-xs font-mono text-gray-500 truncate max-w-xs" title={log.registro_id}>
                                            {log.registro_id}
                                        </td>
                                    </tr>
                                ))}
                            {!logsLoading && logs?.length === 0 && (
                                <tr><td colSpan={4} className="text-center py-8 text-gray-500">Nenhum log de auditoria encontrado.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
