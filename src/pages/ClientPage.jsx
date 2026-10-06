import React from 'react';
import { useParams } from 'react-router-dom';
import { EstablishmentProvider } from '../contexts/EstablishmentContext';
import ClientBookingView from '../components/booking/ClientBookingView';

export default function ClientPage() {
  const { slug } = useParams();

  return (
    <EstablishmentProvider slug={slug}>
      <ClientBookingView />
    </EstablishmentProvider>
  );
}

