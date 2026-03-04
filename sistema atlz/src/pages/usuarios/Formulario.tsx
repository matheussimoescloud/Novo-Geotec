import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useNavigate, useParams } from 'react-router-dom';

const schema = z.object({
    nome: z.string().min(1, 'Nome é obrigatório.'),
    tipo: z.enum(['ADM', 'OPERADOR']),
    ativo: z.boolean(),
});

type FormInput = z.infer<typeof schema>;

export const EditUsuario: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [email, setEmail] = useState('');

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormInput>({
        resolver: zodResolver(schema),
        defaultValues: {
            tipo: 'OPERADOR',
            ativo: true
        }
    });

    useEffect(() => {
        const fetchUser = async () => {
            const { data } = await supabase.from('perfis_usuarios').select('*').eq('id', id).single();
            if (data) {
                setEmail(data.email);
                reset({
                    nome: data.nome,
                    tipo: data.tipo,
                    ativo: data.ativo
                });
            }
        };
        fetchUser();
    }, [id, reset]);

    const onSubmit = async (form: FormInput) => {
        setErrorMsg(null);
        try {
            if (form.tipo !== 'ADM' || !form.ativo) {
                // Auto-check: não pode desativar ou rebaixar a si mesmo se for o único adm (simplificado: não deixar rebaixar o atual usuário)
                const { data: { user } } = await supabase.auth.getUser();
                if (user && user.id === id) {
                    throw new Error("Você não pode desativar nem remover os privilégios de administrador da sua própria conta.");
                }
            }

            const { error: _err } = await supabase.from('perfis_usuarios').update(form).eq('id', id);
            if (_err) throw _err;

            navigate('/usuarios');
        } catch (err: unknown) {
            setErrorMsg((err as Error).message || 'Erro ao alterar perfil de usuário.');
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Editar Usuário</h1>

            {errorMsg && <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">{errorMsg}</div>}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">

                <Input label="E-mail (Não Editável)" value={email} disabled className="bg-gray-100" />

                <Input label="Nome Completo" {...register('nome')} error={errors.nome?.message} />

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Acesso</label>
                        <select {...register('tipo')} className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                            <option value="OPERADOR">Operador</option>
                            <option value="ADM">Administrador</option>
                        </select>
                    </div>

                    <div className="flex items-center pt-6">
                        <input type="checkbox" id="ativo" {...register('ativo')} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                        <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">
                            Usuário Ativo no Sistema
                        </label>
                    </div>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Salvando...' : 'Salvar Usuário'}
                </Button>
            </form>
        </div>
    );
};
