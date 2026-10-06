import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const loadProfile = async (userId) => {
    if (!supabase || !userId) {
      setProfile(null);
      return null;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, establishment_id, full_name, role, photo_url, commission, active')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Erro ao carregar perfil:', error);
    }
    setProfile(data || null);
    return data;
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mounted) return;
      setSession(currentSession);
      if (currentSession?.user) {
        loadProfile(currentSession.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      if (newSession?.user) {
        loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setAuthError('');
    if (!supabase) {
      const err = 'Supabase não está configurado.';
      setAuthError(err);
      return { success: false, error: err };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });
    if (error || !data.user) {
      const err = error?.message || 'E-mail ou senha inválidos.';
      setAuthError(err);
      return { success: false, error: err };
    }
    const userProfile = await loadProfile(data.user.id);
    return { success: true, user: data.user, profile: userProfile };
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setProfile(null);
  };

  const changePassword = async (currentPassword, newPassword) => {
    if (!supabase) return { success: false, error: 'Supabase não configurado.' };
    if (!session?.user?.email) return { success: false, error: 'Nenhuma sessão ativa.' };
    if (newPassword.length < 6) return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: currentPassword
    });
    if (verifyError) {
      return { success: false, error: 'A senha atual está incorreta.' };
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      return { success: false, error: updateError.message || 'Erro ao atualizar senha.' };
    }

    return { success: true };
  };

  const isPlatformAdmin = profile?.role === 'platform_admin';
  const isEstablishmentAdmin = profile?.role === 'establishment_admin';
  const isBarber = profile?.role === 'professional';
  const isAuthenticated = Boolean(session?.user);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null,
        profile,
        loading,
        authError,
        isConfigured: isSupabaseConfigured,
        isAuthenticated,
        isPlatformAdmin,
        isEstablishmentAdmin,
        isBarber,
        adminRole: isBarber ? 'barber' : 'admin',
        establishmentId: profile?.establishment_id || null,
        login,
        logout,
        changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
