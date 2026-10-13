import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Calendar, FileText, ArrowRight } from 'lucide-react';
import type { Loan } from '../core/domain/types';
import { formatCOP } from '../core/services/loan-calculator';
import { store } from '../core/services/store';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  onPaymentSuccess?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  loan,
  onPaymentSuccess,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (loan) {
      setAmount(loan.daily_payment);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setMessage(null);
    }
  }, [loan]);

  if (!loan) return null;

  const pendingAmount = loan.pending_amount ?? Math.max(0, loan.total_with_interest - loan.total_paid);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('El monto debe ser superior a 0');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = store.registerPayment({
        loan_id: loan.id,
        amount: Number(amount),
        payment_date: paymentDate,
        notes: notes.trim() || undefined,
      });

      if (onPaymentSuccess) onPaymentSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al registrar el cobro');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShortcut = (val: number) => {
    setAmount(Math.min(val, pendingAmount));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 z-10 max-h-[92vh] overflow-y-auto"
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />

            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider bg-sky-50 px-2 py-0.5 rounded-md">
                  Registro de Cobro
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  {loan.borrower_name}
                </h3>
                <p className="text-xs text-slate-500">
                  {loan.borrower_address || 'Sin dirección registrada'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-5 text-center">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Cuota Pactada</p>
                <p className="text-sm font-bold text-slate-800">{formatCOP(loan.daily_payment)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Saldo Restante</p>
                <p className="text-sm font-bold text-sky-600">{formatCOP(pendingAmount)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Progreso</p>
                <p className="text-sm font-bold text-slate-800">
                  {loan.payments_made} / {loan.total_days} d
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Monto a Cobrar (COP)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <input
                    type="number"
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                    placeholder="0"
                    required
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => handleShortcut(loan.daily_payment)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                  >
                    1 Cuota ({formatCOP(loan.daily_payment)})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShortcut(loan.daily_payment * 2)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                  >
                    2 Cuotas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShortcut(Math.ceil(loan.daily_payment / 2))}
                    className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                  >
                    Media Cuota
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShortcut(pendingAmount)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    Liquidar Todo
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Fecha del Pago
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Observaciones / Recibo (Opcional)
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none text-slate-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej. Pagó en efectivo, recibido por la esposa..."
                    rows={2}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-50"
              >
                <span>Confirmar y Guardar Cobro</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
