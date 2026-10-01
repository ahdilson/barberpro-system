import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { 
  Calendar, Clock, Scissors, User, DollarSign, 
  TrendingUp, Lock, Plus, Trash2, CheckCircle2, 
  Settings, AlertCircle, CalendarX, ChevronRight, Shield, Edit3, Repeat, Save, X, Search, Ban, Building2, Power, MessageCircle, Instagram, MapPin
} from 'lucide-react';

export default function App() {
  const [supabaseStatus, setSupabaseStatus] = useState(isSupabaseConfigured ? 'conectando' : 'nao-configurado');
  const [establishmentId, setEstablishmentId] = useState(null);
  // Mode Selection: 'client' or 'admin'
  const [activeTab, setActiveTab] = useState('client');
  const [clientSubTab, setClientSubTab] = useState('book'); // 'book' or 'my-bookings'
  const [adminSection, setAdminSection] = useState('overview');
  const [shopSettings, setShopSettings] = useState({
    name: 'BarberPro System', description: 'Atendimento personalizado para cuidar do seu estilo.', businessType: 'Barbearia', logo: '', phone: '(49) 99999-9999', address: 'Rua Principal, 100', instagram: '', locationUrl: '',
    primaryColor: '#f59e0b', whatsapp: '49999999999', confirmationMessage: 'Olá, {cliente}! Seu horário foi confirmado.',
    reminderMessage: 'Olá, {cliente}! Lembrete: seu horário é amanhã às {horario}.', reminderMinutes: 1440,
    metaPhoneNumberId: '', metaBusinessAccountId: '', metaAccessToken: '',
    reminderEnabled: true, onlineBookingEnabled: true
  });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [actionFeedback, setActionFeedback] = useState('');
  const [platformAuthenticated, setPlatformAuthenticated] = useState(false);
  const [platformUsername, setPlatformUsername] = useState('');
  const [platformPassword, setPlatformPassword] = useState('');
  const [platformLoginError, setPlatformLoginError] = useState('');
  const [platformPasswordCredential, setPlatformPasswordCredential] = useState('master123');
  const [platformChangePasswordOpen, setPlatformChangePasswordOpen] = useState(false);
  const [platformCurrentPassword, setPlatformCurrentPassword] = useState('');
  const [platformNewPassword, setPlatformNewPassword] = useState('');
  const [platformPasswordMessage, setPlatformPasswordMessage] = useState('');
  const [barbershops, setBarbershops] = useState([
    { id: 'shop-1', name: 'Barbearia Central', owner: 'Rafael Oliveira', plan: 'Profissional', status: 'ativo', payment: 'Em dia', nextPayment: '05/10/2026' },
    { id: 'shop-2', name: 'Corte Nobre', owner: 'André Martins', plan: 'Básico', status: 'ativo', payment: 'Em dia', nextPayment: '12/10/2026' },
    { id: 'shop-3', name: 'Barba & Estilo', owner: 'Thiago Souza', plan: 'Profissional', status: 'suspenso', payment: 'Inadimplente', nextPayment: '20/09/2026' }
  ]);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [adminRole, setAdminRole] = useState('admin');
  const [loggedBarberId, setLoggedBarberId] = useState(null);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [adminPasswordCredential, setAdminPasswordCredential] = useState('admin123');
  const [barberPasswordCredentials, setBarberPasswordCredentials] = useState({ '1': 'barbeiro123', '2': 'barbeiro123', '3': 'barbeiro123' });
  const [adminChangePasswordOpen, setAdminChangePasswordOpen] = useState(false);
  const [adminCurrentPassword, setAdminCurrentPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminPasswordMessage, setAdminPasswordMessage] = useState('');

  // --- DYNAMIC DATA STATES ---
  const [barbers, setBarbers] = useState([
    { id: '1', name: 'Marcos Silva', role: 'Master Barber', commission: 50, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
    { id: '2', name: 'Lucas Santos', role: 'Especialista em Barba', commission: 45, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { id: '3', name: 'Felipe Costa', role: 'Corte Moderno / Fade', commission: 40, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' }
  ]);

  const [services, setServices] = useState([
    { id: '1', name: 'Corte de Cabelo', price: 45, duration: 30, category: 'Cabelo', description: 'Corte personalizado com acabamento e finalização.' },
    { id: '2', name: 'Barba Completa', price: 35, duration: 30, category: 'Barba', description: 'Modelagem da barba, toalha quente e hidratação.' },
    { id: '3', name: 'Combo (Corte + Barba)', price: 70, duration: 60, category: 'Combos', description: 'Corte completo e barba com acabamento premium.' },
    { id: '4', name: 'Acabamento / Pezinho', price: 20, duration: 15, category: 'Cabelo', description: 'Acabamento de nuca, costeletas e contornos.' }
  ]);

  const [appointments, setAppointments] = useState([
    { id: '101', clientName: 'João Pedro', clientPhone: '(49) 99911-2233', barberId: '1', serviceId: '3', date: '2026-10-01', time: '14:00', duration: 60, price: 70, paymentMethod: 'pix', status: 'confirmado' },
    { id: '102', clientName: 'Carlos Eduardo', clientPhone: '(49) 98844-5566', barberId: '2', serviceId: '1', date: '2026-10-01', time: '15:00', duration: 30, price: 45, paymentMethod: 'cartao', status: 'confirmado' }
  ]);

  // Recurrent blocks support (isRecurring: true for fixed lunch hours)
  const [timeBlocks, setTimeBlocks] = useState([
    { id: '201', barberId: '1', date: '2026-10-01', startTime: '12:00', endTime: '13:30', reason: 'Horário de Almoço (Fixo)', isRecurring: true },
    { id: '202', barberId: '2', date: '2026-10-01', startTime: '12:00', endTime: '13:00', reason: 'Horário de Almoço (Fixo)', isRecurring: true }
  ]);

  // --- EDITING STATES ---
  const [editingBarber, setEditingBarber] = useState(null);
  const [editingService, setEditingService] = useState(null);

  // --- CLIENT LOOKUP STATE ---
  const [searchPhone, setSearchPhone] = useState('');

  // --- FORM STATES ---
  // Client Booking Form
  const [selectedBarber, setSelectedBarber] = useState(barbers[0]?.id || '');
  const [selectedService, setSelectedService] = useState(services[0]?.id || '');
  const [bookingDate, setBookingDate] = useState('2026-10-01');
  const [bookingTime, setBookingTime] = useState('10:00');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Admin appointment form
  const [adminBookingOpen, setAdminBookingOpen] = useState(false);
  const [adminBooking, setAdminBooking] = useState({
    clientName: '',
    clientPhone: '',
    barberId: barbers[0]?.id || '',
    serviceId: services[0]?.id || '',
    date: '2026-10-01',
    time: '09:00',
    paymentMethod: 'pix'
  });
  const [adminBookingError, setAdminBookingError] = useState('');
  const [reportStartDate, setReportStartDate] = useState('2026-10-01');
  const [reportEndDate, setReportEndDate] = useState('2026-10-31');
  const [reportPaymentMethod, setReportPaymentMethod] = useState('todos');

  // New Barber Form
  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberRole, setNewBarberRole] = useState('');
  const [newBarberCommission, setNewBarberCommission] = useState(50);
  const [newBarberPhoto, setNewBarberPhoto] = useState('');

  // New Service Form
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('30');
  const [newServiceCategory, setNewServiceCategory] = useState('Cabelo');
  const [newServiceDescription, setNewServiceDescription] = useState('');

  // Time Block Form
  const [blockBarberId, setBlockBarberId] = useState(barbers[0]?.id || '');
  const [blockDate, setBlockDate] = useState('2026-10-01');
  const [blockStartTime, setBlockStartTime] = useState('12:00');
  const [blockEndTime, setBlockEndTime] = useState('13:30');
  const [blockReason, setBlockReason] = useState('Horário de Almoço');
  const [blockIsRecurring, setBlockIsRecurring] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!supabase) return undefined;

    supabase.from('establishments').select('id').limit(1)
      .then(({ error }) => {
        if (!mounted) return;
        setSupabaseStatus(error ? 'erro' : 'conectado');
      });

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;
    let mounted = true;
    const loadCloudData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      let targetEstablishmentId = null;
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('establishment_id, role').eq('id', session.user.id).maybeSingle();
        targetEstablishmentId = profile?.establishment_id || null;
      } else {
        const { data: publicEstablishments } = await supabase.from('establishments').select('id').limit(1);
        targetEstablishmentId = publicEstablishments?.[0]?.id || null;
      }
      if (!targetEstablishmentId || !mounted) return;
      setEstablishmentId(targetEstablishmentId);
      const [{ data: establishment }, { data: cloudServices }] = await Promise.all([
        supabase.from('establishments').select('*').eq('id', targetEstablishmentId).single(),
        supabase.from('services').select('*').eq('establishment_id', targetEstablishmentId).eq('active', true).order('created_at')
      ]);
      if (!mounted) return;
      if (establishment) setShopSettings(current => ({ ...current, name: establishment.name, businessType: establishment.business_type, description: establishment.description, logo: establishment.logo_url || '', phone: establishment.phone, address: establishment.address, instagram: establishment.instagram_url, locationUrl: establishment.location_url, primaryColor: establishment.primary_color, whatsapp: establishment.whatsapp, confirmationMessage: establishment.confirmation_message, reminderMessage: establishment.reminder_message, reminderMinutes: establishment.reminder_minutes, reminderEnabled: establishment.reminder_enabled, onlineBookingEnabled: establishment.online_booking_enabled }));
      if (cloudServices?.length) setServices(cloudServices.map(service => ({ id: service.id, name: service.name, description: service.description, price: Number(service.price), duration: service.duration_minutes, category: service.category })));
    };
    loadCloudData();
    return () => { mounted = false; };
  }, []);

  // Available Time Slots (30 min increments)
  const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];

  // Helper: Convert time string 'HH:MM' to minutes from midnight
  const timeToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  // Check if a specific time interval overlaps with blocked hours
  const isIntervalBlocked = (barberId, date, startMins, endMins) => {
    return timeBlocks.some(block => {
      if (block.barberId === barberId) {
        if (block.isRecurring || block.date === date) {
          const bStart = timeToMinutes(block.startTime);
          const bEnd = timeToMinutes(block.endTime);
          return startMins < bEnd && endMins > bStart;
        }
      }
      return false;
    });
  };

  // Check if a specific time interval overlaps with CONFIRMED appointments
  const isIntervalBooked = (barberId, date, startMins, endMins) => {
    return appointments.some(app => {
      // Ignore cancelled appointments so slots become free
      if (app.barberId === barberId && app.date === date && app.status === 'confirmado') {
        const aStart = timeToMinutes(app.time);
        const aEnd = aStart + (app.duration || 30);
        return startMins < aEnd && endMins > aStart;
      }
      return false;
    });
  };

  // Check slot availability factoring in selected service duration
  const isSlotUnavailable = (barberId, date, slotTime, serviceId) => {
    const currentService = services.find(s => s.id === serviceId);
    const duration = currentService ? currentService.duration : 30;
    const startMins = timeToMinutes(slotTime);
    const endMins = startMins + duration;

    if (endMins > timeToMinutes('19:00')) return true;

    const blocked = isIntervalBlocked(barberId, date, startMins, endMins);
    const booked = isIntervalBooked(barberId, date, startMins, endMins);

    return blocked || booked;
  };

  const openWhatsAppMessage = (appointment, type) => {
    const phone = appointment.clientPhone.replace(/\D/g, '');
    if (!phone) return;
    const barber = barbers.find(item => item.id === appointment.barberId);
    const service = services.find(item => item.id === appointment.serviceId);
    const template = type === 'confirmed' ? shopSettings.confirmationMessage : type === 'reminder' ? shopSettings.reminderMessage : '';
    const message = type === 'cancelled'
      ? `Olá, ${appointment.clientName}! Seu agendamento na BarberPro foi cancelado. Se quiser, podemos escolher um novo horário.`
      : `${template || 'Olá, {cliente}! Seu agendamento foi confirmado.'}`.replaceAll('{cliente}', appointment.clientName).replaceAll('{horario}', appointment.time).replaceAll('{data}', appointment.date).replaceAll('{servico}', service?.name || 'Atendimento').replaceAll('{barbeiro}', barber?.name || 'A definir');
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  // Cancel Appointment Action
  const handleCancelAppointment = (id) => {
    if (window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
      const appointment = appointments.find(app => app.id === id);
      setAppointments(appointments.map(app => 
        app.id === id ? { ...app, status: 'cancelado' } : app
      ));
      if (appointment) openWhatsAppMessage(appointment, 'cancelled');
    }
  };

  const saveClientToCloud = async (name, phone) => {
    if (!supabase || !establishmentId) return;
    const { error } = await supabase.from('clients').upsert({ establishment_id: establishmentId, name, phone }, { onConflict: 'establishment_id,phone' });
    if (error) console.error('Falha ao salvar cliente:', error.message);
  };

  // Handle Client Booking
  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (!clientName || !clientPhone) return;

    const serviceObj = services.find(s => s.id === selectedService);
    const newAppointment = {
      id: Date.now().toString(),
      clientName,
      clientPhone,
      barberId: selectedBarber,
      serviceId: selectedService,
      date: bookingDate,
      time: bookingTime,
      duration: serviceObj ? serviceObj.duration : 30,
      price: serviceObj ? serviceObj.price : 0,
      paymentMethod: 'pix',
      status: 'confirmado'
    };

    await saveClientToCloud(clientName, clientPhone);
    setAppointments(current => [...current, newAppointment]);
    openWhatsAppMessage(newAppointment, 'confirmed');
    setBookingSuccess(true);
    flashAction('Agendamento concluído');
    setTimeout(() => {
      setBookingSuccess(false);
      setClientName('');
      setClientPhone('');
    }, 4000);
  };

  const handleAdminBookingChange = (field, value) => {
    setAdminBooking(current => ({ ...current, [field]: value }));
    setAdminBookingError('');
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (supabase && adminUsername.includes('@')) {
      const { error } = await supabase.auth.signInWithPassword({ email: adminUsername.trim(), password: adminPassword });
      if (!error) {
        const { data: profile } = await supabase.from('profiles').select('establishment_id, role').eq('id', (await supabase.auth.getUser()).data.user.id).maybeSingle();
        if (profile?.establishment_id) setEstablishmentId(profile.establishment_id);
        setAdminRole('admin');
        setAdminAuthenticated(true);
        setAdminLoginError('');
        return;
      }
      setAdminLoginError('E-mail ou senha inválidos.');
      return;
    }
    if (adminUsername === 'admin' && adminPassword === adminPasswordCredential) {
      setAdminAuthenticated(true);
      setAdminRole('admin');
      setLoggedBarberId(null);
      setAdminLoginError('');
      setAdminPassword('');
    } else {
      const barber = barbers.find(item => item.name.toLowerCase().split(' ')[0] === adminUsername.toLowerCase());
      if (barber && adminPassword === barberPasswordCredentials[barber.id]) {
        setAdminAuthenticated(true);
        setAdminRole('barber');
        setLoggedBarberId(barber.id);
        setAdminLoginError('');
        setAdminPassword('');
      } else {
        setAdminLoginError('Usuário ou senha inválidos.');
      }
    }
  };

  const handlePlatformLogin = (e) => {
    e.preventDefault();
    if (platformUsername === 'master' && platformPassword === platformPasswordCredential) {
      setPlatformAuthenticated(true);
      setPlatformLoginError('');
      setPlatformPassword('');
    } else {
      setPlatformLoginError('Usuário ou senha inválidos.');
    }
  };

  const handleChangePassword = (type, e) => {
    e.preventDefault();
    const isPlatform = type === 'platform';
    const current = isPlatform ? platformCurrentPassword : adminCurrentPassword;
    const next = isPlatform ? platformNewPassword : adminNewPassword;
    const currentCredential = isPlatform
      ? platformPasswordCredential
      : adminRole === 'barber' ? barberPasswordCredentials[loggedBarberId] : adminPasswordCredential;
    if (current !== currentCredential || next.length < 6) {
      const message = current !== currentCredential ? 'A senha atual está incorreta.' : 'A nova senha deve ter pelo menos 6 caracteres.';
      if (isPlatform) setPlatformPasswordMessage(message); else setAdminPasswordMessage(message);
      return;
    }
    if (isPlatform) {
      setPlatformPasswordCredential(next); setPlatformCurrentPassword(''); setPlatformNewPassword(''); setPlatformPasswordMessage('Senha alterada com sucesso.');
    } else {
      if (adminRole === 'barber') setBarberPasswordCredentials(current => ({ ...current, [loggedBarberId]: next }));
      else setAdminPasswordCredential(next);
      setAdminCurrentPassword(''); setAdminNewPassword(''); setAdminPasswordMessage('Senha alterada com sucesso.');
    }
  };

  const handleSettingsChange = (field, value) => {
    setShopSettings(current => ({ ...current, [field]: value }));
    setSettingsSaved(false);
  };

  const flashAction = (message) => {
    setActionFeedback(message);
    window.setTimeout(() => setActionFeedback(''), 2500);
  };

  const saveShopSettings = async (e) => {
    e.preventDefault();
    let targetEstablishmentId = establishmentId;
    if (supabase && !targetEstablishmentId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('establishment_id').eq('id', user.id).maybeSingle();
        targetEstablishmentId = profile?.establishment_id || null;
        if (targetEstablishmentId) setEstablishmentId(targetEstablishmentId);
      }
    }
    if (supabase && targetEstablishmentId) {
      const { data: savedEstablishment, error } = await supabase.from('establishments').update({
        name: shopSettings.name,
        business_type: shopSettings.businessType,
        description: shopSettings.description,
        phone: shopSettings.phone,
        address: shopSettings.address,
        instagram_url: shopSettings.instagram,
        location_url: shopSettings.locationUrl,
        primary_color: shopSettings.primaryColor,
        whatsapp: shopSettings.whatsapp,
        confirmation_message: shopSettings.confirmationMessage,
        reminder_message: shopSettings.reminderMessage,
        reminder_minutes: shopSettings.reminderMinutes,
        reminder_enabled: shopSettings.reminderEnabled,
        online_booking_enabled: shopSettings.onlineBookingEnabled,
        updated_at: new Date().toISOString()
      }).eq('id', targetEstablishmentId).select('*').single();
      if (error) { alert(`Não foi possível salvar as configurações no banco: ${error.message}`); return; }
      if (savedEstablishment) setShopSettings(current => ({ ...current, name: savedEstablishment.name, businessType: savedEstablishment.business_type, description: savedEstablishment.description, phone: savedEstablishment.phone, address: savedEstablishment.address, instagram: savedEstablishment.instagram_url, locationUrl: savedEstablishment.location_url, primaryColor: savedEstablishment.primary_color, whatsapp: savedEstablishment.whatsapp, confirmationMessage: savedEstablishment.confirmation_message, reminderMessage: savedEstablishment.reminder_message, reminderMinutes: savedEstablishment.reminder_minutes, reminderEnabled: savedEstablishment.reminder_enabled, onlineBookingEnabled: savedEstablishment.online_booking_enabled }));
    } else if (supabase) {
      alert('Não foi possível identificar o estabelecimento. Saia e entre novamente.');
      return;
    }
    setSettingsSaved(true);
    flashAction('Configurações concluídas');
  };

  const handleShopLogo = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (supabase && establishmentId) {
      const extension = file.type.split('/')[1] || 'png';
      const path = `${establishmentId}/logo-${Date.now()}.${extension}`;
      const { error } = await supabase.storage.from('establishment-assets').upload(path, file, { upsert: true, contentType: file.type });
      if (!error) {
        const { data } = supabase.storage.from('establishment-assets').getPublicUrl(path);
        handleSettingsChange('logo', data.publicUrl);
        return;
      }
      alert('Não foi possível enviar a logo para o armazenamento.');
    }
    const reader = new FileReader();
    reader.onload = () => handleSettingsChange('logo', reader.result);
    reader.readAsDataURL(file);
  };

  const toggleBarbershopAccess = (id) => {
    setBarbershops(current => current.map(shop => shop.id === id
      ? { ...shop, status: shop.status === 'ativo' ? 'suspenso' : 'ativo', payment: shop.status === 'ativo' ? 'Acesso suspenso' : 'Regularizado' }
      : shop
    ));
  };

  const handleCreateAdminAppointment = async (e) => {
    e.preventDefault();
    const serviceObj = services.find(s => s.id === adminBooking.serviceId);
    const duration = serviceObj?.duration || 30;

    if (isSlotUnavailable(adminBooking.barberId, adminBooking.date, adminBooking.time, adminBooking.serviceId)) {
      setAdminBookingError('Este horário está indisponível para o barbeiro ou conflita com outro agendamento.');
      return;
    }

    const newAppointment = {
      id: Date.now().toString(),
      clientName: adminBooking.clientName,
      clientPhone: adminBooking.clientPhone,
      barberId: adminBooking.barberId,
      serviceId: adminBooking.serviceId,
      date: adminBooking.date,
      time: adminBooking.time,
      duration,
      price: serviceObj?.price || 0,
      paymentMethod: adminBooking.paymentMethod,
      status: 'confirmado'
    };
    await saveClientToCloud(newAppointment.clientName, newAppointment.clientPhone);
    setAppointments(current => [...current, newAppointment]);
    openWhatsAppMessage({ ...adminBooking, ...{
      clientName: adminBooking.clientName,
      clientPhone: adminBooking.clientPhone,
      barberId: adminBooking.barberId,
      serviceId: adminBooking.serviceId,
      date: adminBooking.date,
      time: adminBooking.time
    } }, 'confirmed');
    setAdminBooking({ ...adminBooking, clientName: '', clientPhone: '' });
    setAdminBookingOpen(false);
    setAdminBookingError('');
    flashAction('Agendamento concluído');
  };

  // Barber Actions
  const handleAddBarber = (e) => {
    e.preventDefault();
    if (!newBarberName) return;
    const newBarber = {
      id: Date.now().toString(),
      name: newBarberName,
      role: newBarberRole || 'Barbeiro Profissional',
      commission: Number(newBarberCommission),
      avatar: newBarberPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
    };
    setBarbers([...barbers, newBarber]);
    setNewBarberName('');
    setNewBarberRole('');
    setNewBarberPhoto('');
    flashAction('Barbeiro cadastrado');
  };

  const handleBarberPhoto = (file, onLoad) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => onLoad(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUpdateBarber = (e) => {
    e.preventDefault();
    setBarbers(barbers.map(b => b.id === editingBarber.id ? editingBarber : b));
    setEditingBarber(null);
    flashAction('Barbeiro atualizado');
  };

  // Service Actions
  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newServiceName || !newServicePrice) return;
    const newServ = {
      id: Date.now().toString(),
      name: newServiceName,
      price: Number(newServicePrice),
      duration: Number(newServiceDuration),
      category: newServiceCategory,
      description: newServiceDescription
    };
    if (supabase && establishmentId) {
      const { data, error } = await supabase.from('services').insert({ establishment_id: establishmentId, name: newServ.name, description: newServ.description, price: newServ.price, duration_minutes: newServ.duration, category: newServ.category }).select().single();
      if (error) { alert('Não foi possível salvar o serviço no banco.'); return; }
      newServ.id = data.id;
    }
    setServices(current => [...current, newServ]);
    setNewServiceName('');
    setNewServicePrice('');
    setNewServiceDescription('');
    flashAction('Serviço cadastrado');
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    if (supabase && establishmentId) {
      const { error } = await supabase.from('services').update({ name: editingService.name, description: editingService.description, price: editingService.price, duration_minutes: editingService.duration, category: editingService.category }).eq('id', editingService.id).eq('establishment_id', establishmentId);
      if (error) { alert('Não foi possível atualizar o serviço no banco.'); return; }
    }
    setServices(current => current.map(s => s.id === editingService.id ? editingService : s));
    setEditingService(null);
    flashAction('Serviço atualizado');
  };

  const handleDeleteService = async (serviceId) => {
    if (supabase && establishmentId) {
      const { error } = await supabase.from('services').update({ active: false }).eq('id', serviceId).eq('establishment_id', establishmentId);
      if (error) { alert('Não foi possível remover o serviço do banco.'); return; }
    }
    setServices(current => current.filter(item => item.id !== serviceId));
    flashAction('Serviço removido');
  };

  // Time Block Actions
  const handleAddTimeBlock = (e) => {
    e.preventDefault();
    const newBlock = {
      id: Date.now().toString(),
      barberId: blockBarberId,
      date: blockDate,
      startTime: blockStartTime,
      endTime: blockEndTime,
      reason: blockReason,
      isRecurring: blockIsRecurring
    };
    setTimeBlocks([...timeBlocks, newBlock]);
    alert(blockIsRecurring ? 'Bloqueio diário/recorrente ativado!' : 'Bloqueio cadastrado!');
  };

  // Active appointments calculations
  const confirmedAppointments = appointments.filter(a => a.status === 'confirmado');
  const totalRevenue = confirmedAppointments.reduce((acc, curr) => acc + curr.price, 0);
  const totalAppointments = confirmedAppointments.length;
  const visibleAppointments = adminRole === 'barber'
    ? confirmedAppointments.filter(app => app.barberId === loggedBarberId)
    : appointments;
  const visibleConfirmedAppointments = adminRole === 'barber'
    ? confirmedAppointments.filter(app => app.barberId === loggedBarberId)
    : confirmedAppointments;
  const visibleRevenue = visibleConfirmedAppointments.reduce((acc, curr) => acc + curr.price, 0);
  const reportAppointments = confirmedAppointments.filter(app => {
    const inPeriod = (!reportStartDate || app.date >= reportStartDate) && (!reportEndDate || app.date <= reportEndDate);
    const inPayment = reportPaymentMethod === 'todos' || (app.paymentMethod || 'pix') === reportPaymentMethod;
    const inBarberScope = adminRole === 'admin' || app.barberId === loggedBarberId;
    return inPeriod && inPayment && inBarberScope;
  });
  const reportRevenue = reportAppointments.reduce((sum, app) => sum + app.price, 0);
  const reportByBarber = barbers.map(barber => {
    const items = reportAppointments.filter(app => app.barberId === barber.id);
    return {
      barber,
      pix: items.filter(app => (app.paymentMethod || 'pix') === 'pix').reduce((sum, app) => sum + app.price, 0),
      dinheiro: items.filter(app => app.paymentMethod === 'dinheiro').reduce((sum, app) => sum + app.price, 0),
      cartao: items.filter(app => app.paymentMethod === 'cartao').reduce((sum, app) => sum + app.price, 0),
      total: items.reduce((sum, app) => sum + app.price, 0)
    };
  }).filter(item => adminRole === 'admin' || item.barber.id === loggedBarberId);

  // Filter client appointments for lookup
  const userAppointments = searchPhone.trim() 
    ? appointments.filter(a => a.clientPhone.replace(/\D/g, '').includes(searchPhone.replace(/\D/g, '')))
    : [];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {actionFeedback && <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-300 shadow-lg"><CheckCircle2 className="w-4 h-4" />{actionFeedback}</div>}
      {/* Top Header Navigation */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-500 flex items-center justify-center overflow-hidden">
              {shopSettings.logo ? <img src={shopSettings.logo} alt="Logo" className="w-full h-full object-cover" /> : <Scissors className="w-6 h-6" />}
            </div>
            <div>
              <h1 className="font-bold text-lg text-amber-500">{shopSettings.name}</h1>
              <p className="text-xs text-zinc-400">{shopSettings.businessType} • Gestão & Agendamento</p>
            </div>
          </div>

          <div className="flex bg-zinc-800 p-1 rounded-xl border border-zinc-700">
            <button
              onClick={() => setActiveTab('client')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'client' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" /> Visão do Cliente
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'admin' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" /> Painel de Gestão
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* ==================== CLIENT AGENDAMENTO VIEW ==================== */}
        {activeTab === 'client' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5"> <div className="flex items-center gap-4">{shopSettings.logo && <img src={shopSettings.logo} alt={shopSettings.name} className="w-16 h-16 rounded-xl object-cover" />}<div><p className="text-xs uppercase tracking-wider text-amber-500 font-semibold">{shopSettings.businessType}</p><h2 className="text-2xl font-bold text-white">{shopSettings.name}</h2><p className="text-sm text-zinc-400 mt-1">{shopSettings.description}</p></div></div><div className="flex items-center gap-2"><a href={shopSettings.whatsapp ? `https://wa.me/55${shopSettings.whatsapp.replace(/\D/g, '')}` : '#'} target="_blank" rel="noreferrer" title="Chamar no WhatsApp" className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"><MessageCircle className="w-4 h-4" /></a><a href={shopSettings.instagram || '#'} target="_blank" rel="noreferrer" title="Instagram" className="p-2.5 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/30 hover:bg-pink-500/20"><Instagram className="w-4 h-4" /></a><a href={shopSettings.locationUrl || '#'} target="_blank" rel="noreferrer" title="Como chegar" className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20"><MapPin className="w-4 h-4" /></a></div></div>
            {/* Sub-navigation for Client */}
            <div className="flex justify-center gap-2 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800 w-max mx-auto">
              <button
                onClick={() => setClientSubTab('book')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  clientSubTab === 'book' ? 'bg-zinc-800 text-amber-400 font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Novo Agendamento
              </button>
              <button
                onClick={() => setClientSubTab('my-bookings')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  clientSubTab === 'my-bookings' ? 'bg-zinc-800 text-amber-400 font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Meus Agendamentos / Cancelar
              </button>
            </div>

            {/* TAB 1: NOVO AGENDAMENTO */}
            {clientSubTab === 'book' && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-xl">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-1">Agende seu Horário</h2>
                  <p className="text-zinc-400 text-sm">Escolha o profissional, serviço e o melhor momento para você.</p>
                </div>

                {bookingSuccess && (
                  <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-400">
                    <CheckCircle2 className="w-6 h-6 shrink-0" />
                    <div>
                      <h4 className="font-bold">Agendamento Realizado!</h4>
                      <p className="text-xs text-emerald-300">Seu horário foi reservado com sucesso.</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleCreateAppointment} className="space-y-6">
                  {/* 1. Escolha o Profissional */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">1. Escolha o Profissional</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {barbers.map((b) => (
                        <button
                          type="button"
                          key={b.id}
                          onClick={() => setSelectedBarber(b.id)}
                          className={`p-3 rounded-xl border flex items-center gap-3 transition text-left ${
                            selectedBarber === b.id 
                              ? 'bg-amber-500/10 border-amber-500 text-white' 
                              : 'bg-zinc-800/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <img src={b.avatar} alt={b.name} className="w-10 h-10 rounded-full object-cover" />
                          <div>
                            <p className="font-medium text-sm text-white">{b.name}</p>
                            <p className="text-xs text-zinc-500">{b.role}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Escolha o Serviço */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">2. Selecione o Serviço</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {services.map((s) => (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() => setSelectedService(s.id)}
                          className={`p-3 rounded-xl border flex justify-between items-center transition ${
                            selectedService === s.id 
                              ? 'bg-amber-500/10 border-amber-500 text-white' 
                              : 'bg-zinc-800/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <div>
                            <p className="font-medium text-sm text-white">{s.name}</p>
                            <p className="text-xs text-zinc-500">{s.duration} minutos</p>
                            {s.description && <p className="text-xs text-zinc-400 mt-1 max-w-[220px]">{s.description}</p>}
                          </div>
                          <span className="font-bold text-amber-500">R$ {s.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Data e Horários */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Data</label>
                      <input
                        type="date"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Horários Disponíveis</label>
                      <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto p-1.5 bg-zinc-950 rounded-xl border border-zinc-800">
                        {timeSlots.map((time) => {
                          const unavailable = isSlotUnavailable(selectedBarber, bookingDate, time, selectedService);

                          return (
                            <button
                              type="button"
                              key={time}
                              disabled={unavailable}
                              onClick={() => setBookingTime(time)}
                              className={`py-1.5 text-xs rounded-lg font-medium transition ${
                                bookingTime === time && !unavailable
                                  ? 'bg-amber-500 text-zinc-950 font-bold'
                                  : unavailable
                                  ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed line-through'
                                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                              }`}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 4. Dados do Cliente */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-800 pt-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Seu Nome</label>
                      <input
                        type="text"
                        placeholder="Ex: João da Silva"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Telefone / WhatsApp</label>
                      <input
                        type="tel"
                        placeholder="(00) 00000-0000"
                        required
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-4 rounded-xl transition shadow-lg shadow-amber-500/10 flex justify-center items-center gap-2"
                  >
                    <Calendar className="w-5 h-5" /> Confirmar Agendamento
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: CONSULTAR E CANCELAR AGENDAMENTOS */}
            {clientSubTab === 'my-bookings' && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-xl">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-1">Meus Agendamentos</h2>
                  <p className="text-zinc-400 text-sm">Informe seu telefone para consultar ou cancelar seus horários.</p>
                </div>

                <div className="relative mb-6">
                  <input
                    type="tel"
                    placeholder="Digite seu número de telefone registrado..."
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 pl-10 text-white focus:outline-none focus:border-amber-500"
                  />
                  <Search className="w-5 h-5 text-zinc-400 absolute left-3 top-3.5" />
                </div>

                {searchPhone.trim() === '' ? (
                  <p className="text-center text-zinc-500 py-8">Digite seu telefone acima para buscar seus agendamentos.</p>
                ) : userAppointments.length === 0 ? (
                  <p className="text-center text-zinc-500 py-8">Nenhum agendamento encontrado para este telefone.</p>
                ) : (
                  <div className="space-y-4">
                    {userAppointments.map((app) => {
                      const barber = barbers.find(b => b.id === app.barberId);
                      const service = services.find(s => s.id === app.serviceId);

                      return (
                        <div key={app.id} className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-800 flex justify-between items-center flex-wrap gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-base">{service?.name}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                app.status === 'confirmado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                              }`}>
                                {app.status.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-1">
                              Barbeiro: <strong className="text-zinc-200">{barber?.name}</strong>
                            </p>
                            <p className="text-xs text-zinc-400">
                              Data: <strong className="text-zinc-200">{app.date} às {app.time}</strong> ({app.duration} min)
                            </p>
                          </div>

                          {app.status === 'confirmado' && (
                            <button
                              onClick={() => handleCancelAppointment(app.id)}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                            >
                              <Ban className="w-3.5 h-3.5" /> Cancelar Horário
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== ADMIN / PAINEL DE GESTÃO ==================== */}
        {activeTab === 'admin' && (
          !adminAuthenticated ? (
            <div className="max-w-md mx-auto mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
              <div className="text-center mb-6">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
                  <Shield className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold text-white">Acesso restrito</h2>
                <p className="text-sm text-zinc-400 mt-1">Entre para acessar o painel de gestão.</p>
              </div>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Usuário</label>
                  <input type="text" required autoComplete="username" value={adminUsername} onChange={e => { setAdminUsername(e.target.value); setAdminLoginError(''); }} placeholder="Digite seu usuário" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Senha</label>
                  <input type="password" required autoComplete="current-password" value={adminPassword} onChange={e => { setAdminPassword(e.target.value); setAdminLoginError(''); }} placeholder="Digite sua senha" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" />
                </div>
                {adminLoginError && <p className="text-sm text-red-400 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{adminLoginError}</p>}
                <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3 rounded-lg transition">Entrar no painel</button>
              </form>
            </div>
          ) : (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button onClick={() => { setAdminChangePasswordOpen(current => !current); setAdminPasswordMessage(''); }} className="text-xs text-zinc-400 hover:text-amber-400 flex items-center gap-1.5"><Settings className="w-3.5 h-3.5" /> Alterar senha</button>
            </div>
            {adminChangePasswordOpen && (
              <form onSubmit={e => handleChangePassword('admin', e)} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 max-w-md ml-auto space-y-3">
                <h3 className="font-bold text-white">Alterar senha do painel</h3>
                <input type="password" required value={adminCurrentPassword} onChange={e => setAdminCurrentPassword(e.target.value)} placeholder="Senha atual" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm" />
                <input type="password" required minLength="6" value={adminNewPassword} onChange={e => setAdminNewPassword(e.target.value)} placeholder="Nova senha (mínimo 6 caracteres)" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm" />
                {adminPasswordMessage && <p className="text-xs text-amber-400">{adminPasswordMessage}</p>}
                <button className="bg-amber-500 text-zinc-950 font-bold px-4 py-2 rounded-lg text-sm">Salvar nova senha</button>
              </form>
            )}
            {/* Sub-menu do Admin */}
            <div className="flex border-b border-zinc-800 overflow-x-auto gap-4 pb-2">
              <button
                onClick={() => setAdminSection('overview')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  adminSection === 'overview' ? 'bg-zinc-800 text-amber-500 border border-zinc-700' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4" /> Visão Geral & Agenda
              </button>
              <button
                onClick={() => setAdminSection('barbers')}
                style={{ display: adminRole === 'barber' ? 'none' : undefined }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  adminSection === 'barbers' ? 'bg-zinc-800 text-amber-500 border border-zinc-700' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" /> Gerenciar Barbeiros
              </button>
              <button
                onClick={() => setAdminSection('services')}
                style={{ display: adminRole === 'barber' ? 'none' : undefined }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  adminSection === 'services' ? 'bg-zinc-800 text-amber-500 border border-zinc-700' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Scissors className="w-4 h-4" /> Serviços e Preços
              </button>
              <button
                onClick={() => setAdminSection('blocks')}
                style={{ display: adminRole === 'barber' ? 'none' : undefined }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  adminSection === 'blocks' ? 'bg-zinc-800 text-amber-500 border border-zinc-700' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <CalendarX className="w-4 h-4" /> Bloqueio de Horários / Almoço
              </button>
              <button
                onClick={() => setAdminSection('settings')}
                style={{ display: adminRole === 'barber' ? 'none' : undefined }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  adminSection === 'settings' ? 'bg-zinc-800 text-amber-500 border border-zinc-700' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" /> Configurações
              </button>
            </div>

            {/* SEÇÃO: VISÃO GERAL */}
            {adminSection === 'overview' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Visão Geral & Agenda</h2>
                    <p className="text-sm text-zinc-400 mt-1">Acompanhe os horários e faça reservas para seus clientes.</p>
                  </div>
                  <button
                    onClick={() => { setAdminBookingOpen(current => !current); setAdminBookingError(''); }}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition"
                  >
                    {adminBookingOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {adminBookingOpen ? 'Fechar formulário' : 'Novo agendamento'}
                  </button>
                </div>

                {adminBookingOpen && (
                  <form onSubmit={handleCreateAdminAppointment} className="bg-zinc-900 border border-amber-500/30 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500"><Calendar className="w-5 h-5" /></div>
                      <div>
                        <h3 className="font-bold text-white">Cadastrar novo agendamento</h3>
                        <p className="text-xs text-zinc-400">A reserva será confirmada imediatamente na agenda.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Nome do cliente</label>
                        <input type="text" required value={adminBooking.clientName} onChange={e => handleAdminBookingChange('clientName', e.target.value)} placeholder="Ex: João da Silva" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-amber-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Telefone / WhatsApp</label>
                        <input type="tel" required value={adminBooking.clientPhone} onChange={e => handleAdminBookingChange('clientPhone', e.target.value)} placeholder="(00) 00000-0000" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-amber-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Barbeiro</label>
                        <select value={adminBooking.barberId} onChange={e => handleAdminBookingChange('barberId', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm">
                          {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Serviço</label>
                        <select value={adminBooking.serviceId} onChange={e => handleAdminBookingChange('serviceId', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm">
                          {services.map(s => <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Data</label>
                        <input type="date" required value={adminBooking.date} onChange={e => handleAdminBookingChange('date', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Forma de pagamento</label>
                        <select value={adminBooking.paymentMethod} onChange={e => handleAdminBookingChange('paymentMethod', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"><option value="pix">Pix</option><option value="dinheiro">Dinheiro</option><option value="cartao">Cartão</option></select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Horário</label>
                        <select value={adminBooking.time} onChange={e => handleAdminBookingChange('time', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm">
                          {timeSlots.map(time => {
                            const unavailable = isSlotUnavailable(adminBooking.barberId, adminBooking.date, time, adminBooking.serviceId);
                            return <option key={time} value={time} disabled={unavailable}>{time}{unavailable ? ' - indisponível' : ''}</option>;
                          })}
                        </select>
                      </div>
                    </div>
                    {adminBookingError && <p className="mt-4 text-sm text-red-400 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{adminBookingError}</p>}
                    <div className="flex justify-end mt-5">
                      <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition"><CheckCircle2 className="w-4 h-4" /> Confirmar agendamento</button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <div className="flex justify-between items-center text-zinc-400 mb-2">
                      <span className="text-xs font-semibold uppercase">Faturamento Total</span>
                      <DollarSign className="w-5 h-5 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-bold text-white">R$ {visibleRevenue.toFixed(2)}</p>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <div className="flex justify-between items-center text-zinc-400 mb-2">
                      <span className="text-xs font-semibold uppercase">Total de Agendamentos Ativos</span>
                      <Calendar className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="text-2xl font-bold text-white">{visibleConfirmedAppointments.length}</p>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <div className="flex justify-between items-center text-zinc-400 mb-2">
                      <span className="text-xs font-semibold uppercase">Barbeiros Ativos</span>
                      <User className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-white">{adminRole === 'admin' ? barbers.length : 1}</p>
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-5">
                    <div><h3 className="text-lg font-bold text-white">Relatório de faturamento</h3><p className="text-xs text-zinc-400 mt-1">Consulte quanto foi faturado por barbeiro e forma de pagamento.</p></div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className="text-xs text-zinc-400">De<input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} className="block mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white text-sm" /></label>
                      <label className="text-xs text-zinc-400">Até<input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} className="block mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white text-sm" /></label>
                      <label className="text-xs text-zinc-400">Pagamento<select value={reportPaymentMethod} onChange={e => setReportPaymentMethod(e.target.value)} className="block mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white text-sm"><option value="todos">Todos</option><option value="pix">Pix</option><option value="dinheiro">Dinheiro</option><option value="cartao">Cartão</option></select></label>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4"><span className="text-sm text-zinc-400">Total no período</span><strong className="text-xl text-emerald-400">R$ {reportRevenue.toFixed(2)}</strong></div>
                  <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-zinc-800 text-zinc-400 text-xs uppercase"><tr><th className="py-3 px-3">Barbeiro</th><th className="py-3 px-3">Pix</th><th className="py-3 px-3">Dinheiro</th><th className="py-3 px-3">Cartão</th><th className="py-3 px-3">Total</th></tr></thead><tbody className="divide-y divide-zinc-800">{reportByBarber.map(item => <tr key={item.barber.id}><td className="py-3 px-3 font-semibold text-white">{item.barber.name}</td><td className="py-3 px-3 text-zinc-300">R$ {item.pix.toFixed(2)}</td><td className="py-3 px-3 text-zinc-300">R$ {item.dinheiro.toFixed(2)}</td><td className="py-3 px-3 text-zinc-300">R$ {item.cartao.toFixed(2)}</td><td className="py-3 px-3 font-bold text-emerald-400">R$ {item.total.toFixed(2)}</td></tr>)}</tbody></table></div>
                </div>

                {adminRole === 'admin' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Faturamento por barbeiro</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{barbers.map(barber => { const revenue = confirmedAppointments.filter(app => app.barberId === barber.id).reduce((sum, app) => sum + app.price, 0); return <div key={barber.id} className="bg-zinc-800/50 border border-zinc-800 rounded-lg p-4"><p className="text-sm font-semibold text-white">{barber.name}</p><p className="text-lg font-bold text-emerald-400 mt-1">R$ {revenue.toFixed(2)}</p></div>; })}</div>
                </div>
                )}

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">{adminRole === 'admin' ? 'Agenda do Estabelecimento' : 'Minha agenda'}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-zinc-800 text-zinc-400 text-xs uppercase">
                        <tr>
                          <th className="py-3 px-4">Cliente</th>
                          <th className="py-3 px-4">Barbeiro</th>
                          <th className="py-3 px-4">Serviço</th>
                          <th className="py-3 px-4">Data/Hora</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Valor</th>
                          <th className="py-3 px-4 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {visibleAppointments.map((app) => {
                          const barber = barbers.find(b => b.id === app.barberId);
                          const service = services.find(s => s.id === app.serviceId);
                          return (
                            <tr key={app.id} className="hover:bg-zinc-800/30">
                              <td className="py-3 px-4 font-medium text-white">{app.clientName}<br/><span className="text-xs text-zinc-500">{app.clientPhone}</span></td>
                              <td className="py-3 px-4 text-zinc-300">{barber?.name || 'Não atribuído'}</td>
                              <td className="py-3 px-4 text-zinc-300">{service?.name || 'Serviço'}</td>
                              <td className="py-3 px-4 text-zinc-300">{app.date} às {app.time}</td>
                              <td className="py-3 px-4">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  app.status === 'confirmado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                                }`}>
                                  {app.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-bold text-emerald-400">R$ {app.price}</td>
                              <td className="py-3 px-4 text-right">
                                {app.status === 'confirmado' && (
                                  <button
                                    onClick={() => handleCancelAppointment(app.id)}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-lg transition"
                                    title="Cancelar Agendamento"
                                  >
                                    <Ban className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SEÇÃO: GERENCIAR BARBEIROS */}
            {adminSection === 'barbers' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-md font-bold text-white mb-4">
                    {editingBarber ? 'Editar Barbeiro' : 'Cadastrar Novo Barbeiro'}
                  </h3>
                  {editingBarber ? (
                    <form onSubmit={handleUpdateBarber} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Nome Completo</label>
                        <input
                          type="text"
                          required
                          value={editingBarber.name}
                          onChange={(e) => setEditingBarber({...editingBarber, name: e.target.value})}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Especialidade / Função</label>
                        <input
                          type="text"
                          value={editingBarber.role}
                          onChange={(e) => setEditingBarber({...editingBarber, role: e.target.value})}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Comissão (%)</label>
                        <input
                          type="number"
                          value={editingBarber.commission}
                          onChange={(e) => setEditingBarber({...editingBarber, commission: Number(e.target.value)})}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Foto do barbeiro</label>
                        <div className="flex items-center gap-3">
                          <img src={editingBarber.avatar} alt="Pré-visualização" className="w-12 h-12 rounded-full object-cover border border-zinc-700" />
                          <input type="file" accept="image/*" onChange={(e) => handleBarberPhoto(e.target.files?.[0], avatar => setEditingBarber({...editingBarber, avatar}))} className="w-full text-xs text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-zinc-600" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-amber-500 text-zinc-950 font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-1">
                          <Save className="w-4 h-4" /> Salvar
                        </button>
                        <button type="button" onClick={() => setEditingBarber(null)} className="bg-zinc-800 text-zinc-300 py-2.5 px-3 rounded-lg text-sm">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleAddBarber} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Nome Completo</label>
                        <input
                          type="text"
                          required
                          value={newBarberName}
                          onChange={(e) => setNewBarberName(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Especialidade / Função</label>
                        <input
                          type="text"
                          value={newBarberRole}
                          onChange={(e) => setNewBarberRole(e.target.value)}
                          placeholder="Ex: Barba / Degradê"
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Comissão (%)</label>
                        <input
                          type="number"
                          value={newBarberCommission}
                          onChange={(e) => setNewBarberCommission(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Foto do barbeiro</label>
                        <div className="flex items-center gap-3">
                          {newBarberPhoto ? <img src={newBarberPhoto} alt="Pré-visualização" className="w-12 h-12 rounded-full object-cover border border-zinc-700" /> : <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500"><User className="w-5 h-5" /></div>}
                          <input type="file" accept="image/*" onChange={(e) => handleBarberPhoto(e.target.files?.[0], setNewBarberPhoto)} className="w-full text-xs text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-zinc-600" />
                        </div>
                      </div>
                      <button type="submit" className="w-full bg-amber-500 text-zinc-950 font-bold py-2.5 rounded-lg text-sm">
                        Adicionar Barbeiro
                      </button>
                    </form>
                  )}
                </div>

                <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-md font-bold text-white mb-4">Barbeiros Cadastrados</h3>
                  <div className="space-y-3">
                    {barbers.map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl border border-zinc-800">
                        <div className="flex items-center gap-3">
                          <img src={b.avatar} alt={b.name} className="w-10 h-10 rounded-full object-cover" />
                          <div>
                            <p className="font-semibold text-white">{b.name}</p>
                            <p className="text-xs text-zinc-400">{b.role} • Comissão: {b.commission}%</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingBarber(b)}
                            className="text-amber-400 hover:text-amber-300 p-2"
                            title="Editar Barbeiro"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setBarbers(barbers.filter(item => item.id !== b.id))}
                            className="text-red-400 hover:text-red-300 p-2"
                            title="Excluir Barbeiro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SEÇÃO: SERVIÇOS E PREÇOS */}
            {adminSection === 'services' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-md font-bold text-white mb-4">
                    {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                  </h3>
                  {editingService ? (
                    <form onSubmit={handleUpdateService} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Nome do Serviço</label>
                        <input
                          type="text"
                          required
                          value={editingService.name}
                          onChange={(e) => setEditingService({...editingService, name: e.target.value})}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Preço (R$)</label>
                        <input
                          type="number"
                          required
                          value={editingService.price}
                          onChange={(e) => setEditingService({...editingService, price: Number(e.target.value)})}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Duração (minutos)</label>
                        <input
                          type="number"
                          value={editingService.duration}
                          onChange={(e) => setEditingService({...editingService, duration: Number(e.target.value)})}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Descrição do atendimento</label>
                        <textarea value={editingService.description || ''} onChange={(e) => setEditingService({...editingService, description: e.target.value})} placeholder="Descreva o que está incluído neste serviço" rows="3" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm resize-none" />
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-amber-500 text-zinc-950 font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-1">
                          <Save className="w-4 h-4" /> Salvar
                        </button>
                        <button type="button" onClick={() => setEditingService(null)} className="bg-zinc-800 text-zinc-300 py-2.5 px-3 rounded-lg text-sm">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleAddService} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Nome do Serviço</label>
                        <input
                          type="text"
                          required
                          value={newServiceName}
                          onChange={(e) => setNewServiceName(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Preço (R$)</label>
                        <input
                          type="number"
                          required
                          value={newServicePrice}
                          onChange={(e) => setNewServicePrice(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Duração (minutos)</label>
                        <input
                          type="number"
                          value={newServiceDuration}
                          onChange={(e) => setNewServiceDuration(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Descrição do atendimento</label>
                        <textarea value={newServiceDescription} onChange={(e) => setNewServiceDescription(e.target.value)} placeholder="Ex: inclui lavagem, acabamento e finalização" rows="3" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm resize-none" />
                      </div>
                      <button type="submit" className="w-full bg-amber-500 text-zinc-950 font-bold py-2.5 rounded-lg text-sm">
                        Cadastrar Serviço
                      </button>
                    </form>
                  )}
                </div>

                <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-md font-bold text-white mb-4">Serviços Oferecidos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {services.map((s) => (
                      <div key={s.id} className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-800 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-white">{s.name}</p>
                          <p className="text-xs text-zinc-400">{s.duration} min • {s.category}</p>
                          {s.description && <p className="text-xs text-zinc-500 mt-1 max-w-sm">{s.description}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-400">R$ {s.price}</span>
                          <button
                            onClick={() => setEditingService(s)}
                            className="text-amber-400 hover:text-amber-300 p-1"
                            title="Editar Serviço"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(s.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Excluir Serviço"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SEÇÃO: CONFIGURAÇÕES */}
            {adminSection === 'settings' && (
              <form onSubmit={saveShopSettings} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><h2 className="text-2xl font-bold text-white">Configurações da Barbearia</h2><p className="text-sm text-zinc-400 mt-1">Personalize sua página e os canais de atendimento.</p></div>{settingsSaved && <span className="text-sm text-emerald-400">Configurações salvas</span>}</div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4"><h3 className="font-bold text-white">Identidade do estabelecimento</h3>
                    <label className="block text-xs font-semibold text-zinc-400">Nome do estabelecimento<input value={shopSettings.name} onChange={e => handleSettingsChange('name', e.target.value)} className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm" /></label>
                    <label className="block text-xs font-semibold text-zinc-400">Tipo de negócio<select value={shopSettings.businessType} onChange={e => handleSettingsChange('businessType', e.target.value)} className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"><option>Barbearia</option><option>Salão de beleza</option><option>Espaço de beleza</option><option>Estúdio de estética</option><option>Outro</option></select></label>
                    <label className="block text-xs font-semibold text-zinc-400">Logo do estabelecimento<div className="flex items-center gap-3 mt-1">{shopSettings.logo ? <img src={shopSettings.logo} alt="Prévia da logo" className="w-16 h-16 rounded-xl object-cover border border-zinc-700" /> : <div className="w-16 h-16 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-zinc-500">Sem logo</div>}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => handleShopLogo(e.target.files?.[0])} className="w-full text-xs text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white" /></div></label>
                    <label className="block text-xs font-semibold text-zinc-400">Descrição pública<textarea value={shopSettings.description} onChange={e => handleSettingsChange('description', e.target.value)} placeholder="Apresente seu estabelecimento aos clientes" rows="3" className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm resize-none" /></label>
                    <label className="block text-xs font-semibold text-zinc-400">Telefone<input value={shopSettings.phone} onChange={e => handleSettingsChange('phone', e.target.value)} className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm" /></label>
                    <label className="block text-xs font-semibold text-zinc-400">Endereço<input value={shopSettings.address} onChange={e => handleSettingsChange('address', e.target.value)} className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm" /></label>
                    <label className="block text-xs font-semibold text-zinc-400">Link do Instagram<input type="url" value={shopSettings.instagram} onChange={e => handleSettingsChange('instagram', e.target.value)} placeholder="https://instagram.com/suaempresa" className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm" /></label>
                    <label className="block text-xs font-semibold text-zinc-400">Link da localização<input type="url" value={shopSettings.locationUrl} onChange={e => handleSettingsChange('locationUrl', e.target.value)} placeholder="Link do Google Maps" className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm" /></label>
                    <label className="block text-xs font-semibold text-zinc-400">Cor da página<div className="flex items-center gap-3 mt-1"><input type="color" value={shopSettings.primaryColor} onChange={e => handleSettingsChange('primaryColor', e.target.value)} className="w-12 h-10 bg-zinc-800 border border-zinc-700 rounded-lg p-1" /><span className="text-sm text-zinc-300">{shopSettings.primaryColor}</span></div></label>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4"><h3 className="font-bold text-white">WhatsApp e atendimento</h3>
                    <label className="block text-xs font-semibold text-zinc-400">Número do WhatsApp (com DDD)<input value={shopSettings.whatsapp} onChange={e => handleSettingsChange('whatsapp', e.target.value.replace(/\D/g, ''))} placeholder="5511999999999" className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm" /></label>
                    <label className="block text-xs font-semibold text-zinc-400">Mensagem de confirmação<textarea value={shopSettings.confirmationMessage} onChange={e => handleSettingsChange('confirmationMessage', e.target.value)} rows="3" className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm resize-none" /></label>
                    <label className="block text-xs font-semibold text-zinc-400">Mensagem de lembrete<textarea value={shopSettings.reminderMessage} onChange={e => handleSettingsChange('reminderMessage', e.target.value)} rows="3" className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm resize-none" /></label>
                    <label className="block text-xs font-semibold text-zinc-400">Antecedência do lembrete<select value={shopSettings.reminderMinutes} onChange={e => handleSettingsChange('reminderMinutes', Number(e.target.value))} className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"><option value="60">1 hora antes</option><option value="1440">1 dia antes</option><option value="2880">2 dias antes</option></select></label>
                    <div className="border-t border-zinc-800 pt-4 space-y-3"><p className="text-sm font-bold text-white">API oficial do WhatsApp Business</p><p className="text-xs text-zinc-500">Esses dados devem ser preenchidos pelo administrador da conta Meta. O token será enviado ao backend protegido quando a integração estiver ativa.</p>
                      <label className="block text-xs font-semibold text-zinc-400">ID do número de telefone<input value={shopSettings.metaPhoneNumberId} onChange={e => handleSettingsChange('metaPhoneNumberId', e.target.value)} placeholder="Ex: 123456789012345" className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm" /></label>
                      <label className="block text-xs font-semibold text-zinc-400">ID da conta WhatsApp Business<input value={shopSettings.metaBusinessAccountId} onChange={e => handleSettingsChange('metaBusinessAccountId', e.target.value)} placeholder="Ex: 123456789012345" className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm" /></label>
                      <label className="block text-xs font-semibold text-zinc-400">Token de acesso<input type="password" value={shopSettings.metaAccessToken} onChange={e => handleSettingsChange('metaAccessToken', e.target.value)} placeholder="Token permanente da Meta" className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm" /></label>
                    </div>
                    <label className="flex items-center justify-between gap-3 text-sm text-zinc-300 py-2 border-t border-zinc-800"><span>Permitir agendamento online</span><input type="checkbox" checked={shopSettings.onlineBookingEnabled} onChange={e => handleSettingsChange('onlineBookingEnabled', e.target.checked)} className="accent-amber-500 w-4 h-4" /></label>
                    <label className="flex items-center justify-between gap-3 text-sm text-zinc-300"><span>Enviar lembrete de horário</span><input type="checkbox" checked={shopSettings.reminderEnabled} onChange={e => handleSettingsChange('reminderEnabled', e.target.checked)} className="accent-amber-500 w-4 h-4" /></label>
                  </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"><p className="text-xs uppercase font-semibold text-zinc-500 mb-3">Prévia da identidade pública</p><div className="rounded-lg p-5 border flex items-center gap-4" style={{ borderColor: shopSettings.primaryColor, backgroundColor: `${shopSettings.primaryColor}15` }}>{shopSettings.logo && <img src={shopSettings.logo} alt="Logo" className="w-16 h-16 rounded-xl object-cover" />}<div><p className="text-xs text-zinc-400">{shopSettings.businessType}</p><p className="font-bold text-lg" style={{ color: shopSettings.primaryColor }}>{shopSettings.name || 'Seu estabelecimento'}</p><p className="text-sm text-zinc-300 mt-1">{shopSettings.description}</p><p className="text-xs text-zinc-400 mt-1">{shopSettings.address} • {shopSettings.phone}</p></div></div></div>
                <div className="flex justify-end"><button type="submit" className={`font-bold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition ${actionFeedback === 'Configurações concluídas' ? 'bg-emerald-500 text-white' : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'}`}><CheckCircle2 className="w-4 h-4" /> {actionFeedback === 'Configurações concluídas' ? 'Concluído' : 'Salvar configurações'}</button></div>
              </form>
            )}

            {/* SEÇÃO: BLOQUEIO DE HORÁRIOS */}
            {adminSection === 'blocks' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-md font-bold text-white mb-4">Cadastrar Bloqueio de Horário</h3>
                  <form onSubmit={handleAddTimeBlock} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">Barbeiro</label>
                      <select
                        value={blockBarberId}
                        onChange={(e) => setBlockBarberId(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                      >
                        {barbers.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">Frequência</label>
                      <select
                        value={blockIsRecurring ? 'recurring' : 'single'}
                        onChange={(e) => setBlockIsRecurring(e.target.value === 'recurring')}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-amber-400 font-medium text-sm"
                      >
                        <option value="recurring">Todos os Dias (Almoço / Horário Fixo)</option>
                        <option value="single">Apenas nesta data específica</option>
                      </select>
                    </div>

                    {!blockIsRecurring && (
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Data Específica</label>
                        <input
                          type="date"
                          value={blockDate}
                          onChange={(e) => setBlockDate(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Início</label>
                        <input
                          type="time"
                          value={blockStartTime}
                          onChange={(e) => setBlockStartTime(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Fim</label>
                        <input
                          type="time"
                          value={blockEndTime}
                          onChange={(e) => setBlockEndTime(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">Motivo do Bloqueio</label>
                      <input
                        type="text"
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                      />
                    </div>

                    <button type="submit" className="w-full bg-amber-500 text-zinc-950 font-bold py-2.5 rounded-lg text-sm flex justify-center items-center gap-2">
                      <Lock className="w-4 h-4" /> Cadastrar Bloqueio
                    </button>
                  </form>
                </div>

                <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-md font-bold text-white mb-4">Bloqueios e Horários de Almoço Ativos</h3>
                  <div className="space-y-3">
                    {timeBlocks.map((blk) => {
                      const barber = barbers.find(b => b.id === blk.barberId);
                      return (
                        <div key={blk.id} className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-800 flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-white">{barber?.name || 'Barbeiro'}</p>
                              {blk.isRecurring && (
                                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                                  <Repeat className="w-3 h-3" /> Fixo / Diário
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-amber-500 font-medium mt-1">{blk.reason}</p>
                            <p className="text-xs text-zinc-400">
                              {blk.isRecurring ? 'Recorrente diário' : blk.date} • das {blk.startTime} às {blk.endTime}
                            </p>
                          </div>
                          <button
                            onClick={() => setTimeBlocks(timeBlocks.filter(item => item.id !== blk.id))}
                            className="text-red-400 hover:text-red-300 p-2"
                            title="Remover Bloqueio"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          )
        )}

        {/* ==================== PAINEL DA PLATAFORMA ==================== */}
        {activeTab === 'platform' && (
          !platformAuthenticated ? (
            <div className="max-w-md mx-auto mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
              <div className="text-center mb-6">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4"><Building2 className="w-7 h-7" /></div>
                <h2 className="text-2xl font-bold text-white">Painel da Plataforma</h2>
                <p className="text-sm text-zinc-400 mt-1">Acesso exclusivo do administrador do sistema.</p>
              </div>
              <form onSubmit={handlePlatformLogin} className="space-y-4">
                <input type="text" required value={platformUsername} onChange={e => { setPlatformUsername(e.target.value); setPlatformLoginError(''); }} placeholder="Usuário master" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" />
                <input type="password" required value={platformPassword} onChange={e => { setPlatformPassword(e.target.value); setPlatformLoginError(''); }} placeholder="Senha" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" />
                {platformLoginError && <p className="text-sm text-red-400 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{platformLoginError}</p>}
                <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3 rounded-lg transition">Entrar na plataforma</button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div><h2 className="text-2xl font-bold text-white">Minha Plataforma</h2><p className="text-sm text-zinc-400 mt-1">Controle de clientes, planos e acesso ao serviço.</p></div>
                <button onClick={() => { setPlatformChangePasswordOpen(current => !current); setPlatformPasswordMessage(''); }} className="text-xs text-zinc-400 hover:text-amber-400 flex items-center gap-1.5"><Settings className="w-3.5 h-3.5" /> Alterar senha</button>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1.5 w-fit">Administrador master</span>
              </div>
              {platformChangePasswordOpen && (
                <form onSubmit={e => handleChangePassword('platform', e)} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 max-w-md ml-auto space-y-3">
                  <h3 className="font-bold text-white">Alterar senha master</h3>
                  <input type="password" required value={platformCurrentPassword} onChange={e => setPlatformCurrentPassword(e.target.value)} placeholder="Senha atual" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm" />
                  <input type="password" required minLength="6" value={platformNewPassword} onChange={e => setPlatformNewPassword(e.target.value)} placeholder="Nova senha (mínimo 6 caracteres)" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm" />
                  {platformPasswordMessage && <p className="text-xs text-amber-400">{platformPasswordMessage}</p>}
                  <button className="bg-amber-500 text-zinc-950 font-bold px-4 py-2 rounded-lg text-sm">Salvar nova senha</button>
                </form>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"><p className="text-xs font-semibold uppercase text-zinc-400">Total de clientes</p><p className="text-2xl font-bold text-white mt-2">{barbershops.length}</p></div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"><p className="text-xs font-semibold uppercase text-zinc-400">Serviços ativos</p><p className="text-2xl font-bold text-emerald-400 mt-2">{barbershops.filter(s => s.status === 'ativo').length}</p></div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"><p className="text-xs font-semibold uppercase text-zinc-400">Acesso suspenso</p><p className="text-2xl font-bold text-red-400 mt-2">{barbershops.filter(s => s.status === 'suspenso').length}</p></div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Barbearias clientes</h3>
                <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-zinc-800 text-zinc-400 text-xs uppercase"><tr><th className="py-3 px-4">Barbearia</th><th className="py-3 px-4">Responsável</th><th className="py-3 px-4">Plano</th><th className="py-3 px-4">Pagamento</th><th className="py-3 px-4">Status</th><th className="py-3 px-4 text-right">Ação</th></tr></thead>
                  <tbody className="divide-y divide-zinc-800">{barbershops.map(shop => <tr key={shop.id} className="hover:bg-zinc-800/30"><td className="py-4 px-4 font-semibold text-white">{shop.name}<span className="block text-xs text-zinc-500 mt-1">Próximo vencimento: {shop.nextPayment}</span></td><td className="py-4 px-4 text-zinc-300">{shop.owner}</td><td className="py-4 px-4 text-zinc-300">{shop.plan}</td><td className={`py-4 px-4 ${shop.payment === 'Em dia' ? 'text-emerald-400' : 'text-red-400'}`}>{shop.payment}</td><td className="py-4 px-4"><span className={`text-[10px] px-2 py-1 rounded-full font-bold ${shop.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>{shop.status.toUpperCase()}</span></td><td className="py-4 px-4 text-right"><button onClick={() => toggleBarbershopAccess(shop.id)} className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ml-auto ${shop.status === 'ativo' ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20' : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'}`}><Power className="w-3.5 h-3.5" />{shop.status === 'ativo' ? 'Suspender' : 'Reativar'}</button></td></tr>)}</tbody>
                </table></div>
              </div>
            </div>
          )
        )}
      </main>
      <footer className="max-w-7xl mx-auto px-4 pb-8 text-center">
        <button onClick={() => setActiveTab('platform')} className="text-xs text-zinc-500 hover:text-amber-400 transition">Acesso administrativo da plataforma</button>
      </footer>
    </div>
  );
}
