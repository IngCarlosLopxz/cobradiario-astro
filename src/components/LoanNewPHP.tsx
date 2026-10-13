import React, { useState, useEffect } from 'react';
import { SupabaseService } from '../core/services/supabase-service';
import { Borrower } from '../core/domain/types';

export const LoanNewPHP: React.FC = () => {
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [borrowerId, setBorrowerId] = useState<number | ''>('');
  const [amount, setAmount] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>('20');
  const [totalDays, setTotalDays] = useState<string>('30');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadBorrowers() {
      const bList = await SupabaseService.getBorrowers();
      setBorrowers(bList.filter(b => b.status === 'active'));
      const params = new URLSearchParams(window.location.search);
      const preB = params.get('borrower_id');
      if (preB) setBorrowerId(Number(preB));
    }
    loadBorrowers();
  }, []);

  const numAmount = parseFloat(amount) || 0;
  const numRate = parseFloat(interestRate) || 0;
  const numDays = parseInt(totalDays) || 0;

  const totalWithInterest = numAmount + (numAmount * numRate / 100);
  const dailyPayment = numDays > 0 ? totalWithInterest / numDays : 0;
  const interestOnly = totalWithInterest - numAmount;

  const selectedBorrower = borrowers.find(b => b.id === Number(borrowerId));
  const money = (val: number) => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!borrowerId) errs.borrower_id = 'Selecciona un cliente.';
    if (numAmount <= 0) errs.amount = 'El monto debe ser mayor a 0.';
    if (numRate < 0 || numRate > 100) errs.interest_rate = 'La tasa debe estar entre 0 y 100.';
    if (numDays <= 0) errs.total_days = 'Los días deben ser mayor a 0.';
    if (!startDate) errs.start_date = 'Fecha inválida.';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const newLoan = await SupabaseService.createLoan({
        borrower_id: Number(borrowerId),
        amount: numAmount,
        interest_rate: numRate,
        total_days: numDays,
        start_date: startDate
      });
      window.location.href = `/loans/${newLoan.id}`;
    } catch (err: any) {
      alert('Error creando préstamo: ' + err.message);
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <a href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Volver
        </a>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Nuevo Préstamo</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Form */}
        <div className="md:col-span-3 bg-white rounded-2xl border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Borrower select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="borrower_id">
                Cliente <span className="text-red-500">*</span>
              </label>
              <select
                id="borrower_id"
                value={borrowerId}
                onChange={(e) => setBorrowerId(e.target.value ? Number(e.target.value) : '')}
                className={`w-full px-3 py-2 rounded-xl border ${errors.borrower_id ? 'border-red-400 bg-red-50' : 'border-gray-200'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`}
              >
                <option value="">— Seleccionar cliente —</option>
                {borrowers.map(b => (
                  <option key={b.id} value={b.id}>{b.full_name}</option>
                ))}
              </select>
              {errors.borrower_id && <p className="mt-1 text-xs text-red-500">{errors.borrower_id}</p>}

              {selectedBorrower && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {(selectedBorrower.full_name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-800">{selectedBorrower.full_name}</p>
                    <p className="text-[10px] text-blue-500">{selectedBorrower.address || 'Sin dirección'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="amount">
                Monto a prestar <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  id="amount"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-7 pr-4 py-2 rounded-xl border ${errors.amount ? 'border-red-400 bg-red-50' : 'border-gray-200'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
            </div>

            {/* Interest rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="interest_rate">
                Tasa de interés (%) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="interest_rate"
                  min="0"
                  max="100"
                  step="0.5"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="20"
                  className={`w-full pr-8 pl-4 py-2 rounded-xl border ${errors.interest_rate ? 'border-red-400 bg-red-50' : 'border-gray-200'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
              {errors.interest_rate && <p className="mt-1 text-xs text-red-500">{errors.interest_rate}</p>}
            </div>

            {/* Total days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="total_days">
                Días para pagar <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="total_days"
                min="1"
                value={totalDays}
                onChange={(e) => setTotalDays(e.target.value)}
                placeholder="30"
                className={`w-full px-4 py-2 rounded-xl border ${errors.total_days ? 'border-red-400 bg-red-50' : 'border-gray-200'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.total_days && <p className="mt-1 text-xs text-red-500">{errors.total_days}</p>}
            </div>

            {/* Start date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="start_date">
                Fecha de inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="start_date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-4 py-2 rounded-xl border ${errors.start_date ? 'border-red-400 bg-red-50' : 'border-gray-200'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.start_date && <p className="mt-1 text-xs text-red-500">{errors.start_date}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <a href="/" className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </a>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                {submitting ? 'Creando...' : 'Crear Préstamo'}
              </button>
            </div>
          </form>
        </div>

        {/* Live summary panel */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Resumen del Préstamo</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Capital prestado:</span>
                <span className="font-semibold text-gray-800">{money(numAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Interés ({numRate}%):</span>
                <span className="font-semibold text-blue-600">{money(interestOnly)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <span className="font-medium text-gray-700">Total a devolver:</span>
                <span className="font-bold text-gray-900 text-base">{money(totalWithInterest)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Plazo:</span>
                <span className="font-semibold text-gray-800">{numDays} días</span>
              </div>
              <div className="flex justify-between bg-blue-50 p-3 rounded-xl border border-blue-100 mt-2">
                <span className="font-medium text-blue-800">Cuota diaria:</span>
                <span className="font-bold text-blue-700 text-lg">{money(dailyPayment)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
