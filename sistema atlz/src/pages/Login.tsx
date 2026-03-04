import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ExclamationCircleIcon } from '@heroicons/react/24/solid';

const loginSchema = z.object({
    email: z.string().email('Digite um e-mail válido.'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

type LoginFormInput = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
    const { setUser, user } = useAuthStore();
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const navigate = useNavigate();

    // Se já estiver logado, redirecionar imediatamente
    useEffect(() => {
        if (user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormInput>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormInput) => {
        setErrorMsg(null);
        try {
            const { data: authData, error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (error) {
                if (error.message.includes('Invalid login credentials')) {
                    setErrorMsg('E-mail ou senha incorretos.');
                } else if (error.message.includes('Email not confirmed')) {
                    setErrorMsg('E-mail não confirmado. Verifique sua caixa de entrada.');
                } else {
                    setErrorMsg('Ocorreu um erro ao tentar fazer login. Tente novamente.');
                }
                return;
            }

            if (authData.user) {
                // Verificar se o usuário está ativo (ignorar erros técnicos de RLS/rede)
                const { data: profileData, error: profileError } = await supabase
                    .from('perfis_usuarios')
                    .select('ativo')
                    .eq('id', authData.user.id)
                    .single();

                // Só bloqueia se explicitamente ativo === false
                if (!profileError && profileData && profileData.ativo === false) {
                    await supabase.auth.signOut();
                    setErrorMsg('Usuário inativo. Contate o administrador.');
                    return;
                }

                // Atualiza store e redireciona explicitamente
                setUser(authData.user);
                navigate('/dashboard', { replace: true });
            }

        } catch {
            setErrorMsg('Erro de conexão ao servidor.');
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 sm:p-10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">SG<span className="text-blue-600">PREV</span></h1>
                    <p className="text-gray-500 mt-2 text-sm">Sistema de Gestão de Manutenções Preventivas</p>
                </div>

                {errorMsg && (
                    <div className="mb-6 bg-red-50 p-4 rounded-md flex items-start">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                        <p className="text-sm text-red-700 font-medium">{errorMsg}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <Input
                        label="E-mail"
                        type="email"
                        placeholder="seu@email.com"
                        {...register('email')}
                        error={errors.email?.message}
                    />

                    <Input
                        label="Senha"
                        type="password"
                        placeholder="••••••••"
                        {...register('password')}
                        error={errors.password?.message}
                    />

                    <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                        {isSubmitting ? 'Entrando...' : 'Entrar no Sistema'}
                    </Button>
                </form>

                <div className="mt-8 text-center text-xs text-gray-400">
                    Acesso restrito a funcionários autorizados.
                </div>
            </div>
        </div>
    );
};
