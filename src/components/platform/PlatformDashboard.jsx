import React, { useState, useEffect } from 'react';
import { Building2, Power, AlertCircle, Key, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

export default function PlatformDashboard() {
  const { isPlatformAdmin, login, changePassword } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const [barbershops, setBarbershops] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  // Load barbershops
  useEffect(() => {
    if (!supabase || !isPlatformAdmin) return;
    let mounted = true;

    const loadData = async () => {
      setDataLoading(true);
      const { data, error } = await supabase
        .from('establishments')
        .select('id, name, slug, service_enabled, updated_at')
        .order('name');

      if (mounted && data) {
        setBarbershops(data.map(shop => ({
          id: shop.id,
          name: shop.name,
          slug: shop.slug || '',
          plan: 'Plano Pro',
          owner: 'Administrador',
          status: shop.service_enabled ? 'ativo' : 'suspenso'
        })));
      }
      if (mounted) setDataLoading(false);
    };

    loadData();

    return () => { mounted = false; };
  }, [isPlatformAdmin]);

  const handlePlatformLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    const res = await login(username, password);
    setLoading(false);

    if (!res.success) {
      setLoginError(res.error || 'Credenciais inválidas.');
      return;
    }

    if (res.profile?.role !== 'platform_admin') {
      setLoginError('Esta conta não possui privilégios de administrador da plataforma.');
    }
  };

  const toggleBarbershopAccess = async (shopId) => {
    const current = barbershops.find(s => s.id === shopId);
    if (!current) return;
    const nextStatus = current.status === 'ativo' ? 'suspenso' : 'ativo';
    const serviceEnabled = nextStatus === 'ativo';

    if (supabase) {
      const { error } = await supabase
        .from('establishments')
        .update({ service_enabled: serviceEnabled })
        .eq('id', shopId);

      if (error) {
        alert('Erro ao atualizar status da barbearia.');
        return;
      }
    }

    setBarbershops(prev => prev.map(s => s.id === shopId ? { ...s, status: nextStatus } : s));
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    const res = await changePassword(currentPassword, newPassword);
    if (!res.success) {
      setPasswordMessage(res.error || 'Erro ao alterar senha.');
      return;
    }
    setPasswordMessage('Senha master atualizada com sucesso!');
    setCurrentPassword('');
    setNewPassword('');
    setTimeout(() => {
      setChangePasswordOpen(false);
      setPasswordMessage('');
    }, 2500);
  };

  if (!isPlatformAdmin) {
    return (
      <div className="max-w-md mx-auto mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-white">Painel da Plataforma</h2>
          <p className="text-sm text-zinc-400 mt-1">Acesso exclusivo do gestor SaaS do sistema.</p>
        </div>

        <form onSubmit={handlePlatformLogin} className="space-y-4">
          <input
            type="email"
            required
            value={username}
            onChange={e => { setUsername(e.target.value); setLoginError(''); }}
            placeholder="E-mail do administrador master"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-amber-500"
          />
          <input
            type="password"
            required
            value={password}
            onChange={e => { setPassword(e.target.value); setLoginError(''); }}
            placeholder="Senha"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-amber-500"
          />

          {loginError && (
            <p className="text-sm text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {loginError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold py-3 rounded-lg text-sm transition"
          >
            {loading ? 'Entrando...' : 'Entrar na Plataforma'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-2xl font-bold text-white">Minha Plataforma (SaaS Master)</h2>
          <p className="text-sm text-zinc-400 mt-1">Controle de barbearias clientes, assinaturas e status de acesso.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setChangePasswordOpen(prev => !prev); setPasswordMessage(''); }}
            className="text-xs text-zinc-400 hover:text-amber-400 flex items-center gap-1.5 transition"
          >
            <Key className="w-3.5 h-3.5" /> Alterar Senha Master
          </button>
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1.5">
            Administrador Master
          </span>
        </div>
      </div>

      {changePasswordOpen && (
        <form
          onSubmit={handleChangePasswordSubmit}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 max-w-md ml-auto space-y-3 shadow-lg"
        >
          <h3 className="font-bold text-white text-sm">Alterar senha master</h3>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="Senha atual"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
          />
          <input
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Nova senha (mínimo 6 caracteres)"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
          />
          {passwordMessage && <p className="text-xs text-amber-400">{passwordMessage}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setChangePasswordOpen(false)}
              className="bg-zinc-800 text-zinc-300 text-xs px-3 py-2 rounded-lg"
            >
              Cancelar
            </button>
            <button className="bg-amber-500 text-zinc-950 font-bold px-4 py-2 rounded-lg text-xs">
              Salvar nova senha
            </button>
          </div>
        </form>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs font-semibold uppercase text-zinc-400">Total de Barbearias</p>
          <p className="text-2xl font-bold text-white mt-2">{barbershops.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs font-semibold uppercase text-zinc-400">Barbearias Ativas</p>
          <p className="text-2xl font-bold text-emerald-400 mt-2">
            {barbershops.filter(s => s.status === 'ativo').length}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs font-semibold uppercase text-zinc-400">Acesso Suspenso</p>
          <p className="text-2xl font-bold text-red-400 mt-2">
            {barbershops.filter(s => s.status === 'suspenso').length}
          </p>
        </div>
      </div>

      {/* Barbershops Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Barbearias Cadastradas</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 text-zinc-400 text-xs uppercase">
              <tr>
                <th className="py-3 px-4">Barbearia</th>
                <th className="py-3 px-4">Plano</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {dataLoading ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-zinc-500">
                    Carregando estabelecimentos...
                  </td>
                </tr>
              ) : barbershops.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-zinc-500">
                    Nenhum estabelecimento cadastrado no banco.
                  </td>
                </tr>
              ) : (
                barbershops.map(shop => (
                  <tr key={shop.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-4 px-4 font-semibold text-white">
                      {shop.name}
                      <span className="block text-xs font-normal text-zinc-500 mt-0.5">
                        /{shop.slug || 'sem-slug'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-zinc-300">{shop.plan}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                          shop.status === 'ativo'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {shop.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => toggleBarbershopAccess(shop.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ml-auto transition ${
                          shop.status === 'ativo'
                            ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
                            : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        {shop.status === 'ativo' ? 'Suspender' : 'Reativar'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

