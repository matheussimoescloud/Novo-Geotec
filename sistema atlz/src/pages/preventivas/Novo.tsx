import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useNavigate } from 'react-router-dom';

const schema = z.object({
    patrimonio_id: z.string().min(1, 'Selecione um equipamento.'),
    departamento: z.enum(['G1', 'G2']),
    tipo_prev: z.enum(['Nv.01', 'Nv.02', 'Nv.03', 'Nv.04']),
    data_realizacao: z.string().min(1, 'Data é obrigatória.'),
    hr_km: z.number().min(0, 'Deve ser positivo.'),
    cod: z.enum(['INC', 'NRM']),
});

type FormInput = z.infer<typeof schema>;

export const NovaPreventiva: React.FC = () => {
    const navigate = useNavigate();
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [infoMsg, setInfoMsg] = useState<string | null>(null);

    const { data: equipamentos } = useQuery({
        queryKey: ['equipamentos_prev'],
        queryFn: async () => {
            const { data, error } = await supabase.from('patrimonios').select('id, patrimonio, modelo, departamento, grupo, md_prev').neq('md_prev', 'INATIVO').order('patrimonio');
            if (error) throw error;
            return data;
        }
    });

    const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormInput>({
        resolver: zodResolver(schema),
        defaultValues: {
            data_realizacao: new Date().toISOString().split('T')[0],
            cod: 'NRM'
        }
    });

    const selectedPatrimonioId = watch('patrimonio_id');

    // Lógica Inteligente para sugerir a próxima preventiva
    React.useEffect(() => {
        if (!selectedPatrimonioId || !equipamentos) return;

        const equipamento = equipamentos.find(eq => eq.id === selectedPatrimonioId);
        if (!equipamento) return;

        setValue('departamento', equipamento.departamento as 'G1' | 'G2');

        const buscarUltimaEPlanejar = async () => {
            const { data: ultimas } = await supabase
                .from('preventivas')
                .select('tipo_prev, hr_km')
                .eq('patrimonio_id', selectedPatrimonioId)
                .order('data_realizacao', { ascending: false })
                .limit(1);

            const uPrev = ultimas && ultimas.length > 0 ? ultimas[0] : null;

            const { data: proxNivelStr } = await supabase.rpc('calcular_proximo_nivel', {
                p_md_prev: equipamento.md_prev,
                p_ultimo_tipo: uPrev?.tipo_prev || 'Nv.01' // Assumindo primeira se não existir
            });

            if (proxNivelStr) {
                setValue('tipo_prev', proxNivelStr as 'Nv.01' | 'Nv.02' | 'Nv.03' | 'Nv.04');
                setInfoMsg(`O ciclo atual deste equipamento é ${equipamento.md_prev}. A próxima preventiva esperada é ${proxNivelStr}.`);
            }
        };

        buscarUltimaEPlanejar();
    }, [selectedPatrimonioId, equipamentos, setValue]);

    const onSubmit = async (data: FormInput) => {
        setErrorMsg(null);
        try {
            // Pega dados adicionais do equipamento
            const eq = equipamentos?.find(e => e.id === data.patrimonio_id);

            const { error } = await supabase.from('preventivas').insert({
                ...data,
                grupo: eq?.grupo
            });

            if (error) throw error;
            navigate('/preventivas');
        } catch (err: unknown) {
            setErrorMsg((err as Error).message || 'Erro ao salvar preventiva.');
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Nova Preventiva</h1>

            {errorMsg && <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">{errorMsg}</div>}
            {infoMsg && <div className="mb-4 bg-blue-50 text-blue-700 p-3 rounded text-sm border border-blue-200">{infoMsg}</div>}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Equipamento</label>
                    <select {...register('patrimonio_id')} className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Selecione...</option>
                        {equipamentos?.map(eq => (
                            <option key={eq.id} value={eq.id}>{eq.patrimonio} - {eq.modelo}</option>
                        ))}
                    </select>
                    {errors.patrimonio_id && <p className="text-red-500 text-sm mt-1">{errors.patrimonio_id.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Preventiva</label>
                        <select {...register('tipo_prev')} className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                            <option value="Nv.01">Nível 01</option>
                            <option value="Nv.02">Nível 02</option>
                            <option value="Nv.03">Nível 03</option>
                            <option value="Nv.04">Nível 04</option>
                        </select>
                        {errors.tipo_prev && <p className="text-red-500 text-sm mt-1">{errors.tipo_prev.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                        <select {...register('cod')} className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                            <option value="NRM">Normal (NRM)</option>
                            <option value="INC">Início de Ciclo (INC)</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input label="Data da Realização" type="date" {...register('data_realizacao')} error={errors.data_realizacao?.message} />
                    <Input label="Horímetro / KM da Revisão" type="number" step="0.01" {...register('hr_km', { valueAsNumber: true })} error={errors.hr_km?.message} />
                </div>

                <input type="hidden" {...register('departamento')} />

                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Salvando...' : 'Salvar Preventiva'}
                </Button>
            </form>
        </div>
    );
};
