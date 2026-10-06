import React, { useState } from 'react';
import { DollarSign, TrendingUp, Wallet, PieChart } from 'lucide-react';
import { useEstablishment } from '../../contexts/EstablishmentContext';
import { useAuth } from '../../contexts/AuthContext';
import { getTodayISO } from '../../utils/dateUtils';

export default function FinancialSection() {
  const { barbers, appointments } = useEstablishment();
  const { adminRole, user } = useAuth();
  const today = getTodayISO();

  // Filters
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [paymentMethod, setPaymentMethod] = useState('todos');

  // Filtered appointments
  const filteredAppointments = appointments.filter(app => {
    if (app.status !== 'confirmado') return false;

    const inPeriod = (!startDate || app.date >= startDate) && (!endDate || app.date <= endDate);
    const inPayment = paymentMethod === 'todos' || (app.paymentMethod || 'pix') === paymentMethod;
    const inBarberScope = adminRole === 'admin' || app.barberId === user?.id;

    return inPeriod && inPayment && inBarberScope;
  });

  const totalGrossRevenue = filteredAppointments.reduce((sum, app) => sum + (Number(app.price) || 0), 0);

  // Per barber calculations
  const reportByBarber = barbers
    .filter(barber => adminRole === 'admin' || barber.id === user?.id)
    .map(barber => {
      const items = filteredAppointments.filter(app => app.barberId === barber.id);
      const total = items.reduce((sum, app) => sum + (Number(app.price) || 0), 0);
      const commissionPct = Number(barber.commission || 50);
      const commissionAmount = (total * commissionPct) / 100;
      const shopRetained = total - commissionAmount;

      return {
        barber,
        count: items.length,
        commissionPct,
        pix: items.filter(a => (a.paymentMethod || 'pix') === 'pix').reduce((s, a) => s + (Number(a.price) || 0), 0),
        dinheiro: items.filter(a => a.paymentMethod === 'dinheiro').reduce((s, a) => s + (Number(a.price) || 0), 0),
        cartao: items.filter(a => a.paymentMethod === 'cartao').reduce((s, a) => s + (Number(a.price) || 0), 0),
        total,
        commissionAmount,
        shopRetained
      };
    });

  const totalCommissionPayout = reportByBarber.reduce((sum, item) => sum + item.commissionAmount, 0);
  const totalShopNet = totalGrossRevenue - totalCommissionPayout;

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-5">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              Fechamento de Caixa & Comissões
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Consulte faturamento bruto, cálculo automático do repasse de cada barbeiro e o lucro líquido da barbearia.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-xs text-zinc-400">
              De
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="block mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white text-sm"
              />
            </label>
            <label className="text-xs text-zinc-400">
              Até
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="block mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white text-sm"
              />
            </label>
            <label className="text-xs text-zinc-400">
              Forma de Pagamento
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="block mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white text-sm"
              >
                <option value="todos">Todas as formas</option>
                <option value="pix">Pix</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao">Cartão</option>
              </select>
            </label>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
          <div className="bg-zinc-800/40 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-xs font-semibold uppercase">Faturamento Bruto</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white">R$ {totalGrossRevenue.toFixed(2)}</p>
            <p className="text-xs text-zinc-500 mt-1">{filteredAppointments.length} atendimentos no período</p>
          </div>

          <div className="bg-zinc-800/40 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-xs font-semibold uppercase">Repasse aos Barbeiros</span>
              <Wallet className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-400">R$ {totalCommissionPayout.toFixed(2)}</p>
            <p className="text-xs text-zinc-500 mt-1">Total de comissões acumuladas</p>
          </div>

          <div className="bg-zinc-800/40 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-xs font-semibold uppercase">Líquido Barbearia</span>
              <PieChart className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">R$ {totalShopNet.toFixed(2)}</p>
            <p className="text-xs text-zinc-500 mt-1">Margem retida pela casa</p>
          </div>
        </div>
      </div>

      {/* Commission Breakdown Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          Divisão de Comissões por Barbeiro
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 text-zinc-400 text-xs uppercase">
              <tr>
                <th className="py-3 px-3">Barbeiro</th>
                <th className="py-3 px-3">Atendimentos</th>
                <th className="py-3 px-3">Pix</th>
                <th className="py-3 px-3">Dinheiro</th>
                <th className="py-3 px-3">Cartão</th>
                <th className="py-3 px-3">Total Bruto</th>
                <th className="py-3 px-3">Comissão (%)</th>
                <th className="py-3 px-3 text-amber-400">Repasse Barbeiro</th>
                <th className="py-3 px-3 text-emerald-400">Líquido Casa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {reportByBarber.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-zinc-500">
                    Nenhum atendimento encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                reportByBarber.map(item => (
                  <tr key={item.barber.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3.5 px-3 font-semibold text-white">
                      {item.barber.name}
                      <span className="block text-xs font-normal text-zinc-500">{item.barber.role}</span>
                    </td>
                    <td className="py-3.5 px-3 text-zinc-300">{item.count}</td>
                    <td className="py-3.5 px-3 text-zinc-400">R$ {item.pix.toFixed(2)}</td>
                    <td className="py-3.5 px-3 text-zinc-400">R$ {item.dinheiro.toFixed(2)}</td>
                    <td className="py-3.5 px-3 text-zinc-400">R$ {item.cartao.toFixed(2)}</td>
                    <td className="py-3.5 px-3 font-bold text-white">R$ {item.total.toFixed(2)}</td>
                    <td className="py-3.5 px-3 text-zinc-300 font-semibold">{item.commissionPct}%</td>
                    <td className="py-3.5 px-3 font-bold text-amber-400">
                      R$ {item.commissionAmount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-emerald-400">
                      R$ {item.shopRetained.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

