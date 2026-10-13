import React, { useState, useEffect } from 'react';
import { SupabaseService } from '../core/services/supabase-service';
import { Loan } from '../core/domain/types';

export const DailyPHP: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [search, setSearch] = useState('');
  const [activePayForm, setActivePayForm] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState<Record<number, string>>({});
  const [payDate, setPayDate] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);

  const loadData = async () => {
    try {
      const allLoans = await SupabaseService.getLoans('active');
      const allPayments = await SupabaseService.getPayments();
      const todayPayMap = new Set(allPayments.filter(p => p.payment_date === todayStr).map(p => p.loan_id));

      const updated = allLoans.map(l => ({
        ...l,
        is_paid_today: todayPayMap.has(l.id)
      }));
      setLoans(updated);

      const amounts: Record<number, string> = {};
      const dates: Record<number, string> = {};
      updated.forEach(l => {
        amounts[l.id] = Number(l.daily_payment).toFixed(2);
        dates[l.id] = todayStr;
      });
      setPayAmount(amounts);
      setPayDate(dates);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCount = loans.length;
  const paidLoans = loans.filter(l => l.is_paid_today);
  const pendingLoans = loans.filter(l => !l.is_paid_today);
  const paidCount = paidLoans.length;
  const todayTotal = paidLoans.reduce((sum, l) => sum + Number(l.daily_payment), 0);
  const progressPct = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

  const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const now = new Date();
  const todayLabel = `${dayNames[now.getDay()]} ${now.getDate()} de ${monthNames[now.getMonth()]} de ${now.getFullYear()}`;

  const money = (val: number) => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleConfirmPayment = async (loanId: number, e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const amt = parseFloat(payAmount[loanId] || '0');
      const date = payDate[loanId] || todayStr;
      if (amt <= 0) {
        alert('Monto inválido');
        setSubmitting(false);
        return;
      }

      await SupabaseService.registerPayment({
        loan_id: loanId,
        amount: amt,
        payment_date: date,
        notes: 'Pago registrado desde Cobro del Día'
      });

      setFlash('Pago registrado con éxito en Supabase');
      setActivePayForm(null);
      await loadData();
      setTimeout(() => setFlash(null), 4000);
    } catch (err: any) {
      alert('Error registrando pago: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPending = pendingLoans.filter(l => !search || (l.borrower_name || '').toLowerCase().includes(search.toLowerCase()));
  const filteredPaid = paidLoans.filter(l => !search || (l.borrower_name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {flash && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border bg-green-50 border-green-300 text-green-800 text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          <span>{flash}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cobro del Día</h1>
          <p className="text-sm text-gray-400 capitalize">{todayLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Cobrados hoy</p>
          <p className="text-2xl font-bold text-blue-600">{paidCount} / {totalCount}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.round(progressPct)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>{paidCount} cobrados</span>
          <span>Total del día: <strong className="text-gray-700">{money(todayTotal)}</strong></span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente..."
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Pending section */}
      {filteredPending.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Pendientes ({filteredPending.length})
          </h2>
          <div className="space-y-3">
            {filteredPending.map(loan => {
              const progress = loan.total_with_interest > 0 ? Math.min((loan.total_paid / loan.total_with_interest) * 100, 100) : 0;
              const remaining = Math.max(loan.total_with_interest - loan.total_paid, 0);
              const daysLeft = loan.total_days - loan.payments_made;
              const isFormOpen = activePayForm === loan.id;

              return (
                <div key={loan.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{loan.borrower_name}</p>
                          {daysLeft <= 3 && daysLeft > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">
                              {daysLeft}d restantes
                            </span>
                          )}
                        </div>
                        {loan.borrower_address && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                            {loan.borrower_address}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span>Cuota: <strong className="text-gray-700">{money(loan.daily_payment)}</strong></span>
                          <span>Día {loan.payments_made}/{loan.total_days}</span>
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.round(progress)}%` }} />
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-400">
                            <span>Pagado: {money(loan.total_paid)}</span>
                            <span>Resta: {money(remaining)}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActivePayForm(isFormOpen ? null : loan.id)}
                        className="shrink-0 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors cursor-pointer"
                      >
                        Cobrar
                      </button>
                    </div>
                  </div>

                  {/* Inline payment form */}
                  {isFormOpen && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                      <form onSubmit={(e) => handleConfirmPayment(loan.id, e)} className="flex items-center gap-2 flex-wrap">
                        <div className="flex-1 min-w-[140px]">
                          <label className="block text-[10px] text-gray-400 mb-1">Monto</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={payAmount[loan.id] || ''}
                              onChange={(e) => setPayAmount({ ...payAmount, [loan.id]: e.target.value })}
                              className="w-full pl-6 pr-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-[130px]">
                          <label className="block text-[10px] text-gray-400 mb-1">Fecha</label>
                          <input
                            type="date"
                            value={payDate[loan.id] || todayStr}
                            onChange={(e) => setPayDate({ ...payDate, [loan.id]: e.target.value })}
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div className="flex gap-2 items-end">
                          <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => setActivePayForm(null)}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        Deja el monto por defecto para usar la cuota diaria ({money(loan.daily_payment)})
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Paid today section */}
      {filteredPaid.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Cobrados hoy ({filteredPaid.length})
          </h2>
          <div className="space-y-2">
            {filteredPaid.map(loan => (
              <div key={loan.id} className="bg-green-50 rounded-2xl border border-green-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{loan.borrower_name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>Cuota: {money(loan.daily_payment)}</span>
                        <span>Día {loan.payments_made}/{loan.total_days}</span>
                      </div>
                    </div>
                  </div>
                  <a
                    href={`/loans/${loan.id}`}
                    className="shrink-0 text-xs text-blue-600 hover:underline font-medium"
                  >
                    Ver préstamo →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
};
