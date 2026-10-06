import React, { useState } from 'react';
import { Clock, CheckCircle2, Save, Sparkles } from 'lucide-react';
import { useEstablishment } from '../../contexts/EstablishmentContext';
import { timeToMinutes } from '../../utils/dateUtils';

const DEFAULT_DAYS_TEMPLATE = [
  { day: 0, name: 'Domingo', isOpen: false, openTime: '09:00', closeTime: '14:00' },
  { day: 1, name: 'Segunda-feira', isOpen: false, openTime: '09:00', closeTime: '19:00' },
  { day: 2, name: 'Terça-feira', isOpen: true, openTime: '09:00', closeTime: '19:00' },
  { day: 3, name: 'Quarta-feira', isOpen: true, openTime: '09:00', closeTime: '19:00' },
  { day: 4, name: 'Quinta-feira', isOpen: true, openTime: '09:00', closeTime: '19:00' },
  { day: 5, name: 'Sexta-feira', isOpen: true, openTime: '09:00', closeTime: '20:00' },
  { day: 6, name: 'Sábado', isOpen: true, openTime: '08:00', closeTime: '18:00' }
];

export default function OperatingHoursSection() {
  const { operatingHours, updateOperatingHours } = useEstablishment();
  const [hoursList, setHoursList] = useState(() => {
    if (Array.isArray(operatingHours) && operatingHours.length === 7) {
      return operatingHours;
    }
    return DEFAULT_DAYS_TEMPLATE;
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleToggleDay = (dayIndex) => {
    setHoursList(prev => prev.map(item => item.day === dayIndex ? { ...item, isOpen: !item.isOpen } : item));
  };

  const handleTimeChange = (dayIndex, field, value) => {
    setHoursList(prev => prev.map(item => item.day === dayIndex ? { ...item, [field]: value } : item));
  };

  const applyDefaultCommercialHours = () => {
    setHoursList([
      { day: 0, name: 'Domingo', isOpen: false, openTime: '09:00', closeTime: '14:00' },
      { day: 1, name: 'Segunda-feira', isOpen: false, openTime: '09:00', closeTime: '19:00' },
      { day: 2, name: 'Terça-feira', isOpen: true, openTime: '09:00', closeTime: '19:00' },
      { day: 3, name: 'Quarta-feira', isOpen: true, openTime: '09:00', closeTime: '19:00' },
      { day: 4, name: 'Quinta-feira', isOpen: true, openTime: '09:00', closeTime: '19:00' },
      { day: 5, name: 'Sexta-feira', isOpen: true, openTime: '09:00', closeTime: '20:00' },
      { day: 6, name: 'Sábado', isOpen: true, openTime: '08:00', closeTime: '18:00' }
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback('');

    const res = await updateOperatingHours(hoursList);
    setSaving(false);

    if (res.success) {
      setFeedback('Horários de funcionamento atualizados com sucesso!');
      setTimeout(() => setFeedback(''), 3000);
    } else {
      alert(res.error || 'Erro ao salvar horários.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-500" />
            Horários de Funcionamento
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Configure quais dias a barbearia abre, os horários de início e término e os dias de folga da equipe.
          </p>
        </div>

        <button
          type="button"
          onClick={applyDefaultCommercialHours}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold px-3.5 py-2.5 rounded-lg border border-zinc-700 flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Preencher Terça a Sábado
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {feedback}
        </div>
      )}

      {/* Days List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800 overflow-hidden shadow-lg">
        {hoursList.map((dayItem) => {
          const openMins = timeToMinutes(dayItem.openTime);
          const closeMins = timeToMinutes(dayItem.closeTime);
          const totalHours = Math.max(0, (closeMins - openMins) / 60);

          return (
            <div
              key={dayItem.day}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                dayItem.isOpen ? 'bg-zinc-900' : 'bg-zinc-950/60'
              }`}
            >
              {/* Day and Status */}
              <div className="flex items-center gap-4 min-w-[200px]">
                <button
                  type="button"
                  onClick={() => handleToggleDay(dayItem.day)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    dayItem.isOpen ? 'bg-amber-500' : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-950 shadow ring-0 transition duration-200 ease-in-out ${
                      dayItem.isOpen ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>

                <div>
                  <h4 className="font-semibold text-white text-base leading-tight">
                    {dayItem.name}
                  </h4>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-1 ${
                      dayItem.isOpen
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50'
                    }`}
                  >
                    {dayItem.isOpen ? 'Aberto' : 'Fechado / Folga'}
                  </span>
                </div>
              </div>

              {/* Operating Hours Inputs */}
              {dayItem.isOpen ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Abertura</label>
                    <input
                      type="time"
                      value={dayItem.openTime}
                      onChange={e => handleTimeChange(dayItem.day, 'openTime', e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <span className="text-zinc-500 text-xs mt-5">até</span>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Fechamento</label>
                    <input
                      type="time"
                      value={dayItem.closeTime}
                      onChange={e => handleTimeChange(dayItem.day, 'closeTime', e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="hidden md:block pl-3 text-right">
                    <span className="text-xs text-zinc-400 block font-medium">
                      {totalHours.toFixed(totalHours % 1 === 0 ? 0 : 1)}h de expediente
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Grade ativa no agendamento
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-zinc-500 italic py-2">
                  Nenhum horário liberado para agendamento neste dia.
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold px-6 py-3 rounded-lg text-sm flex items-center gap-2 transition shadow-lg shadow-amber-500/10"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Horários de Funcionamento'}
        </button>
      </div>
    </form>
  );
}

