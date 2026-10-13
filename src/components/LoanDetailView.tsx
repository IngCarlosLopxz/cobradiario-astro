import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Printer
} from 'lucide-react';
import { store } from '../core/services/store';
import { formatCOP, generateAmortizationSchedule } from '../core/services/loan-calculator';
import { PaymentModal } from './PaymentModal';
import type { Loan, Payment } from '../core/domain/types';

interface LoanDetailViewProps {
  loanId: number;
}

export const LoanDetailView: React.FC<LoanDetailViewProps> = ({ loanId }) => {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const loadData = () => {
    const l = store.getLoanById(loanId);
    if (!l) {
      if (typeof window !== 'undefined') window.location.href = '/loans';
      return;
    }
    setLoan(l);
    const p = store.getPayments().filter((pay) => pay.loan_id === loanId);
    setPayments(p);
  };

  useEffect(() => {
    loadData();
    return store.subscribe(loadData);
  }, [loanId]);

  if (!loan) return null;

  const schedule = generateAmortizationSchedule(loan, payments);
  const pendingAmount = loan.pending_amount ?? Math.max(0, loan.total_with_interest - loan.total_paid);

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <a
          href="/loans"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Préstamos</span>
        </a>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 bg-white text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Imprimir Recibo</span>
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider bg-sky-500/20 px-2 py-0.5 rounded-md border border-sky-500/30">
                Crédito #{loan.id}
              </span>
              {loan.status === 'completed' ? (
                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Liquidado 100%
                </span>
              ) : (
                <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider bg-sky-500/20 px-2 py-0.5 rounded-md border border-sky-500/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  En Cobro Activo
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {loan.borrower_name}
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              {loan.borrower_address} • {loan.borrower_city}
            </p>
          </div>

          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white text-xs font-extrabold shadow-lg shadow-sky-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <DollarSign className="w-4 h-4 stroke-[2.5]" />
            <span>Registrar Abono / Pago</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Capital Inicial</p>
            <p className="text-base sm:text-lg font-black text-white">{formatCOP(loan.amount)}</p>
            <p className="text-[10px] text-slate-400">Tasa: {loan.interest_rate}%</p>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Total con Interés</p>
            <p className="text-base sm:text-lg font-black text-white">
              {formatCOP(loan.total_with_interest)}
            </p>
            <p className="text-[10px] text-emerald-400">
              +{formatCOP(loan.total_with_interest - loan.amount)} ganancia
            </p>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Cuota Diaria</p>
            <p className="text-base sm:text-lg font-black text-sky-400">
              {formatCOP(loan.daily_payment)}
            </p>
            <p className="text-[10px] text-slate-400">{loan.total_days} días de plazo</p>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Saldo Restante</p>
            <p className="text-base sm:text-lg font-black text-amber-400">
              {formatCOP(pendingAmount)}
            </p>
            <p className="text-[10px] text-slate-400">{loan.progress_percent}% amortizado</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700/80 relative z-10">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-2">
            <span>Progreso de Amortización</span>
            <span>
              {loan.payments_made} de {loan.total_days} cuotas pagadas
            </span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                loan.status === 'completed' ? 'bg-emerald-500' : 'bg-sky-500'
              }`}
              style={{ width: `${loan.progress_percent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Historial de Pagos Realizados ({payments.length})</span>
            </h3>
            <span className="text-xs font-bold text-slate-500">
              Total: {formatCOP(loan.total_paid)}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {payments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No se han registrado abonos todavía.
              </p>
            ) : (
              payments.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        Cuota #{p.payment_number}
                      </span>
                      <span className="text-[10px] text-slate-400">• {p.payment_date}</span>
                    </div>
                    {p.notes && (
                      <p className="text-[11px] text-slate-500 mt-0.5 italic">{p.notes}</p>
                    )}
                  </div>
                  <span className="text-xs font-black text-emerald-600">
                    +{formatCOP(p.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>Plan de Amortización Diario ({schedule.length} días)</span>
            </h3>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {schedule.map((row) => (
              <div
                key={row.installmentNumber}
                className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition-colors ${
                  row.isPaid
                    ? 'bg-emerald-50/40 border-emerald-200/60'
                    : 'bg-slate-50/60 border-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      row.isPaid ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {row.installmentNumber}
                  </span>
                  <div>
                    <p className="font-bold text-slate-800">Día {row.installmentNumber}</p>
                    <p className="text-[10px] text-slate-400">{row.expectedDate}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-slate-800">{formatCOP(row.expectedAmount)}</p>
                  <p
                    className={`text-[10px] font-bold ${
                      row.isPaid ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {row.isPaid ? '✓ Pagado' : 'Pendiente'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        loan={loan}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={loadData}
      />
    </div>
  );
};
