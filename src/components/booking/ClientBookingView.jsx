import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, Scissors, User, CheckCircle2,
  AlertCircle, Search, Ban, MessageCircle, Instagram, MapPin
} from 'lucide-react';
import { useEstablishment } from '../../contexts/EstablishmentContext';
import {
  getTodayISO,
  getDayConfig,
  isDayOpen,
  getTimeSlotsForDate,
  isSlotUnavailable
} from '../../utils/dateUtils';
import { formatPhone, cleanPhone } from '../../utils/phoneUtils';
import { openWhatsAppMessage } from '../../utils/whatsappUtils';

export default function ClientBookingView() {
  const {
    shopSettings,
    operatingHours,
    barbers,
    services,
    appointments,
    timeBlocks,
    bookAppointment,
    cancelAppointment,
    lookupMyAppointments
  } = useEstablishment();

  const today = getTodayISO();

  // Tabs
  const [subTab, setSubTab] = useState('book'); // 'book' | 'my-bookings'

  // Booking Form State
  const [selectedBarber, setSelectedBarber] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [bookingDate, setBookingDate] = useState(today);
  const [bookingTime, setBookingTime] = useState('10:00');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Lookup State
  const [searchPhone, setSearchPhone] = useState('');
  const [lookupResults, setLookupResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Sync initial selection
  useEffect(() => {
    if (barbers.length && (!selectedBarber || !barbers.some(b => b.id === selectedBarber))) {
      setSelectedBarber(barbers[0].id);
    }
    if (services.length && (!selectedService || !services.some(s => s.id === selectedService))) {
      setSelectedService(services[0].id);
    }
  }, [barbers, services, selectedBarber, selectedService]);

  // Lookup debounce
  useEffect(() => {
    const raw = cleanPhone(searchPhone);
    if (raw.length < 8) {
      setLookupResults([]);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      const results = await lookupMyAppointments(searchPhone);
      setLookupResults(results);
      setSearching(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchPhone]);

  const handlePhoneChange = (e) => {
    setClientPhone(formatPhone(e.target.value));
    setBookingError('');
  };

  const handleSearchPhoneChange = (e) => {
    setSearchPhone(formatPhone(e.target.value));
  };

  // Submit Booking
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!clientName.trim() || cleanPhone(clientPhone).length < 10) {
      setBookingError('Por favor, informe seu nome e um número de WhatsApp válido.');
      return;
    }

    const currentService = services.find(s => s.id === selectedService);
    const duration = currentService?.duration || 30;

    const dayConfig = getDayConfig(bookingDate, operatingHours);
    if (!isDayOpen(bookingDate, operatingHours)) {
      setBookingError(`A barbearia está fechada às ${dayConfig?.name || 'nesta data'}. Por favor, escolha outro dia.`);
      return;
    }

    if (isSlotUnavailable(selectedBarber, bookingDate, bookingTime, duration, timeBlocks, appointments, operatingHours)) {
      setBookingError('Este horário não está mais disponível. Por favor, escolha outro.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    const res = await bookAppointment({
      clientName,
      clientPhone,
      barberId: selectedBarber,
      serviceId: selectedService,
      date: bookingDate,
      time: bookingTime
    });

    setBookingLoading(false);

    if (!res.success) {
      setBookingError(res.error || 'Não foi possível confirmar o agendamento.');
      return;
    }

    // Success! Open WhatsApp notification
    openWhatsAppMessage({
      clientName,
      clientPhone,
      barberId: selectedBarber,
      serviceId: selectedService,
      date: bookingDate,
      time: bookingTime
    }, 'confirmed', shopSettings, barbers, services);

    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setClientName('');
      setClientPhone('');
    }, 4500);
  };

  // Cancel Booking
  const handleCancel = async (appId) => {
    if (!window.confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    const target = lookupResults.find(a => a.id === appId) || appointments.find(a => a.id === appId);
    const phone = target?.clientPhone || searchPhone;

    const res = await cancelAppointment(appId, phone);
    if (!res.success) {
      alert(res.error || 'Erro ao cancelar agendamento.');
      return;
    }

    if (target) {
      openWhatsAppMessage(target, 'cancelled', shopSettings, barbers, services);
    }

    // Refresh lookup
    if (searchPhone) {
      const updated = await lookupMyAppointments(searchPhone);
      setLookupResults(updated);
    }
  };

  const currentSelectedService = services.find(s => s.id === selectedService);
  const currentDuration = currentSelectedService?.duration || 30;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Shop Info Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-4">
          {shopSettings.logo ? (
            <img
              src={shopSettings.logo}
              alt={shopSettings.name}
              className="w-16 h-16 rounded-xl object-cover border border-zinc-800 shadow-md"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Scissors className="w-8 h-8" />
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-wider text-amber-500 font-semibold">
              {shopSettings.businessType}
            </p>
            <h2 className="text-2xl font-bold text-white">{shopSettings.name}</h2>
            <p className="text-sm text-zinc-400 mt-1">{shopSettings.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {shopSettings.whatsapp && (
            <a
              href={`https://wa.me/55${cleanPhone(shopSettings.whatsapp)}`}
              target="_blank"
              rel="noreferrer"
              title="Chamar no WhatsApp"
              className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          )}
          {shopSettings.instagram && (
            <a
              href={shopSettings.instagram}
              target="_blank"
              rel="noreferrer"
              title="Instagram"
              className="p-2.5 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/30 hover:bg-pink-500/20 transition"
            >
              <Instagram className="w-4 h-4" />
            </a>
          )}
          {shopSettings.locationUrl && (
            <a
              href={shopSettings.locationUrl}
              target="_blank"
              rel="noreferrer"
              title="Como chegar"
              className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition"
            >
              <MapPin className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Subtabs Switcher */}
      <div className="flex justify-center gap-2 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800 w-max mx-auto">
        <button
          onClick={() => setSubTab('book')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            subTab === 'book' ? 'bg-zinc-800 text-amber-400 font-bold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Novo Agendamento
        </button>
        <button
          onClick={() => setSubTab('my-bookings')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            subTab === 'my-bookings' ? 'bg-zinc-800 text-amber-400 font-bold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Meus Agendamentos / Cancelar
        </button>
      </div>

      {/* SUBTAB 1: NOVO AGENDAMENTO */}
      {subTab === 'book' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-1">Agende seu Horário</h2>
            <p className="text-zinc-400 text-sm">Escolha o serviço, profissional e horário ideal para você.</p>
          </div>

          {bookingSuccess && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-400">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <div>
                <h4 className="font-bold">Agendamento Realizado com Sucesso!</h4>
                <p className="text-xs text-emerald-300">
                  Seu horário foi reservado e a mensagem de confirmação foi preparada no WhatsApp.
                </p>
              </div>
            </div>
          )}

          {bookingError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <p className="text-sm font-medium">{bookingError}</p>
            </div>
          )}

          <form onSubmit={handleSubmitBooking} className="space-y-6">
            {/* 1. Escolha o Profissional */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                1. Escolha o Profissional
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {barbers.map((b) => (
                  <button
                    type="button"
                    key={b.id}
                    onClick={() => { setSelectedBarber(b.id); setBookingError(''); }}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition text-left ${
                      selectedBarber === b.id
                        ? 'bg-amber-500/10 border-amber-500 text-white'
                        : 'bg-zinc-800/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <img src={b.avatar} alt={b.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    <div className="overflow-hidden">
                      <p className="font-medium text-sm text-white truncate">{b.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{b.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Selecione o Serviço */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                2. Selecione o Serviço
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => { setSelectedService(s.id); setBookingError(''); }}
                    className={`p-3.5 rounded-xl border flex justify-between items-center transition text-left ${
                      selectedService === s.id
                        ? 'bg-amber-500/10 border-amber-500 text-white ring-1 ring-amber-500/50'
                        : 'bg-zinc-800/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="pr-2">
                      <p className="font-medium text-sm text-white">{s.name}</p>
                      <p className="text-xs text-zinc-500">{s.duration} minutos</p>
                      {s.description && (
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{s.description}</p>
                      )}
                    </div>
                    <span className="font-bold text-amber-500 shrink-0 text-base">
                      R$ {s.price}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Data e Horários */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                3. Escolha a Data
              </label>

              {/* Quick Date Pills */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
                {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                  const d = new Date();
                  d.setDate(d.getDate() + offset);
                  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                  const isSelected = bookingDate === iso;
                  const dayIsOpen = isDayOpen(iso, operatingHours);
                  const label = offset === 0 ? 'Hoje' : offset === 1 ? 'Amanhã' : `${weekdays[d.getDay()]}, ${d.getDate()}`;

                  return (
                    <button
                      type="button"
                      key={iso}
                      onClick={() => { setBookingDate(iso); setBookingError(''); }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border text-center ${
                        isSelected
                          ? 'bg-amber-500 text-zinc-950 border-amber-500 font-bold shadow-md shadow-amber-500/10'
                          : dayIsOpen
                          ? 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60 hover:bg-zinc-700'
                          : 'bg-zinc-900/60 text-zinc-500 border-zinc-800/80 hover:bg-zinc-800'
                      }`}
                    >
                      <span>{label}</span>
                      {!dayIsOpen && (
                        <span className="block text-[9px] text-zinc-500 font-normal">Fechado</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">
                    Ou selecione outra data:
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    min={today}
                    onChange={(e) => { setBookingDate(e.target.value); setBookingError(''); }}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                  {!isDayOpen(bookingDate, operatingHours) && (
                    <p className="text-xs text-red-400 mt-1.5">
                      A barbearia não abre às {getDayConfig(bookingDate, operatingHours)?.name || 'nesta data'}.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Horários Disponíveis ({currentDuration} min)
                  </label>
                  {!isDayOpen(bookingDate, operatingHours) ? (
                    <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 text-center py-7">
                      <p className="text-amber-500 font-semibold text-sm">Barbearia Fechada</p>
                      <p className="text-zinc-400 text-xs mt-1">
                        Não há expediente às {getDayConfig(bookingDate, operatingHours)?.name || 'nesta data'}.
                      </p>
                      <p className="text-zinc-500 text-[11px] mt-1">
                        Por favor, selecione outro dia no calendário ao lado.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-1.5 max-h-44 overflow-y-auto p-2 bg-zinc-950 rounded-xl border border-zinc-800">
                      {getTimeSlotsForDate(bookingDate, operatingHours, 30).map((time) => {
                        const unavailable = isSlotUnavailable(
                          selectedBarber,
                          bookingDate,
                          time,
                          currentDuration,
                          timeBlocks,
                          appointments,
                          operatingHours
                        );

                        return (
                          <button
                            type="button"
                            key={time}
                            disabled={unavailable}
                            onClick={() => { setBookingTime(time); setBookingError(''); }}
                            className={`py-2 text-xs rounded-lg font-medium transition ${
                              bookingTime === time && !unavailable
                                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                                : unavailable
                                ? 'bg-zinc-900/60 text-zinc-600 border border-zinc-900 cursor-not-allowed line-through'
                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Dados do Cliente */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-800 pt-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Seu Nome
                </label>
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
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  WhatsApp com DDD
                </label>
                <input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  required
                  value={clientPhone}
                  onChange={handlePhoneChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={bookingLoading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold py-4 rounded-xl transition shadow-lg shadow-amber-500/10 flex justify-center items-center gap-2 text-base"
            >
              <Calendar className="w-5 h-5" />
              {bookingLoading ? 'Agendando...' : 'Confirmar Agendamento'}
            </button>
          </form>
        </div>
      )}

      {/* SUBTAB 2: MEUS AGENDAMENTOS */}
      {subTab === 'my-bookings' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-1">Meus Agendamentos</h2>
            <p className="text-zinc-400 text-sm">
              Digite seu número de WhatsApp para consultar ou cancelar seus horários.
            </p>
          </div>

          <div className="relative mb-6">
            <input
              type="tel"
              placeholder="(00) 00000-0000"
              value={searchPhone}
              onChange={handleSearchPhoneChange}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3.5 pl-11 text-white focus:outline-none focus:border-amber-500"
            />
            <Search className="w-5 h-5 text-zinc-400 absolute left-3.5 top-4" />
          </div>

          {searchPhone.trim() === '' ? (
            <p className="text-center text-zinc-500 py-8">
              Digite seu telefone acima para buscar seus horários agendados.
            </p>
          ) : searching ? (
            <p className="text-center text-zinc-400 py-8">Buscando agendamentos...</p>
          ) : lookupResults.length === 0 ? (
            <p className="text-center text-zinc-500 py-8">
              Nenhum agendamento encontrado para este número.
            </p>
          ) : (
            <div className="space-y-4">
              {lookupResults.map((app) => {
                const barber = barbers.find(b => b.id === app.barberId);
                const service = services.find(s => s.id === app.serviceId);

                return (
                  <div
                    key={app.id}
                    className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-800 flex justify-between items-center flex-wrap gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">
                          {service?.name || 'Serviço'}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            app.status === 'confirmado'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {app.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        Profissional: <strong className="text-zinc-200">{barber?.name || 'Barbeiro'}</strong>
                      </p>
                      <p className="text-xs text-zinc-400">
                        Data: <strong className="text-zinc-200">{app.date} às {app.time}</strong> ({app.duration || 30} min)
                      </p>
                    </div>

                    {app.status === 'confirmado' && (
                      <button
                        onClick={() => handleCancel(app.id)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
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
  );
}
