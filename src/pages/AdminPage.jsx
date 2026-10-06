import React from 'react';
import { EstablishmentProvider } from '../contexts/EstablishmentContext';
import AdminDashboard from '../components/admin/AdminDashboard';

export default function AdminPage() {
  return (
    <EstablishmentProvider>
      <AdminDashboard />
    </EstablishmentProvider>
  );
}
