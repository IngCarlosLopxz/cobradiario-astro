import React, { useState, useEffect } from 'react';
import { SupabaseService } from '../core/services/supabase-service';
import { Loan, Payment } from '../core/domain/types';

interface LoanDetailProps {
  loanId: number;
}

export const LoanDetailPHP: React.FC<LoanDetailProps> = ({ loanId }) => {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [l, pList] = await Promise.all([
        SupabaseService.getLoanById(loanId),
        SupabaseService.getPayments(loanId)
      ]);
      setLoan(l);
      setPayments(pList);
      if (l) {
        setPayAmount(Number(l.daily_payment).toFixed(2));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loanId]);

  if (loading) {
    return <div className="py-20 text-center text-gray-400">Cargando préstamo #{loanId}...</div>;
  }

  if (!loan) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          Préstamo #{loanId} no encontrado en Supabase.
        </div>
      </main>
    );
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const daysSinceStart = Math.floor((new Date(todayStr).getTime() - new Date(loan.start_date).getTime()) / (1000 * 60 * 60 * 24));
  const missedPayments = loan.status === 'active' ? Math.max(daysSinceStart - loan.payments_made, 0) : 0;
  const isOverdue = missedPayments > 0;
  const daysLeft = loan.total_days - loan.payments_made;
  const isNearEnd = loan.status === 'active' && daysLeft > 0 && daysLeft <= 5;

  const totalWithInterest = Number(loan.total_with_interest);
  const totalPaid = Number(loan.total_paid || 0);
  const remaining = Math.max(0, totalWithInterest - totalPaid);
  const progress = totalWithInterest > 0 ? Math.min(100, (totalPaid / totalWithInterest) * 100) : 0;
  const interestOnly = totalWithInterest - Number(loan.amount);

  const money = (val: number) => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) {
      alert('Ingresa un monto válido');
      return;
    }

    setSubmitting(true);
    try {
      await SupabaseService.registerPayment({
        loan_id: loan.id,
        amount: amt,
        payment_date: payDate,
        notes: notes.trim() || undefined
      });
      setFlash('Pago registrado correctamente en Supabase.');
      setNotes('');
      await loadData();
      setTimeout(() => setFlash(null), 4000);
    } catch (err: any) {
      alert('Error registrando pago: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Back */}
      <a href="/loans" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        Volver a Préstamos
      </a>

      {flash && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border bg-green-50 border-green-300 text-green-800 text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          <span>{flash}</span>
        </div>
      )}

      {/* Loan Header */}
      <div className={`bg-white rounded-2xl border ${isOverdue ? 'border-red-300' : isNearEnd ? 'border-amber-300' : 'border-gray-200'} p-5`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center text-lg font-bold shrink-0`}>
              {(loan.borrower_name || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{loan.borrower_name}</h1>
                {loan.status === 'active' ? (
                  isOverdue ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">Con atraso</span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Activo</span>
                  )
                ) : loan.status === 'completed' ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Completado</span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">Vencido</span>
                )}
                {isNearEnd && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    Finaliza en {daysLeft} días
                  </span>
                )}
              </div>
              {loan.borrower_address && (
                <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  {loan.borrower_address}{loan.borrower_city ? `, ${loan.borrower_city}` : ''}
                </p>
              )}
              {loan.borrower_phone && (
                <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                  {loan.borrower_phone}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">
                Inicio: {loan.start_date} · Plazo: {loan.total_days} días
              </p>
            </div>
          </div>

          {loan.status === 'active' && (
            <a
              href="/daily"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shrink-0"
            >
              Ir a Cobros
            </a>
          )}
        </div>

        {isOverdue && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl border border-red-200 text-xs text-red-600 font-medium">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            {missedPayments} cuota{missedPayments > 1 ? 's' : ''} sin pagar — Monto atrasado: {money(missedPayments * Number(loan.daily_payment))}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Monto prestado</p>
          <p className="text-xl font-bold text-gray-900">{money(loan.amount)}</p>
          <p className="text-xs text-gray-400">+ {money(interestOnly)} interés</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Total a cobrar</p>
          <p className="text-xl font-bold text-gray-900">{money(loan.total_with_interest)}</p>
          <p className="text-xs text-gray-400">Cuota: {money(loan.daily_payment)}/día</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Cobrado</p>
          <p className="text-xl font-bold text-green-600">{money(loan.total_paid)}</p>
          <p className="text-xs text-gray-400">{loan.payments_made} pagos</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Pendiente</p>
          <p className="text-xl font-bold text-orange-500">{money(remaining)}</p>
          <p className="text-xs text-gray-400">{daysLeft > 0 ? `${daysLeft} días restantes` : 'Completado'}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-gray-800">Progreso del préstamo</span>
          <span className="text-gray-500">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className={`${loan.status === 'completed' ? 'bg-green-500' : 'bg-blue-600'} h-3 rounded-full transition-all`}
            style={{ width: `${Math.round(progress)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Día {loan.payments_made} de {loan.total_days}</span>
          <span>{money(loan.total_paid)} / {money(loan.total_with_interest)}</span>
        </div>
      </div>

      {/* Register payment form */}
      {loan.status === 'active' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">Registrar Pago</h2>
          <form onSubmit={handleRegisterPayment} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Monto a abonar</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Fecha de pago</label>
              <input
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Notas (opcional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Abono cuota"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer"
              >
                {submitting ? 'Registrando...' : 'Confirmar Pago'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Historial de Pagos ({payments.length})</h2>
          <span className="text-xs text-gray-400">Total cobrado: {money(totalPaid)}</span>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No hay pagos registrados aún para este préstamo.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {payments.map(p => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Pago #{p.payment_number || p.id}</p>
                  <p className="text-xs text-gray-400">Fecha: {p.payment_date} {p.notes ? `· ${p.notes}` : ''}</p>
                </div>
                <p className="text-sm font-bold text-green-600">{money(p.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};
