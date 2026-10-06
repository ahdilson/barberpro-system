import React, { useState } from 'react';
import { Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEstablishment } from '../../contexts/EstablishmentContext';
import { supabase } from '../../services/supabase';

export default function SettingsSection() {
  const { shopSettings, updateSettings, establishmentId } = useEstablishment();
  const [formData, setFormData] = useState({ ...shopSettings });
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrorMsg('');
  };

  const handleLogoUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Selecione um arquivo de imagem válido.');
      return;
    }
    if (file.size > 500 * 1024) {
      alert('A imagem não pode ter mais de 500 KB.');
      return;
    }

    if (supabase && establishmentId && establishmentId !== 'demo-shop') {
      const extension = file.type.split('/')[1] || 'png';
      const path = `${establishmentId}/logo-${Date.now()}.${extension}`;
      const { error } = await supabase.storage.from('establishment-assets').upload(path, file, {
        upsert: true,
        contentType: file.type
      });

      if (!error) {
        const { data } = supabase.storage.from('establishment-assets').getPublicUrl(path);
        handleChange('logo', data.publicUrl);
        return;
      }
    }

    // Local fallback
    const reader = new FileReader();
    reader.onload = () => handleChange('logo', reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    const res = await updateSettings(formData);
    setSaving(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Erro ao salvar configurações.');
      return;
    }

    setFeedback('Configurações salvas com sucesso!');
    setTimeout(() => setFeedback(''), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Configurações da Barbearia</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Personalize a identidade da sua página, links e mensagens para os clientes.
          </p>
        </div>
        {feedback && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" /> {feedback}
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identidade */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h3 className="font-bold text-white text-base">Identidade do Estabelecimento</h3>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Nome do Estabelecimento</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Link Personalizado da Página (Slug)</label>
            <div className="flex items-center">
              <span className="bg-zinc-800 border border-r-0 border-zinc-700 rounded-l-lg px-3 py-2.5 text-xs text-zinc-500">
                /
              </span>
              <input
                type="text"
                value={formData.slug}
                onChange={e => handleChange('slug', e.target.value)}
                placeholder="nome-da-barbearia"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-r-lg p-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <span className="block text-xs text-zinc-500 mt-1">
              Use apenas letras, números e hífen. Ex: <code>minha-barbearia</code>
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Tipo de Negócio</label>
            <select
              value={formData.businessType}
              onChange={e => handleChange('businessType', e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
            >
              <option>Barbearia</option>
              <option>Salão de Beleza</option>
              <option>Espaço Masculino</option>
              <option>Estúdio de Tatuagem & Cabelo</option>
              <option>Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Logo do Estabelecimento</label>
            <div className="flex items-center gap-3">
              {formData.logo ? (
                <img
                  src={formData.logo}
                  alt="Prévia da logo"
                  className="w-16 h-16 rounded-xl object-cover border border-zinc-700 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-zinc-500 shrink-0">
                  Sem logo
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={e => handleLogoUpload(e.target.files?.[0])}
                className="w-full text-xs text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-zinc-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Descrição Pública</label>
            <textarea
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              rows="3"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm resize-none focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Telefone Fixo / Comercial</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => handleChange('phone', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Endereço Completo</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => handleChange('address', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Link do Instagram</label>
              <input
                type="url"
                value={formData.instagram}
                onChange={e => handleChange('instagram', e.target.value)}
                placeholder="https://instagram.com/suabarbearia"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Link Google Maps</label>
              <input
                type="url"
                value={formData.locationUrl}
                onChange={e => handleChange('locationUrl', e.target.value)}
                placeholder="https://maps.google.com/..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Cor Primária do Estabelecimento</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.primaryColor}
                onChange={e => handleChange('primaryColor', e.target.value)}
                className="w-12 h-10 bg-zinc-800 border border-zinc-700 rounded-lg p-1 cursor-pointer"
              />
              <span className="text-sm font-mono text-zinc-300">{formData.primaryColor}</span>
            </div>
          </div>
        </div>

        {/* WhatsApp & Regras */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h3 className="font-bold text-white text-base">WhatsApp & Notificações</h3>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              WhatsApp da Barbearia (com DDD)
            </label>
            <input
              type="text"
              value={formData.whatsapp}
              onChange={e => handleChange('whatsapp', e.target.value.replace(/\D/g, ''))}
              placeholder="49999999999"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Mensagem de Confirmação (Template)
            </label>
            <textarea
              value={formData.confirmationMessage}
              onChange={e => handleChange('confirmationMessage', e.target.value)}
              rows="3"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm resize-none focus:outline-none focus:border-amber-500"
            />
            <span className="block text-xs text-zinc-500 mt-1">
              Variáveis: <code>{'{cliente}'}</code>, <code>{'{data}'}</code>, <code>{'{horario}'}</code>, <code>{'{barbeiro}'}</code>, <code>{'{servico}'}</code>
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Mensagem de Lembrete (Template)
            </label>
            <textarea
              value={formData.reminderMessage}
              onChange={e => handleChange('reminderMessage', e.target.value)}
              rows="3"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm resize-none focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Antecedência do Lembrete
            </label>
            <select
              value={formData.reminderMinutes}
              onChange={e => handleChange('reminderMinutes', Number(e.target.value))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="60">1 hora antes</option>
              <option value="120">2 horas antes</option>
              <option value="1440">1 dia antes (24h)</option>
              <option value="2880">2 dias antes (48h)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-zinc-800 space-y-3">
            <label className="flex items-center justify-between text-sm text-zinc-300">
              <span>Permitir agendamento online pelo site</span>
              <input
                type="checkbox"
                checked={formData.onlineBookingEnabled}
                onChange={e => handleChange('onlineBookingEnabled', e.target.checked)}
                className="w-5 h-5 accent-amber-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between text-sm text-zinc-300">
              <span>Habilitar lembretes de horário</span>
              <input
                type="checkbox"
                checked={formData.reminderEnabled}
                onChange={e => handleChange('reminderEnabled', e.target.checked)}
                className="w-5 h-5 accent-amber-500 cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Live Preview Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <p className="text-xs uppercase font-semibold text-zinc-500 mb-3 tracking-wider">
          Prévia do Card Público
        </p>
        <div
          className="rounded-xl p-5 border flex items-center gap-4 transition"
          style={{
            borderColor: formData.primaryColor,
            backgroundColor: `${formData.primaryColor}15`
          }}
        >
          {formData.logo ? (
            <img src={formData.logo} alt="Logo" className="w-16 h-16 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-zinc-500 shrink-0">
              Logo
            </div>
          )}
          <div>
            <p className="text-xs text-zinc-400">{formData.businessType}</p>
            <p className="font-bold text-lg" style={{ color: formData.primaryColor }}>
              {formData.name || 'Nome da Barbearia'}
            </p>
            <p className="text-sm text-zinc-300 mt-0.5">{formData.description}</p>
            <p className="text-xs text-zinc-400 mt-1">
              {formData.address} • {formData.phone}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-2.5 rounded-lg text-sm flex items-center gap-2 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </form>
  );
}
