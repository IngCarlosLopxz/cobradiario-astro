import React from 'react';
import { calculateLoan, formatCOP } from '../core/services/loan-calculator';
import { Calculator, Sparkles } from 'lucide-react';

interface LoanCalculatorCardProps {
  amount: number;
  interestRate: number;
  totalDays: number;
  onChangeAmount: (val: number) => void;
  onChangeInterestRate: (val: number) => void;
  onChangeTotalDays: (val: number) => void;
}

export const LoanCalculatorCard: React.FC<LoanCalculatorCardProps> = ({
  amount,
  interestRate,
  totalDays,
  onChangeAmount,
  onChangeInterestRate,
  onChangeTotalDays,
}) => {
  const calculation = calculateLoan(amount, interestRate, totalDays);

  const presetsAmount = [100000, 200000, 500000, 1000000, 2000000];
  const presetsRates = [10, 15, 20, 25];
  const presetsDays = [15, 20, 24, 30];

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-slate-700/60">
      <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight text-white">Simulador en Vivo</h3>
            <p className="text-[11px] text-slate-400">Cálculo de micropréstamos gota a gota</p>
          </div>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Tiempo Real
        </span>
      </div>

      <div className="space-y-4 relative z-10">
        <div>
          <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1.5">
            <span>Monto del Capital:</span>
            <span className="text-sm font-extrabold text-sky-400">{formatCOP(amount)}</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {presetsAmount.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onChangeAmount(p)}
                className={`py-1.5 text-[11px] font-bold rounded-xl transition-all ${
                  amount === p
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/50'
                }`}
              >
                {p >= 1000000 ? `${p / 1000000}M` : `${p / 1000}k`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1.5">
            <span>Tasa de Interés (%):</span>
            <span className="text-sm font-extrabold text-emerald-400">{interestRate}%</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {presetsRates.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onChangeInterestRate(r)}
                className={`py-1.5 text-xs font-bold rounded-xl transition-all ${
                  interestRate === r
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/50'
                }`}
              >
                {r}%
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1.5">
            <span>Plazo del Cobro:</span>
            <span className="text-sm font-extrabold text-cyan-400">{totalDays} días</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {presetsDays.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onChangeTotalDays(d)}
                className={`py-1.5 text-xs font-bold rounded-xl transition-all ${
                  totalDays === d
                    ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/50'
                }`}
              >
                {d} Días
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-700/80 grid grid-cols-2 gap-3 relative z-10">
        <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Total a Pagar</p>
          <p className="text-lg font-black text-white">{formatCOP(calculation.totalWithInterest)}</p>
          <p className="text-[10px] text-emerald-400 mt-0.5">
            +{formatCOP(calculation.interestAmount)} ganancia
          </p>
        </div>

        <div className="bg-gradient-to-tr from-sky-600/30 to-cyan-500/20 p-3 rounded-2xl border border-sky-500/30">
          <p className="text-[10px] text-sky-300 uppercase font-bold">Cuota Diaria</p>
          <p className="text-xl font-black text-sky-300">{formatCOP(calculation.dailyPayment)}</p>
          <p className="text-[10px] text-slate-300 mt-0.5">
            x {calculation.totalDays} pagos diarios
          </p>
        </div>
      </div>
    </div>
  );
};
