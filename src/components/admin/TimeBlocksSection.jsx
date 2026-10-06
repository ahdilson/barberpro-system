import React, { useState } from 'react';
import { Lock, Repeat, Trash2, CheckCircle2 } from 'lucide-react';
import { useEstablishment } from '../../contexts/EstablishmentContext';
import { supabase } from '../../services/supabase';
import { getTodayISO } from '../../utils/dateUtils';

export default function TimeBlocksSection() {
  const { barbers, timeBlocks, establishmentId, refreshAgenda, setTimeBlocks } = useEstablishment();
  const today = getTodayISO();

  const [blockBarberId, setBlockBarberId] = useState(barbers[0]?.id || '');
  const [blockDate, setBlockDate] = useState(today);
  const [blockStartTime, setBlockStartTime] = useState('12:00');
  const [blockEndTime, setBlockEndTime] = useState('13:30');
  const [blockReason, setBlockReason] = useState('Horário de Almoço');
  const [blockIsRecurring, setBlockIsRecurring] = useState(true);
  const [feedback, setFeedback] = useState('');

  const handleAddTimeBlock = async (e) => {
    e.preventDefault();
    const newBlock = {
      id: Date.now().toString(),
      barberId: blockBarberId || barbers[0]?.id,
      date: blockDate,
      startTime: blockStartTime,
      endTime: blockEndTime,
      reason: blockReason,
      isRecurring: blockIsRecurring
    };

    if (supabase && establishmentId && establishmentId !== 'demo-shop') {
      const { error } = await supabase.from('time_blocks').insert({
        establishment_id: establishmentId,
        professional_id: newBlock.barberId,
        block_date: blockDate,
        start_time: blockStartTime,
        end_time: blockEndTime,
        reason: blockReason,
        is_recurring: blockIsRecurring
      });

      if (error) {
        alert(`Não foi possível gravar o bloqueio: ${error.message}`);
        return;
      }
      refreshAgenda();
    } else {
      setTimeBlocks(prev => [...prev, newBlock]);
    }

    setFeedback(blockIsRecurring ? 'Bloqueio diário ativado com sucesso!' : 'Bloqueio cadastrado com sucesso!');
    setTimeout(() => setFeedback(''), 2500);
  };

  const handleRemoveTimeBlock = async (blockId) => {
    if (!window.confirm('Remover este bloqueio de horário?')) return;

    if (supabase && establishmentId && establishmentId !== 'demo-shop') {
      const { error } = await supabase
        .from('time_blocks')
        .delete()
        .eq('id', blockId)
        .eq('establishment_id', establishmentId);

      if (error) {
        alert('Não foi possível remover o bloqueio.');
        return;
      }
      refreshAgenda();
      return;
    }

    setTimeBlocks(prev => prev.filter(item => item.id !== blockId));
    setFeedback('Bloqueio removido!');
    setTimeout(() => setFeedback(''), 2500);
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form */}
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
                <option value="recurring">Todos os Dias (Almoço / Fixo)</option>
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
                placeholder="Ex: Horário de Almoço"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2.5 rounded-lg text-sm flex justify-center items-center gap-2 transition"
            >
              <Lock className="w-4 h-4" /> Cadastrar Bloqueio
            </button>
          </form>
        </div>

        {/* List */}
        <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-md font-bold text-white mb-4">Bloqueios & Horários de Almoço Ativos</h3>
          <div className="space-y-3">
            {timeBlocks.length === 0 ? (
              <p className="text-sm text-zinc-500 py-6 text-center">Nenhum bloqueio registrado.</p>
            ) : (
              timeBlocks.map((blk) => {
                const barber = barbers.find(b => b.id === blk.barberId);
                return (
                  <div
                    key={blk.id}
                    className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-800 flex justify-between items-center hover:border-zinc-700 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">{barber?.name || 'Barbeiro'}</p>
                        {blk.isRecurring && (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                            <Repeat className="w-3 h-3" /> Fixo Diário
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-500 font-medium mt-1">{blk.reason}</p>
                      <p className="text-xs text-zinc-400">
                        {blk.isRecurring ? 'Recorrente diário' : blk.date} • das {blk.startTime} às {blk.endTime}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveTimeBlock(blk.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition"
                      title="Remover Bloqueio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
