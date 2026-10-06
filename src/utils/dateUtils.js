export const getTodayISO = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const clock = (value) => String(value || '').slice(0, 5);

export const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = clock(timeStr).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const minutesToTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const formatDateBR = (isoDate) => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

export const formatDateLabel = (isoDate) => {
  if (!isoDate) return '';
  const today = getTodayISO();
  if (isoDate === today) return 'Hoje';
  
  const d = new Date(`${isoDate}T12:00:00`);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  if (isoDate === tomorrowISO) return 'Amanhã';

  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dayName = weekdays[d.getDay()];
  const dayNum = String(d.getDate()).padStart(2, '0');
  const monthNum = String(d.getMonth() + 1).padStart(2, '0');
  return `${dayName}, ${dayNum}/${monthNum}`;
};

export const DEFAULT_OPERATING_HOURS = [
  { day: 0, name: 'Domingo', isOpen: false, openTime: '09:00', closeTime: '14:00' },
  { day: 1, name: 'Segunda-feira', isOpen: false, openTime: '09:00', closeTime: '19:00' },
  { day: 2, name: 'Terça-feira', isOpen: true, openTime: '09:00', closeTime: '19:00' },
  { day: 3, name: 'Quarta-feira', isOpen: true, openTime: '09:00', closeTime: '19:00' },
  { day: 4, name: 'Quinta-feira', isOpen: true, openTime: '09:00', closeTime: '19:00' },
  { day: 5, name: 'Sexta-feira', isOpen: true, openTime: '09:00', closeTime: '20:00' },
  { day: 6, name: 'Sábado', isOpen: true, openTime: '08:00', closeTime: '18:00' }
];

export const getDayConfig = (dateISO, operatingHours = DEFAULT_OPERATING_HOURS) => {
  if (!dateISO) return null;
  const d = new Date(`${dateISO}T12:00:00`);
  const dayOfWeek = d.getDay();
  const list = Array.isArray(operatingHours) && operatingHours.length > 0 ? operatingHours : DEFAULT_OPERATING_HOURS;
  return list.find(item => item.day === dayOfWeek) || list[dayOfWeek] || null;
};

export const isDayOpen = (dateISO, operatingHours = DEFAULT_OPERATING_HOURS) => {
  const config = getDayConfig(dateISO, operatingHours);
  return config ? Boolean(config.isOpen) : true;
};

export const getTimeSlotsForDate = (dateISO, operatingHours = DEFAULT_OPERATING_HOURS, stepMinutes = 30) => {
  if (!dateISO) return [];
  const config = getDayConfig(dateISO, operatingHours);
  if (!config || !config.isOpen) return [];

  const openMins = timeToMinutes(config.openTime || '09:00');
  const closeMins = timeToMinutes(config.closeTime || '19:00');
  const slots = [];

  for (let mins = openMins; mins < closeMins; mins += stepMinutes) {
    slots.push(minutesToTime(mins));
  }

  return slots;
};

export const isIntervalBlocked = (barberId, date, startMins, endMins, timeBlocks = []) => {
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

export const isIntervalBooked = (barberId, date, startMins, endMins, appointments = []) => {
  return appointments.some(app => {
    if (app.barberId === barberId && app.date === date && app.status === 'confirmado') {
      const aStart = timeToMinutes(app.time);
      const aEnd = aStart + (app.duration || 30);
      return startMins < aEnd && endMins > aStart;
    }
    return false;
  });
};

export const isSlotUnavailable = (
  barberId,
  date,
  slotTime,
  duration = 30,
  timeBlocks = [],
  appointments = [],
  operatingHours = DEFAULT_OPERATING_HOURS
) => {
  const config = getDayConfig(date, operatingHours);
  
  // If barbershop is closed on this day of week
  if (config && !config.isOpen) return true;

  const startMins = timeToMinutes(slotTime);
  const endMins = startMins + duration;
  const dayCloseMins = config ? timeToMinutes(config.closeTime || '19:00') : timeToMinutes('20:00');

  // Service cannot end after the establishment closes on that day
  if (endMins > dayCloseMins) return true;

  // If date is today, block past time slots (with 10-minute buffer)
  if (date === getTodayISO()) {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    if (startMins <= currentMins + 10) return true;
  }

  const blocked = isIntervalBlocked(barberId, date, startMins, endMins, timeBlocks);
  const booked = isIntervalBooked(barberId, date, startMins, endMins, appointments);

  return blocked || booked;
};

export const defaultTimeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00'
];
