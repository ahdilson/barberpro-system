import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { EstablishmentProvider } from './contexts/EstablishmentContext';
import Header from './components/common/Header';
import ClientPage from './pages/ClientPage';
import AdminPage from './pages/AdminPage';
import PlatformPage from './pages/PlatformPage';

export default function App() {
  return (
    <AuthProvider>
      <EstablishmentProvider>
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col justify-between">
          <div>
            <Header />
            <main className="max-w-7xl mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<ClientPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/plataforma" element={<PlatformPage />} />
                <Route path="/:slug" element={<ClientPage />} />
              </Routes>
            </main>
          </div>

          <footer className="max-w-7xl mx-auto px-4 pb-8 text-center w-full">
            <Link
              to="/plataforma"
              className="text-xs text-zinc-500 hover:text-amber-400 transition"
            >
              Acesso administrativo da plataforma SaaS
            </Link>
          </footer>
        </div>
      </EstablishmentProvider>
    </AuthProvider>
  );
}
