import React, { useState } from 'react';
import { User, Edit3, Trash2, Save, X, Plus, CheckCircle2 } from 'lucide-react';
import { useEstablishment } from '../../contexts/EstablishmentContext';
import { supabase } from '../../services/supabase';

export default function BarbersSection() {
  const { barbers, establishmentId, refreshAgenda, setBarbers } = useEstablishment();

  const [editingBarber, setEditingBarber] = useState(null);
  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberRole, setNewBarberRole] = useState('');
  const [newBarberCommission, setNewBarberCommission] = useState(50);
  const [newBarberPhoto, setNewBarberPhoto] = useState('');
  const [feedback, setFeedback] = useState('');

  const validateImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Selecione um arquivo de imagem válido.');
      return false;
    }
    if (file.size > 300 * 1024) {
      alert('A imagem não pode ter mais de 300 KB.');
      return false;
    }
    return true;
  };

  const handleBarberPhoto = (file, onLoad) => {
    if (!validateImageFile(file)) return;
    const reader = new FileReader();
    reader.onload = () => onLoad(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAddBarber = (e) => {
    e.preventDefault();
    if (!newBarberName.trim()) return;

    if (supabase && establishmentId && establishmentId !== 'demo-shop') {
      alert('No Supabase, novos profissionais devem ser convidados pelo Auth e associados a um profile. Aqui você pode alterar a foto, especialidade e comissão dos profissionais ativos.');
      return;
    }

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
    setFeedback('Barbeiro cadastrado com sucesso!');
    setTimeout(() => setFeedback(''), 2500);
  };

  const handleUpdateBarber = async (e) => {
    e.preventDefault();
    if (!editingBarber) return;

    if (supabase && establishmentId && establishmentId !== 'demo-shop') {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editingBarber.name,
          commission: Number(editingBarber.commission),
          photo_url: editingBarber.avatar
        })
        .eq('id', editingBarber.id)
        .eq('establishment_id', establishmentId);

      if (error) {
        alert('Não foi possível atualizar o profissional.');
        return;
      }
      refreshAgenda();
    } else {
      setBarbers(barbers.map(b => b.id === editingBarber.id ? editingBarber : b));
    }

    setEditingBarber(null);
    setFeedback('Barbeiro atualizado!');
    setTimeout(() => setFeedback(''), 2500);
  };

  const handleDeactivateBarber = async (barberId) => {
    if (!window.confirm('Desativar este profissional?')) return;

    if (supabase && establishmentId && establishmentId !== 'demo-shop') {
      const { error } = await supabase
        .from('profiles')
        .update({ active: false })
        .eq('id', barberId)
        .eq('establishment_id', establishmentId);

      if (error) {
        alert('Não foi possível desativar o profissional.');
        return;
      }
      refreshAgenda();
      return;
    }

    setBarbers(barbers.filter(item => item.id !== barberId));
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
        {/* Form Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-md font-bold text-white mb-4">
            {editingBarber ? 'Editar Barbeiro' : 'Cadastrar Barbeiro'}
          </h3>

          {editingBarber ? (
            <form onSubmit={handleUpdateBarber} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={editingBarber.name}
                  onChange={(e) => setEditingBarber({ ...editingBarber, name: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Especialidade / Função</label>
                <input
                  type="text"
                  value={editingBarber.role}
                  onChange={(e) => setEditingBarber({ ...editingBarber, role: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Comissão (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editingBarber.commission}
                  onChange={(e) => setEditingBarber({ ...editingBarber, commission: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Foto do Barbeiro</label>
                <div className="flex items-center gap-3">
                  <img
                    src={editingBarber.avatar}
                    alt="Prévia"
                    className="w-12 h-12 rounded-full object-cover border border-zinc-700"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleBarberPhoto(e.target.files?.[0], avatar => setEditingBarber({ ...editingBarber, avatar }))}
                    className="w-full text-xs text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 text-zinc-950 font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBarber(null)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 px-3 rounded-lg text-sm"
                >
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
                  placeholder="Ex: Carlos Eduardo"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Especialidade / Função</label>
                <input
                  type="text"
                  value={newBarberRole}
                  onChange={(e) => setNewBarberRole(e.target.value)}
                  placeholder="Ex: Fade / Barba Alinhada"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Comissão (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newBarberCommission}
                  onChange={(e) => setNewBarberCommission(Number(e.target.value))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Foto do Barbeiro</label>
                <div className="flex items-center gap-3">
                  {newBarberPhoto ? (
                    <img src={newBarberPhoto} alt="Prévia" className="w-12 h-12 rounded-full object-cover border border-zinc-700" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleBarberPhoto(e.target.files?.[0], setNewBarberPhoto)}
                    className="w-full text-xs text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" /> Adicionar Barbeiro
              </button>
            </form>
          )}
        </div>

        {/* List Card */}
        <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-md font-bold text-white mb-4">Barbeiros Cadastrados</h3>
          <div className="space-y-3">
            {barbers.length === 0 ? (
              <p className="text-sm text-zinc-500 py-6 text-center">Nenhum barbeiro ativo cadastrado.</p>
            ) : (
              barbers.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3.5 bg-zinc-800/50 rounded-xl border border-zinc-800 hover:border-zinc-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <img src={b.avatar} alt={b.name} className="w-11 h-11 rounded-full object-cover border border-zinc-700 shrink-0" />
                    <div>
                      <p className="font-semibold text-white">{b.name}</p>
                      <p className="text-xs text-zinc-400">
                        {b.role} • <span className="text-amber-400 font-medium">Comissão: {b.commission}%</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingBarber(b)}
                      className="text-amber-400 hover:text-amber-300 p-2 rounded-lg hover:bg-zinc-800 transition"
                      title="Editar Barbeiro"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeactivateBarber(b.id)}
                      className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-zinc-800 transition"
                      title="Desativar Barbeiro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

