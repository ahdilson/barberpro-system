import React from 'react';
import { Scissors, User, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useEstablishment } from '../../contexts/EstablishmentContext';

export default function Header() {
  const { shopSettings } = useEstablishment();
  const location = useLocation();

  const isAdmin = location.pathname.startsWith('/admin');
  const slug = shopSettings.slug || '';
  const clientPath = slug ? `/${slug}` : '/';

  return (
    <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
        <Link to={clientPath} className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-500 flex items-center justify-center overflow-hidden transition group-hover:border-amber-500/50">
            {shopSettings.logo ? (
              <img src={shopSettings.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Scissors className="w-6 h-6" />
            )}
          </div>
          <div>
            <h1 className="font-bold text-lg text-amber-500 leading-tight">
              {shopSettings.name || 'SeuHorario'}
            </h1>
            <p className="text-xs text-zinc-400">
              {shopSettings.businessType || 'Barbearia'} • Gestão & Agendamento
            </p>
          </div>
        </Link>

        <div className="flex bg-zinc-800 p-1 rounded-xl border border-zinc-700">
          <Link
            to={clientPath}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              !isAdmin ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" /> Visão do Cliente
          </Link>
          <Link
            to="/admin"
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              isAdmin ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" /> Painel de Gestão
          </Link>
        </div>
      </div>
    </header>
  );
}

