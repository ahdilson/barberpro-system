import React, { useState } from 'react';
import { Scissors, Edit3, Trash2, Save, X, Plus, CheckCircle2 } from 'lucide-react';
import { useEstablishment } from '../../contexts/EstablishmentContext';
import { supabase } from '../../services/supabase';

export default function ServicesSection() {
  const { services, establishmentId, setServices } = useEstablishment();

  const [editingService, setEditingService] = useState(null);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('30');
  const [newServiceCategory, setNewServiceCategory] = useState('Cabelo');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newServiceName.trim() || !newServicePrice) return;

    const newServ = {
      id: Date.now().toString(),
      name: newServiceName.trim(),
      price: Number(newServicePrice),
      duration: Number(newServiceDuration) || 30,
      category: newServiceCategory,
      description: newServiceDescription.trim()
    };

    if (supabase && establishmentId && establishmentId !== 'demo-shop') {
      const { data, error } = await supabase
        .from('services')
        .insert({
          establishment_id: establishmentId,
          name: newServ.name,
          description: newServ.description,
          price: newServ.price,
          duration_minutes: newServ.duration,
          category: newServ.category
        })
        .select()
        .single();

      if (error) {
        alert('Não foi possível salvar o serviço no banco.');
        return;
      }
      newServ.id = data.id;
    }

    setServices(prev => [...prev, newServ]);
    setNewServiceName('');
    setNewServicePrice('');
    setNewServiceDescription('');
    setFeedback('Serviço cadastrado com sucesso!');
    setTimeout(() => setFeedback(''), 2500);
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    if (!editingService) return;

    if (supabase && establishmentId && establishmentId !== 'demo-shop') {
      const { error } = await supabase
        .from('services')
        .update({
          name: editingService.name,
          description: editingService.description,
          price: Number(editingService.price),
          duration_minutes: Number(editingService.duration),
          category: editingService.category
        })
        .eq('id', editingService.id)
        .eq('establishment_id', establishmentId);

      if (error) {
        alert('Não foi possível atualizar o serviço no banco.');
        return;
      }
    }

    setServices(prev => prev.map(s => s.id === editingService.id ? editingService : s));
    setEditingService(null);
    setFeedback('Serviço atualizado com sucesso!');
    setTimeout(() => setFeedback(''), 2500);
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Tem certeza que deseja remover este serviço?')) return;

    if (supabase && establishmentId && establishmentId !== 'demo-shop') {
      const { error } = await supabase
        .from('services')
        .update({ active: false })
        .eq('id', serviceId)
        .eq('establishment_id', establishmentId);

      if (error) {
        alert('Não foi possível remover o serviço no banco.');
        return;
      }
    }

    setServices(prev => prev.filter(s => s.id !== serviceId));
    setFeedback('Serviço removido!');
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
        {/* Form Card */}
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
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingService.price}
                    onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Duração (min)</label>
                  <input
                    type="number"
                    step="5"
                    value={editingService.duration}
                    onChange={(e) => setEditingService({ ...editingService, duration: Number(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Categoria</label>
                <select
                  value={editingService.category}
                  onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                >
                  <option value="Cabelo">Cabelo</option>
                  <option value="Barba">Barba</option>
                  <option value="Combos">Combos</option>
                  <option value="Estética">Estética</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Descrição</label>
                <textarea
                  value={editingService.description || ''}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  placeholder="Descreva o que está incluso"
                  rows="3"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm resize-none"
                />
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
                  onClick={() => setEditingService(null)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 px-3 rounded-lg text-sm"
                >
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
                  placeholder="Ex: Corte Degradê"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    placeholder="45.00"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Duração (min)</label>
                  <input
                    type="number"
                    step="5"
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Categoria</label>
                <select
                  value={newServiceCategory}
                  onChange={(e) => setNewServiceCategory(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm"
                >
                  <option value="Cabelo">Cabelo</option>
                  <option value="Barba">Barba</option>
                  <option value="Combos">Combos</option>
                  <option value="Estética">Estética</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Descrição</label>
                <textarea
                  value={newServiceDescription}
                  onChange={(e) => setNewServiceDescription(e.target.value)}
                  placeholder="Ex: Lavagem com shampoo especial e finalização com pomada."
                  rows="3"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" /> Cadastrar Serviço
              </button>
            </form>
          )}
        </div>

        {/* Services List Card */}
        <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-md font-bold text-white mb-4">Serviços Oferecidos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.length === 0 ? (
              <p className="text-sm text-zinc-500 py-6 text-center col-span-2">Nenhum serviço cadastrado.</p>
            ) : (
              services.map((s) => (
                <div
                  key={s.id}
                  className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-800 flex justify-between items-center hover:border-zinc-700 transition"
                >
                  <div className="pr-2">
                    <p className="font-semibold text-white">{s.name}</p>
                    <p className="text-xs text-zinc-400">
                      {s.duration} min • <span className="text-amber-400/80">{s.category}</span>
                    </p>
                    {s.description && (
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{s.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-emerald-400 text-sm">
                      R$ {Number(s.price).toFixed(2)}
                    </span>
                    <button
                      onClick={() => setEditingService(s)}
                      className="text-amber-400 hover:text-amber-300 p-1.5 rounded-lg hover:bg-zinc-800 transition"
                      title="Editar Serviço"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteService(s.id)}
                      className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-zinc-800 transition"
                      title="Excluir Serviço"
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
