import { cleanPhone } from './phoneUtils';

export const buildWhatsAppUrl = (phone, text) => {
  const digits = cleanPhone(phone);
  if (!digits) return '';
  const countryPhone = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${countryPhone}?text=${encodeURIComponent(text)}`;
};

export const openWhatsAppMessage = (appointment, type, shopSettings = {}, barbers = [], services = []) => {
  const digits = cleanPhone(appointment.clientPhone);
  if (!digits) return;

  const barber = barbers.find(item => item.id === appointment.barberId);
  const service = services.find(item => item.id === appointment.serviceId);

  let message = '';
  if (type === 'confirmed') {
    const template = shopSettings.confirmationMessage || 'Olá, {cliente}! Seu agendamento foi confirmado para {data} às {horario} com {barbeiro} ({servico}).';
    message = template
      .replaceAll('{cliente}', appointment.clientName || 'Cliente')
      .replaceAll('{horario}', appointment.time || '')
      .replaceAll('{data}', appointment.date || '')
      .replaceAll('{servico}', service?.name || 'Atendimento')
      .replaceAll('{barbeiro}', barber?.name || 'A definir');
  } else if (type === 'reminder') {
    const template = shopSettings.reminderMessage || 'Olá, {cliente}! Lembrete: seu horário é amanhã às {horario} com {barbeiro}.';
    message = template
      .replaceAll('{cliente}', appointment.clientName || 'Cliente')
      .replaceAll('{horario}', appointment.time || '')
      .replaceAll('{data}', appointment.date || '')
      .replaceAll('{servico}', service?.name || 'Atendimento')
      .replaceAll('{barbeiro}', barber?.name || 'A definir');
  } else if (type === 'cancelled') {
    message = `Olá, ${appointment.clientName || 'Cliente'}! Seu agendamento em ${shopSettings.name || 'nossa barbearia'} no dia ${appointment.date} às ${appointment.time} foi cancelado. Se desejar reagendar, estamos à disposição!`;
  }

  const url = buildWhatsAppUrl(digits, message);
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

