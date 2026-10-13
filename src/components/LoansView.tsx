import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Plus, CheckCircle2, Clock } from 'lucide-react';
import { store } from '../core/services/store';
import { formatCOP } from '../core/services/loan-calculator';
import type { Loan } from '../core/domain/types';

export const LoansView: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('active');
  const [search, setSearch] = useState('');

  const loadData = () => {
    setLoans(store.getLoans());
  };

  useEffect(() => {
    loadData();
    return store.subscribe(loadData);
  }, []);

  const filtered = loans.filter((l) => {
    const matchesSearch =
      (l.borrower_name || '').toLowerCase().includes(search.toLowerCase()) ||
      String(l.id).includes(search);

    if (!matchesSearch) return false;
    if (filterStatus === 'all') return true;
    return l.status === filterStatus;
  });

  const totalCapitalActive = loans
    .filter((l) => l.status === 'active')
    .reduce((acc, l) => acc + l.amount, 0);

  const totalExpectedActive = loans
    .filter((l) => l.status === 'active')
    .reduce((acc, l) => acc + l.total_with_interest, 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider bg-sky-50 px-2 py-0.5 rounded-md">
            Cartera de Créditos
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Préstamos
          </h1>
          <p className="text-xs text-slate-500">
            Control de contratos, cuotas diarias e historiales
          </p>
        </div>

        <a
          href="/loans/new"
          className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/10 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus className="w-4 h-4 text-sky-400" />
          <span>Nuevo Préstamo</span>
        </a>
      </div>

      {/* Portfolio Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Capital Activo</p>
          <p className="text-xl font-black text-slate-900 mt-0.5">{formatCOP(totalCapitalActive)}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {loans.filter((l) => l.status === 'active').length} créditos vigentes
          </p>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Total a Recuperar</p>
          <p className="text-xl font-black text-sky-600 mt-0.5">{formatCOP(totalExpectedActive)}</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
            +{formatCOP(Math.max(0, totalExpectedActive - totalCapitalActive))} ganancia bruta
          </p>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Finalizados</p>
          <p className="text-xl font-black text-emerald-600 mt-0.5">
            {loans.filter((l) => l.status === 'completed').length} créditos
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Préstamos 100% liquidados</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-sm self-start">
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'active'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Activos ({loans.filter((l) => l.status === 'active').length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'completed'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completados ({loans.filter((l) => l.status === 'completed').length})
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({loans.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente o ID..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/80 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
          />
        </div>
      </div>

      {/* Loans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((loan) => (
          <a
            key={loan.id}
            href={`/loans/${loan.id}`}
            className="bg-white rounded-3xl p-5 border border-slate-200/80 hover:border-sky-300 shadow-sm transition-all group hover:shadow-md relative overflow-hidden"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Préstamo #{loan.id} • {loan.start_date}
                </span>
                <h3 className="font-extrabold text-base text-slate-900 group-hover:text-sky-600 transition-colors">
                  {loan.borrower_name}
                </h3>
              </div>
              {loan.status === 'completed' ? (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Liquidado
                </span>
              ) : (
                <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Activo
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl mb-4 text-center">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Capital</p>
                <p className="text-xs font-bold text-slate-800">{formatCOP(loan.amount)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Total + Int</p>
                <p className="text-xs font-bold text-slate-900">{formatCOP(loan.total_with_interest)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Cuota Diaria</p>
                <p className="text-xs font-black text-sky-600">{formatCOP(loan.daily_payment)}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600">
                <span>Progreso ({loan.progress_percent}%)</span>
                <span>
                  {loan.payments_made} de {loan.total_days} cuotas
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    loan.status === 'completed' ? 'bg-emerald-500' : 'bg-sky-500'
                  }`}
                  style={{ width: `${loan.progress_percent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Pagado: {formatCOP(loan.total_paid)}</span>
                <span>Resta: {formatCOP(loan.pending_amount || 0)}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
