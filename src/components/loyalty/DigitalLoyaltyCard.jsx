import React from 'react';
import { Award, Scissors, Check, Gift, Sparkles } from 'lucide-react';

export default function DigitalLoyaltyCard({ loyaltyData, shopSettings }) {
  if (!loyaltyData || !shopSettings?.loyaltyEnabled) return null;

  const target = Number(shopSettings.loyaltyTarget) || 10;
  const points = Number(loyaltyData.loyalty_points) || 0;
  const completedCuts = Number(loyaltyData.completed_cuts) || 0;
  const rewardsRedeemed = Number(loyaltyData.rewards_redeemed) || 0;
  const reward = shopSettings.loyaltyReward || '1 Corte de Cabelo Grátis';

  const isRewardReady = points >= target;
  const remaining = Math.max(0, target - points);
  const progressPct = Math.min(100, Math.round((points / target) * 100));

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 shadow-2xl">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800/80 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">
              Programa de Fidelidade
            </span>
            <h3 className="font-bold text-white text-base">
              {shopSettings.name || 'Barbearia'}
            </h3>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold text-zinc-300 block">
            {loyaltyData.client_name || 'Cliente'}
          </span>
          <span className="text-[11px] text-zinc-500">
            {loyaltyData.client_phone}
          </span>
        </div>
      </div>

      {/* Reward Status Banner */}
      {isRewardReady ? (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/15 to-emerald-500/20 border border-amber-500/50 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500 text-zinc-950 font-bold shrink-0 shadow-md">
            <Gift className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="font-bold text-amber-300 text-sm">
                Prêmio Liberado para Resgate!
              </h4>
            </div>
            <p className="text-xs text-zinc-200 font-semibold mt-0.5">
              Você conquistou: <span className="text-amber-400 underline">{reward}</span>
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Avise o barbeiro no seu próximo atendimento para aproveitar o seu prêmio.
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-5 flex items-center justify-between gap-2 text-xs">
          <span className="text-zinc-400 font-medium">
            Meta: <strong className="text-white">{target} cortes</strong> = <strong className="text-amber-400">{reward}</strong>
          </span>
          <span className="text-amber-400 font-bold">
            Faltam {remaining} {remaining === 1 ? 'corte' : 'cortes'}!
          </span>
        </div>
      )}

      {/* Stamp Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5 mb-5">
        {Array.from({ length: target }).map((_, index) => {
          const isStamped = index < points;
          const isTargetStamp = index === target - 1;

          return (
            <div
              key={index}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center p-1 border transition-all ${
                isStamped
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20 scale-[1.02]'
                  : 'bg-zinc-950/80 border-dashed border-zinc-700/80 text-zinc-600'
              }`}
            >
              {isStamped ? (
                <Check className="w-5 h-5 stroke-[2.5]" />
              ) : isTargetStamp ? (
                <Gift className="w-4 h-4 text-amber-500/60" />
              ) : (
                <Scissors className="w-4 h-4 text-zinc-600" />
              )}
              <span className={`text-[9px] font-bold mt-0.5 ${isStamped ? 'text-zinc-950' : 'text-zinc-500'}`}>
                {index + 1}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress Bar & Footer */}
      <div className="space-y-2">
        <div className="w-full bg-zinc-800/80 rounded-full h-2 overflow-hidden border border-zinc-700/50">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
          <span>{points} de {target} cortes completados no ciclo atual</span>
          <span>{completedCuts} cortes no total histórico</span>
        </div>
      </div>

      {rewardsRedeemed > 0 && (
        <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
          <span>🏆 Prêmios já resgatados por você:</span>
          <span className="font-bold text-emerald-400">{rewardsRedeemed} resgate(s)</span>
        </div>
      )}
    </div>
  );
}

