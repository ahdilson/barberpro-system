import React, { useState } from 'react';
import {
  Calendar, DollarSign, User, Plus, X, CheckCircle2,
  AlertCircle, Ban
} from 'lucide-react';
import { useEstablishment } from '../../contexts/EstablishmentContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  getTodayISO,
  getDayConfig,
  isDayOpen,
  getTimeSlotsForDate,
  defaultTimeSlots,
  isSlotUnavailable
} from '../../utils/dateUtils';
import { openWhatsAppMessage } from '../../utils/whatsappUtils';

export default function OverviewSection() {
  const {
    barbers,
    services,
    appointments,
    timeBlocks,
    operatingHours,
    adminCreateAppointment,
    cancelAppointment,
    shopSettings
  } = useEstablishment();

  const { adminRole, user } = useAuth();
  const today = getTodayISO();

  // Booking Form State
  const [adminBookingOpen, setAdminBookingOpen] = useState(false);
  const [adminBooking, setAdminBooking] = useState({
    clientName: '',
    clientPhone: '',
    barberId: barbers[0]?.id || '',
    serviceId: services[0]?.id || '',
    date: today,
    time: '09:00',
    paymentMethod: 'pix'
  });
  const [bookingError, setBookingError] = useState('');
  const [feedback, setFeedback] = useState('');

  // Barber filter if logged as barber
  const visibleAppointments = adminRole === 'barber'
    ? appointments.filter(a => a.barberId === user?.id)
    : appointments;

  const confirmedAppointments = visibleAppointments.filter(a => a.status === 'confirmado');
  const totalRevenue = confirmedAppointments.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

  const handleBookingChange = (field, value) => {
    setAdminBooking(prev => ({ ...prev, [field]: value }));
    setBookingError('');
  };

  const handleSubmitAdminBooking = async (e) => {
    e.preventDefault();
    const serviceObj = services.find(s => s.id === adminBooking.serviceId);
    const duration = serviceObj?.duration || 30;

    if (isSlotUnavailable(adminBooking.barberId, adminBooking.date, adminBooking.time, duration, timeBlocks, appointments, operatingHours)) {
      setBookingError('Este horário está indisponível para o barbeiro ou conflita com outro agendamento/horário de fechamento.');
      return;
    }

    const res = await adminCreateAppointment(adminBooking);
    if (!res.success) {
      setBookingError(res.error || 'Erro ao criar agendamento.');
      return;
    }

    openWhatsAppMessage(adminBooking, 'confirmed', shopSettings, barbers, services);
    setAdminBooking(prev => ({ ...prev, clientName: '', clientPhone: '' }));
    setAdminBookingOpen(false);
    setFeedback('Agendamento cadastrado com sucesso!');
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleCancel = async (appId) => {
    if (!window.confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    const target = appointments.find(a => a.id === appId);
    const res = await cancelAppointment(appId, target?.clientPhone);
    if (!res.success) {
      alert(res.error || 'Erro ao cancelar agendamento.');
      return;
    }
    if (target) {
      openWhatsAppMessage(target, 'cancelled', shopSettings, barbers, services);
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {feedback}
        </div>
      )}

      {/* Header and New Appointment Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Visão Geral & Agenda</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Acompanhe a movimentação da barbearia e encaixe novos clientes na agenda.
          </p>
        </div>
        <button
          onClick={() => {
            setAdminBookingOpen(prev => !prev);
            setBookingError('');
          }}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition"
        >
          {adminBookingOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {adminBookingOpen ? 'Fechar formulário' : 'Novo agendamento'}
        </button>
      </div>

      {/* Admin Booking Form */}
      {adminBookingOpen && (
        <form onSubmit={handleSubmitAdminBooking} className="bg-zinc-900 border border-amber-500/30 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white">Cadastrar novo agendamento</h3>
              <p className="text-xs text-zinc-400">A reserva será confirmada imediatamente na agenda.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Nome do cliente</label>
              <input
                type="text"
                required
                value={adminBooking.clientName}
                onChange={e => handleBookingChange('clientName', e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Telefone / WhatsApp</label>
              <input
                type="tel"
                required
                value={adminBooking.clientPhone}
                onChange={e => handleBookingChange('clientPhone', e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Barbeiro</label>
              <select
                value={adminBooking.barberId}
                onChange={e => handleBookingChange('barberId', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
              >
                {barbers.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Serviço</label>
              <select
                value={adminBooking.serviceId}
                onChange={e => handleBookingChange('serviceId', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
              >
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Data</label>
              <input
                type="date"
                required
                value={adminBooking.date}
                onChange={e => handleBookingChange('date', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Forma de pagamento</label>
              <select
                value={adminBooking.paymentMethod}
                onChange={e => handleBookingChange('paymentMethod', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="pix">Pix</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao">Cartão</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Horário</label>
              {!isDayOpen(adminBooking.date, operatingHours) && (
                <span className="text-[10px] text-amber-500 block mb-1">
                  (Atenção: Barbearia fechada neste dia da semana)
                </span>
              )}
              <select
                value={adminBooking.time}
                onChange={e => handleBookingChange('time', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
              >
                {(getTimeSlotsForDate(adminBooking.date, operatingHours, 30).length > 0
                  ? getTimeSlotsForDate(adminBooking.date, operatingHours, 30)
                  : defaultTimeSlots
                ).map(time => {
                  const sObj = services.find(s => s.id === adminBooking.serviceId);
                  const dur = sObj?.duration || 30;
                  const unavailable = isSlotUnavailable(
                    adminBooking.barberId,
                    adminBooking.date,
                    time,
                    dur,
                    timeBlocks,
                    appointments,
                    operatingHours
                  );
                  return (
                    <option key={time} value={time} disabled={unavailable}>
                      {time}{unavailable ? ' (indisponível)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {bookingError && (
            <p className="mt-4 text-sm text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {bookingError}
            </p>
          )}

          <div className="flex justify-end mt-5">
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition"
            >
              <CheckCircle2 className="w-4 h-4" /> Confirmar agendamento
            </button>
          </div>
        </form>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex justify-between items-center text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Faturamento Confirmado</span>
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-white">R$ {totalRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex justify-between items-center text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Agendamentos Ativos</span>
            <Calendar className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-white">{confirmedAppointments.length}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex justify-between items-center text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Barbeiros Ativos</span>
            <User className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-white">
            {adminRole === 'admin' ? barbers.length : 1}
          </p>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          {adminRole === 'admin' ? 'Agenda do Estabelecimento' : 'Minha Agenda'}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 text-zinc-400 text-xs uppercase">
              <tr>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Barbeiro</th>
                <th className="py-3 px-4">Serviço</th>
                <th className="py-3 px-4">Data/Hora</th>
                <th className="py-3 px-4">Pagamento</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Valor</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {visibleAppointments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-zinc-500">
                    Nenhum agendamento encontrado.
                  </td>
                </tr>
              ) : (
                visibleAppointments.map((app) => {
                  const barber = barbers.find(b => b.id === app.barberId);
                  const service = services.find(s => s.id === app.serviceId);

                  return (
                    <tr key={app.id} className="hover:bg-zinc-800/30 transition">
                      <td className="py-3 px-4 font-medium text-white">
                        {app.clientName || 'Cliente sem nome'}
                        <br />
                        <span className="text-xs text-zinc-500">{app.clientPhone}</span>
                      </td>
                      <td className="py-3 px-4 text-zinc-300">{barber?.name || 'Não atribuído'}</td>
                      <td className="py-3 px-4 text-zinc-300">{service?.name || 'Serviço'}</td>
                      <td className="py-3 px-4 text-zinc-300">
                        {app.date} às {app.time}
                      </td>
                      <td className="py-3 px-4 uppercase text-xs font-semibold text-zinc-400">
                        {app.paymentMethod || 'pix'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            app.status === 'confirmado'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {app.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-400">
                        R$ {Number(app.price || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {app.status === 'confirmado' && (
                          <button
                            onClick={() => handleCancel(app.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-lg transition"
                            title="Cancelar Agendamento"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

