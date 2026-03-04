import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useNavigate, useParams } from 'react-router-dom';

const schema = z.object({
    patrimonio: z.string().min(1, 'Patrimônio é obrigatório.'),
    departamento: z.enum(['G1', 'G2']),
    grupo: z.string().optional(),
    modelo: z.string().optional(),
    md_prev: z.enum(['MD.01', 'MD.02', 'MD.03', 'MD.04', 'INATIVO']),
    intervalo_personalizado: z.string().optional(), // JSON customizado como string para validar
});

type FormInput = z.infer<typeof schema>;

export const FormEquipamento: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormInput>({
        resolver: zodResolver(schema),
        defaultValues: {
            departamento: 'G1',
            md_prev: 'MD.01',
            intervalo_personalizado: '{}'
        }
    });

    useEffect(() => {
        if (isEdit) {
            const fetchEq = async () => {
                const { data } = await supabase.from('patrimonios').select('*').eq('id', id).single();
                if (data) {
                    reset({
                        ...data,
                        intervalo_personalizado: JSON.stringify(data.intervalo_personalizado)
                    });
                }
            };
            fetchEq();
        }
    }, [id, reset, isEdit]);

    const onSubmit = async (form: FormInput) => {
        setErrorMsg(null);
        try {
            let parsedIntervalos = {};
            if (form.intervalo_personalizado) {
                try { parsedIntervalos = JSON.parse(form.intervalo_personalizado); }
                catch { throw new Error('O intervalo personalizado deve ser um JSON válido (Ex: {"Nv.01": 300}).'); }
            }

            const payload = { ...form, intervalo_personalizado: parsedIntervalos };

            if (isEdit) {
                const { error } = await supabase.from('patrimonios').update(payload).eq('id', id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('patrimonios').insert(payload);
                if (error) {
                    if (error.code === '23505') throw new Error('Já existe um equipamento com esse patrimônio.');
                    throw error;
                }
            }

            navigate('/equipamentos');
        } catch (err: unknown) {
            setErrorMsg((err as Error).message || 'Erro ao salvar equipamento.');
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Editar Equipamento' : 'Novo Equipamento'}</h1>

            {errorMsg && <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">{errorMsg}</div>}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">

                <div className="grid grid-cols-2 gap-4">
                    <Input label="Patrimônio" {...register('patrimonio')} error={errors.patrimonio?.message} />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                        <select {...register('departamento')} className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                            <option value="G1">G1</option>
                            <option value="G2">G2</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input label="Grupo" {...register('grupo')} />
                    <Input label="Modelo" {...register('modelo')} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ciclo de Preventiva (MD)</label>
                        <select {...register('md_prev')} className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                            <option value="MD.01">MD.01 (Simples)</option>
                            <option value="MD.02">MD.02 (Binário)</option>
                            <option value="MD.03">MD.03 (Ternário)</option>
                            <option value="MD.04">MD.04 (Quaternário)</option>
                            <option value="INATIVO">INATIVO</option>
                        </select>
                    </div>

                    <Input label="Intervalo Personalizado (JSON)" placeholder='{"Nv.01": 300}' {...register('intervalo_personalizado')} error={errors.intervalo_personalizado?.message} helperText="Deixe em branco {} para usar os intervalos padrão" />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Salvando...' : 'Salvar Equipamento'}
                </Button>
            </form>
        </div>
    );
};
