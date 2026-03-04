import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';

const schema = z.object({
    patrimonio_id: z.string().min(1, 'Selecione um equipamento.'),
    data_envio: z.string().min(1, 'Data é obrigatória.'),
    hr_km: z.number().min(0, 'Deve ser positivo.'),
    status: z.enum(['Operando', 'Parado', 'Em manutenção', 'Liberado']),
    centro_custo: z.string().min(1, 'Centro de custo é obrigatório.'),
    observacao: z.string().optional(),
});

type FormInput = z.infer<typeof schema>;

export const NovoApontamento: React.FC = () => {
    const { profile } = useAuthStore();
    const navigate = useNavigate();
    const [fotos, setFotos] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const { data: equipamentos } = useQuery({
        queryKey: ['equipamentos_ativos'],
        queryFn: async () => {
            const { data, error } = await supabase.from('patrimonios').select('id, patrimonio, modelo').neq('md_prev', 'INATIVO').order('patrimonio');
            if (error) throw error;
            return data;
        }
    });

    const { register, handleSubmit, formState: { errors } } = useForm<FormInput>({
        resolver: zodResolver(schema),
        defaultValues: {
            data_envio: new Date().toISOString().split('T')[0],
            status: 'Operando'
        }
    });

    const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const novasFotos = Array.from(e.target.files);
            if (fotos.length + novasFotos.length > 5) {
                alert('Máximo de 5 fotos permitido.');
                return;
            }
            setFotos((prev) => [...prev, ...novasFotos]);
        }
    };

    const uploadImagesToStorage = async (): Promise<string[]> => {
        const urls: string[] = [];
        for (const file of fotos) {
            const compressedFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920 });
            const filename = `${Date.now()}_${compressedFile.name}`;

            const { error } = await supabase.storage.from('fotos_apontamentos').upload(filename, compressedFile);
            if (error) throw error;

            const { data: publicUrlData } = supabase.storage.from('fotos_apontamentos').getPublicUrl(filename);
            urls.push(publicUrlData.publicUrl);
        }
        return urls;
    };

    const onSubmit = async (data: FormInput) => {
        if (fotos.length === 0) {
            setErrorMsg('Pelo menos 1 foto é obrigatória (máx 5).');
            return;
        }
        setIsUploading(true);
        setErrorMsg(null);
        try {
            // 1. Upload Fotos
            const fotoUrls = await uploadImagesToStorage();

            // 2. Insert Apontamento
            const { error } = await supabase.from('apontamentos').insert({
                ...data,
                operador: profile?.nome || 'Operador',
                fotos: fotoUrls
            });

            if (error) {
                if (error.code === '23505') setErrorMsg('Já existe um apontamento para este equipamento hoje.');
                else setErrorMsg('Erro ao salvar apontamento.');
                return;
            }

            navigate('/apontamentos');
        } catch {
            setErrorMsg('Erro no processo. Tente novamente.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Novo Apontamento</h1>

            {errorMsg && <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">{errorMsg}</div>}

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
                    <Input label="Data" type="date" {...register('data_envio')} error={errors.data_envio?.message} />
                    <Input label="Horímetro / KM" type="number" step="0.01" {...register('hr_km', { valueAsNumber: true })} error={errors.hr_km?.message} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select {...register('status')} className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                            <option value="Operando">Operando</option>
                            <option value="Parado">Parado</option>
                            <option value="Em manutenção">Em manutenção</option>
                            <option value="Liberado">Liberado</option>
                        </select>
                    </div>
                    <Input label="Centro de Custo" {...register('centro_custo')} error={errors.centro_custo?.message} />
                </div>

                <Input label="Observações (Opcional)" {...register('observacao')} />

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fotos (Mínimo 1, Máx 5)</label>
                    <input type="file" multiple accept="image/jpeg, image/png, image/webp" onChange={handleFotoUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    {fotos.length > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                            {fotos.length} fotos selecionadas.
                            <button type="button" onClick={() => setFotos([])} className="ml-2 text-red-500">Limpar</button>
                        </div>
                    )}
                </div>

                <Button type="submit" disabled={isUploading} className="w-full">
                    {isUploading ? 'Salvando Apontamento...' : 'Salvar Apontamento'}
                </Button>
            </form>
        </div>
    );
};
