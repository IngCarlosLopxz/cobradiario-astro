import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, Check, DollarSign, Calendar } from 'lucide-react';
import { store } from '../core/services/store';
import type { Borrower } from '../core/domain/types';
import { LoanCalculatorCard } from './LoanCalculatorCard';

export const NewLoanView: React.FC = () => {
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [borrowerId, setBorrowerId] = useState<number>(0);
  const [amount, setAmount] = useState<number>(500000);
  const [interestRate, setInterestRate] = useState<number>(20);
  const [totalDays, setTotalDays] = useState<number>(30);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const list = store.getBorrowers();
    setBorrowers(list);
    if (list.length > 0) {
      setBorrowerId(list[0].id);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerId) {
      alert('Por favor selecciona un cliente');
      return;
    }
    if (amount <= 0) {
      alert('El monto debe ser superior a 0');
      return;
    }

    try {
      setIsSubmitting(true);
      const loan = store.createLoan({
        borrower_id: borrowerId,
        amount,
        interest_rate: interestRate,
        total_days: totalDays,
        start_date: startDate
      });

      window.location.href = `/loans/${loan.id}`;
    } catch (err: any) {
      alert(err.message || 'Error al crear el préstamo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <a
          href="/loans"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Préstamos</span>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div>
            <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider bg-sky-50 px-2 py-0.5 rounded-md">
              Formulario de Crédito
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Nuevo Préstamo
            </h1>
            <p className="text-xs text-slate-500">
              Configura el cliente y condiciones del cobro diario
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Cliente Prestatario
                </label>
                <a
                  href="/borrowers/new"
                  className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Crear Nuevo Cliente</span>
                </a>
              </div>
              <select
                value={borrowerId}
                onChange={(e) => setBorrowerId(Number(e.target.value))}
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all cursor-pointer"
                required
              >
                {borrowers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.full_name} • CC: {b.document_number || 'S/N'} • {b.address}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Monto del Capital (COP)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  step="10000"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                  placeholder="500000"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Fecha de Desembolso / Inicio
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 mt-4 cursor-pointer"
            >
              <Check className="w-4 h-4 text-sky-400" />
              <span>{isSubmitting ? 'Generando...' : 'Crear y Habilitar Préstamo'}</span>
            </button>
          </form>
        </div>

        <div>
          <LoanCalculatorCard
            amount={amount}
            interestRate={interestRate}
            totalDays={totalDays}
            onChangeAmount={setAmount}
            onChangeInterestRate={setInterestRate}
            onChangeTotalDays={setTotalDays}
          />
        </div>
      </div>
    </div>
  );
};
