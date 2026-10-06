import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { useAuth } from './AuthContext';
import { getTodayISO, clock } from '../utils/dateUtils';

const EstablishmentContext = createContext(null);

const DEFAULT_SETTINGS = {
  name: 'BarberPro System',
  slug: '',
  description: 'Atendimento personalizado para cuidar do seu estilo.',
  businessType: 'Barbearia',
  logo: '',
  phone: '(49) 99999-9999',
  address: 'Rua Principal, 100',
  instagram: '',
  locationUrl: '',
  primaryColor: '#f59e0b',
  whatsapp: '49999999999',
  confirmationMessage: 'Olá, {cliente}! Seu agendamento foi confirmado para {data} às {horario} com {barbeiro} ({servico}).',
  reminderMessage: 'Olá, {cliente}! Lembrete: seu horário é amanhã às {horario} com {barbeiro}.',
  reminderMinutes: 1440,
  reminderEnabled: true,
  onlineBookingEnabled: true
};

const mapBusy = (row) => ({
  id: `busy-${row.professional_id}-${row.appointment_date}-${clock(row.appointment_time)}`,
  clientName: '',
  clientPhone: '',
  barberId: row.professional_id,
  serviceId: '',
  date: row.appointment_date,
  time: clock(row.appointment_time),
  duration: row.duration_minutes || 30,
  price: 0,
  paymentMethod: 'pendente',
  status: 'confirmado'
});

const mapLookup = (row) => ({
  id: row.id,
  clientName: row.client_name,
  clientPhone: row.client_phone,
  barberId: row.professional_id,
  serviceId: row.service_id,
  date: row.appointment_date,
  time: clock(row.appointment_time),
  duration: row.duration_minutes || 30,
  price: Number(row.price || 0),
  paymentMethod: row.payment_method,
  status: row.status
});

const mapBlock = (row) => ({
  id: row.id,
  barberId: row.professional_id,
  date: row.block_date,
  startTime: clock(row.start_time),
  endTime: clock(row.end_time),
  reason: row.reason || '',
  isRecurring: row.is_recurring
});

export function EstablishmentProvider({ children, slug = null }) {
  const { session, profile } = useAuth();
  const [establishmentId, setEstablishmentId] = useState(null);
  const [establishmentLoading, setEstablishmentLoading] = useState(true);
  const [shopSettings, setShopSettings] = useState(DEFAULT_SETTINGS);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [agendaVersion, setAgendaVersion] = useState(0);

  const refreshAgenda = useCallback(() => {
    setAgendaVersion(v => v + 1);
  }, []);

  // 1. Resolve Establishment ID
  useEffect(() => {
    let mounted = true;

    const resolveEstablishment = async () => {
      setEstablishmentLoading(true);

      // If user is authenticated and has profile with establishment_id
      if (profile?.establishment_id) {
        if (mounted) {
          setEstablishmentId(profile.establishment_id);
          setEstablishmentLoading(false);
        }
        return;
      }

      if (!supabase) {
        // Fallback demo mode
        if (mounted) {
          setEstablishmentId('demo-shop');
          setBarbers([
            { id: '1', name: 'Marcos Silva', role: 'Master Barber', commission: 50, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
            { id: '2', name: 'Lucas Santos', role: 'Especialista em Barba', commission: 45, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
            { id: '3', name: 'Felipe Costa', role: 'Corte Moderno / Fade', commission: 40, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' }
          ]);
          setServices([
            { id: '1', name: 'Corte de Cabelo', price: 45, duration: 30, category: 'Cabelo', description: 'Corte personalizado com acabamento e finalização.' },
            { id: '2', name: 'Barba Completa', price: 35, duration: 30, category: 'Barba', description: 'Modelagem da barba, toalha quente e hidratação.' },
            { id: '3', name: 'Combo (Corte + Barba)', price: 70, duration: 60, category: 'Combos', description: 'Corte completo e barba com acabamento premium.' },
            { id: '4', name: 'Acabamento / Pezinho', price: 20, duration: 15, category: 'Cabelo', description: 'Acabamento de nuca, costeletas e contornos.' }
          ]);
          setEstablishmentLoading(false);
        }
        return;
      }

      // Query by slug if provided, otherwise pick first establishment
      let query = supabase.from('establishments').select('id, slug').limit(1);
      if (slug) {
        query = supabase.from('establishments').select('id, slug').eq('slug', slug).limit(1);
      }

      const { data, error } = await query;
      if (!mounted) return;

      if (!error && data && data.length > 0) {
        setEstablishmentId(data[0].id);
      } else if (slug) {
        // If slug not found, fallback to first
        const { data: firstShop } = await supabase.from('establishments').select('id').limit(1);
        if (firstShop && firstShop.length > 0 && mounted) {
          setEstablishmentId(firstShop[0].id);
        }
      }
      setEstablishmentLoading(false);
    };

    resolveEstablishment();

    return () => {
      mounted = false;
    };
  }, [slug, profile?.establishment_id]);

  // 2. Load Establishment Details & Services
  useEffect(() => {
    if (!supabase || !establishmentId || establishmentId === 'demo-shop') return;
    let mounted = true;

    const loadData = async () => {
      const [{ data: establishment }, { data: cloudServices }] = await Promise.all([
        supabase.from('establishments').select('*').eq('id', establishmentId).maybeSingle(),
        supabase.from('services').select('*').eq('establishment_id', establishmentId).eq('active', true).order('created_at')
      ]);

      if (!mounted) return;

      if (establishment) {
        setShopSettings({
          name: establishment.name || '',
          slug: establishment.slug || '',
          businessType: establishment.business_type || 'Barbearia',
          description: establishment.description || '',
          logo: establishment.logo_url || '',
          phone: establishment.phone || '',
          address: establishment.address || '',
          instagram: establishment.instagram_url || '',
          locationUrl: establishment.location_url || '',
          primaryColor: establishment.primary_color || '#f59e0b',
          whatsapp: establishment.whatsapp || '',
          confirmationMessage: establishment.confirmation_message || '',
          reminderMessage: establishment.reminder_message || '',
          reminderMinutes: establishment.reminder_minutes || 60,
          reminderEnabled: establishment.reminder_enabled ?? true,
          onlineBookingEnabled: establishment.online_booking_enabled ?? true
        });
      }

      if (cloudServices) {
        setServices(cloudServices.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description || '',
          price: Number(s.price),
          duration: s.duration_minutes || 30,
          category: s.category || 'Geral'
        })));
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [establishmentId]);

  // 3. Load Agenda, Barbers, Blocks, Appointments
  useEffect(() => {
    if (!supabase || !establishmentId || establishmentId === 'demo-shop') return;
    let mounted = true;

    const loadAgenda = async () => {
      const [{ data: profs }, { data: busy }, { data: blocks }] = await Promise.all([
        supabase.rpc('list_public_professionals', { p_establishment: establishmentId }),
        supabase.rpc('list_public_busy', { p_establishment: establishmentId }),
        supabase.rpc('list_public_blocks', { p_establishment: establishmentId })
      ]);

      if (!mounted) return;

      if (profs) {
        setBarbers(profs.map(person => ({
          id: person.id,
          name: person.full_name,
          role: 'Profissional',
          commission: 0,
          avatar: person.photo_url || `https://ui-avatars.com/api/?background=27272a&color=f59e0b&name=${encodeURIComponent(person.full_name || 'P')}`
        })));
      }

      if (blocks) {
        setTimeBlocks(blocks.map(mapBlock));
      }

      // If logged in, fetch full details with client phone and commissions
      if (session) {
        const [{ data: fullApps }, { data: memberProfiles }] = await Promise.all([
          supabase.from('appointments')
            .select('id, professional_id, service_id, appointment_date, appointment_time, status, payment_method, clients(name, phone), services(duration_minutes, price)')
            .eq('establishment_id', establishmentId),
          supabase.from('profiles')
            .select('id, full_name, photo_url, commission, role, active')
            .eq('establishment_id', establishmentId)
            .eq('active', true)
        ]);

        if (!mounted) return;

        if (memberProfiles?.length) {
          setBarbers(memberProfiles.map(person => ({
            id: person.id,
            name: person.full_name,
            role: person.role === 'establishment_admin' ? 'Administrador' : 'Profissional',
            commission: Number(person.commission || 0),
            avatar: person.photo_url || `https://ui-avatars.com/api/?background=27272a&color=f59e0b&name=${encodeURIComponent(person.full_name || 'P')}`
          })));
        }

        if (fullApps) {
          setAppointments(fullApps.map(row => ({
            id: row.id,
            clientName: row.clients?.name || '',
            clientPhone: row.clients?.phone || '',
            barberId: row.professional_id,
            serviceId: row.service_id,
            date: row.appointment_date,
            time: clock(row.appointment_time),
            duration: row.services?.duration_minutes || 30,
            price: Number(row.services?.price || 0),
            paymentMethod: row.payment_method || 'pix',
            status: row.status
          })));
          return;
        }
      }

      if (busy) {
        setAppointments(busy.map(mapBusy));
      }
    };

    loadAgenda();

    return () => {
      mounted = false;
    };
  }, [establishmentId, agendaVersion, session]);

  // Client Booking Action
  const bookAppointment = async ({ clientName, clientPhone, barberId, serviceId, date, time }) => {
    if (!clientName || !clientPhone) {
      return { success: false, error: 'Nome e telefone são obrigatórios.' };
    }

    const serviceObj = services.find(s => s.id === serviceId);

    if (supabase && establishmentId && establishmentId !== 'demo-shop') {
      if (!shopSettings.onlineBookingEnabled) {
        return { success: false, error: 'O agendamento online está desativado para este estabelecimento.' };
      }

      const { data, error } = await supabase.rpc('book_public_appointment', {
        p_establishment: establishmentId,
        p_professional: barberId,
        p_service: serviceId,
        p_date: date,
        p_time: time,
        p_name: clientName.trim(),
        p_phone: clientPhone.trim()
      });

      if (error) {
        return { success: false, error: error.message };
      }

      refreshAgenda();
      return { success: true, appointmentId: data };
    }

    // Mock mode
    const newAppointment = {
      id: Date.now().toString(),
      clientName,
      clientPhone,
      barberId,
      serviceId,
      date,
      time,
      duration: serviceObj?.duration || 30,
      price: serviceObj?.price || 0,
      paymentMethod: 'pix',
      status: 'confirmado'
    };
    setAppointments(prev => [...prev, newAppointment]);
    return { success: true, appointmentId: newAppointment.id };
  };

  // Cancel Appointment Action
  const cancelAppointment = async (id, phone) => {
    if (supabase && establishmentId && establishmentId !== 'demo-shop') {
      if (session) {
        const { error } = await supabase
          .from('appointments')
          .update({ status: 'cancelado' })
          .eq('id', id)
          .eq('establishment_id', establishmentId);
        if (error) return { success: false, error: error.message };
      } else {
        const { data, error } = await supabase.rpc('cancel_public_appointment', {
          p_establishment: establishmentId,
          p_appointment: id,
          p_phone: phone
        });
        if (error || !data) return { success: false, error: error?.message || 'Falha ao cancelar horário.' };
      }
      refreshAgenda();
      return { success: true };
    }

    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelado' } : a));
    return { success: true };
  };

  // Admin Appointment Creation (with atomic validation)
  const adminCreateAppointment = async ({ clientName, clientPhone, barberId, serviceId, date, time, paymentMethod = 'pix' }) => {
    const serviceObj = services.find(s => s.id === serviceId);
    if (!serviceObj) return { success: false, error: 'Serviço não encontrado.' };

    if (supabase && establishmentId && establishmentId !== 'demo-shop') {
      const { data: clientRow, error: clientError } = await supabase
        .from('clients')
        .upsert({ establishment_id: establishmentId, name: clientName.trim(), phone: clientPhone.trim() }, { onConflict: 'establishment_id,phone' })
        .select('id')
        .single();

      if (clientError) return { success: false, error: 'Erro ao salvar cliente.' };

      const { data: appRow, error: appError } = await supabase
        .from('appointments')
        .insert({
          establishment_id: establishmentId,
          client_id: clientRow.id,
          professional_id: barberId,
          service_id: serviceId,
          appointment_date: date,
          appointment_time: time,
          status: 'confirmado',
          payment_method: paymentMethod
        })
        .select('id')
        .single();

      if (appError) return { success: false, error: appError.message };

      refreshAgenda();
      return { success: true, appointmentId: appRow.id };
    }

    const newApp = {
      id: Date.now().toString(),
      clientName,
      clientPhone,
      barberId,
      serviceId,
      date,
      time,
      duration: serviceObj.duration,
      price: serviceObj.price,
      paymentMethod,
      status: 'confirmado'
    };
    setAppointments(prev => [...prev, newApp]);
    return { success: true, appointmentId: newApp.id };
  };

  // Lookup client appointments
  const lookupMyAppointments = async (phone) => {
    if (!phone || phone.replace(/\D/g, '').length < 8) return [];
    if (supabase && establishmentId && establishmentId !== 'demo-shop') {
      const { data, error } = await supabase.rpc('lookup_my_appointments', {
        p_establishment: establishmentId,
        p_phone: phone
      });
      if (error || !data) return [];
      return data.map(mapLookup);
    }
    const clean = phone.replace(/\D/g, '');
    return appointments.filter(a => a.clientPhone.replace(/\D/g, '').includes(clean));
  };

  // Update shop settings
  const updateSettings = async (newSettings) => {
    setShopSettings(prev => ({ ...prev, ...newSettings }));
    if (supabase && establishmentId && establishmentId !== 'demo-shop') {
      const cleanSlug = (newSettings.slug || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const { error } = await supabase.from('establishments').update({
        name: newSettings.name,
        slug: cleanSlug,
        business_type: newSettings.businessType,
        description: newSettings.description,
        phone: newSettings.phone,
        address: newSettings.address,
        instagram_url: newSettings.instagram,
        location_url: newSettings.locationUrl,
        primary_color: newSettings.primaryColor,
        whatsapp: newSettings.whatsapp,
        confirmation_message: newSettings.confirmationMessage,
        reminder_message: newSettings.reminderMessage,
        reminder_minutes: newSettings.reminderMinutes,
        reminder_enabled: newSettings.reminderEnabled,
        online_booking_enabled: newSettings.onlineBookingEnabled,
        updated_at: new Date().toISOString()
      }).eq('id', establishmentId);

      if (error) return { success: false, error: error.message };
    }
    return { success: true };
  };

  return (
    <EstablishmentContext.Provider
      value={{
        establishmentId,
        establishmentLoading,
        shopSettings,
        barbers,
        services,
        appointments,
        timeBlocks,
        agendaVersion,
        refreshAgenda,
        bookAppointment,
        cancelAppointment,
        adminCreateAppointment,
        lookupMyAppointments,
        updateSettings,
        setBarbers,
        setServices,
        setTimeBlocks,
        setAppointments
      }}
    >
      {children}
    </EstablishmentContext.Provider>
  );
}

export function useEstablishment() {
  const context = useContext(EstablishmentContext);
  if (!context) {
    throw new Error('useEstablishment deve ser usado dentro de um EstablishmentProvider');
  }
  return context;
}
