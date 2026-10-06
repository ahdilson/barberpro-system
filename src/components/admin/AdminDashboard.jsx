import React, { useState } from 'react';
import {
  TrendingUp, User, Scissors, CalendarX, Settings,
  Shield, LogOut, Key, AlertCircle, DollarSign
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import OverviewSection from './OverviewSection';
import FinancialSection from './FinancialSection';
import BarbersSection from './BarbersSection';
import ServicesSection from './ServicesSection';
import TimeBlocksSection from './TimeBlocksSection';
import SettingsSection from './SettingsSection';

export default function AdminDashboard() {
  const {
    isAuthenticated,
    adminRole,
    profile,
    user,
    login,
    logout,
    changePassword
  } = useAuth();

  const [activeSection, setActiveSection] = useState('overview');

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Change Password State
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');

    const res = await login(email, password);
    setLoggingIn(false);

    if (!res.success) {
      setLoginError(res.error || 'Credenciais inválidas.');
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    const res = await changePassword(currentPassword, newPassword);
    if (!res.success) {
      setPasswordMessage(res.error || 'Erro ao alterar senha.');
      return;
    }
    setPasswordMessage('Senha alterada com sucesso!');
    setCurrentPassword('');
    setNewPassword('');
    setTimeout(() => {
      setChangePasswordOpen(false);
      setPasswordMessage('');
    }, 2500);
  };

  // If not authenticated, render login form
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-white">Painel de Gestão</h2>
          <p className="text-sm text-zinc-400 mt-1">Acesso restrito para administradores e barbeiros.</p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">E-mail</label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={e => { setEmail(e.target.value); setLoginError(''); }}
              placeholder="voce@barbearia.com"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Senha</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => { setPassword(e.target.value); setLoginError(''); }}
              placeholder="Digite sua senha"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          {loginError && (
            <p className="text-sm text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {loginError}
            </p>
          )}

          <button
            type="submit"
            disabled={loggingIn}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold py-3 rounded-lg text-sm transition"
          >
            {loggingIn ? 'Entrando...' : 'Entrar no Painel'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar with user info, change password and logout */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold">
            {profile?.full_name ? profile.full_name[0] : (user?.email ? user.email[0].toUpperCase() : 'U')}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {profile?.full_name || user?.email}
            </p>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-amber-400 border border-zinc-700">
              {adminRole === 'admin' ? 'Administrador' : 'Barbeiro'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setChangePasswordOpen(prev => !prev); setPasswordMessage(''); }}
            className="text-xs text-zinc-400 hover:text-amber-400 flex items-center gap-1.5 transition"
          >
            <Key className="w-3.5 h-3.5" /> Alterar Senha
          </button>
          <button
            onClick={logout}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/30 transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Sair
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {changePasswordOpen && (
        <form
          onSubmit={handleChangePasswordSubmit}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 max-w-md ml-auto space-y-3 shadow-lg"
        >
          <h3 className="font-bold text-white text-sm">Alterar senha do painel</h3>
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

      {/* Admin Subnav */}
      <div className="flex border-b border-zinc-800 overflow-x-auto gap-2 pb-2">
        <button
          onClick={() => setActiveSection('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
            activeSection === 'overview'
              ? 'bg-zinc-800 text-amber-500 border border-zinc-700 font-bold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Visão Geral & Agenda
        </button>

        <button
          onClick={() => setActiveSection('financial')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
            activeSection === 'financial'
              ? 'bg-zinc-800 text-amber-500 border border-zinc-700 font-bold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Fechamento & Comissões
        </button>

        {adminRole === 'admin' && (
          <>
            <button
              onClick={() => setActiveSection('barbers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeSection === 'barbers'
                  ? 'bg-zinc-800 text-amber-500 border border-zinc-700 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" /> Gerenciar Barbeiros
            </button>

            <button
              onClick={() => setActiveSection('services')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeSection === 'services'
                  ? 'bg-zinc-800 text-amber-500 border border-zinc-700 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Scissors className="w-4 h-4" /> Serviços e Preços
            </button>

            <button
              onClick={() => setActiveSection('blocks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeSection === 'blocks'
                  ? 'bg-zinc-800 text-amber-500 border border-zinc-700 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <CalendarX className="w-4 h-4" /> Bloqueio de Horários / Almoço
            </button>

            <button
              onClick={() => setActiveSection('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeSection === 'settings'
                  ? 'bg-zinc-800 text-amber-500 border border-zinc-700 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" /> Configurações
            </button>
          </>
        )}
      </div>

      {/* Render Active Section */}
      {activeSection === 'overview' && <OverviewSection />}
      {activeSection === 'financial' && <FinancialSection />}
      {activeSection === 'barbers' && adminRole === 'admin' && <BarbersSection />}
      {activeSection === 'services' && adminRole === 'admin' && <ServicesSection />}
      {activeSection === 'blocks' && adminRole === 'admin' && <TimeBlocksSection />}
      {activeSection === 'settings' && adminRole === 'admin' && <SettingsSection />}
    </div>
  );
}
