import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  MessageCircle,
  MapPin,
  ChevronLeft,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import { store } from '../core/services/store';
import { formatCOP } from '../core/services/loan-calculator';
import { PaymentModal } from './PaymentModal';
import type { Loan } from '../core/domain/types';

export const DailyRouteView: React.FC = () => {
  const [targetDate, setTargetDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [filterTab, setFilterTab] = useState<'pending' | 'paid' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<Loan | null>(null);

  const loadData = () => {
    const allLoans = store.getLoans().filter((l) => l.status === 'active');
    setLoans(allLoans);
  };

  useEffect(() => {
    loadData();
    return store.subscribe(loadData);
  }, []);

  const changeDate = (days: number) => {
    const current = new Date(targetDate);
    current.setDate(current.getDate() + days);
    setTargetDate(current.toISOString().split('T')[0]);
  };

  const filteredLoans = loans.filter((l) => {
    const matchesSearch =
      (l.borrower_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.borrower_address || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'pending') return !l.is_paid_today;
    if (filterTab === 'paid') return l.is_paid_today;
    return true;
  });

  const totalDailyTarget = loans.reduce((acc, l) => acc + l.daily_payment, 0);
  const paidTodayLoans = loans.filter((l) => l.is_paid_today);
  const totalCollectedToday = paidTodayLoans.reduce((acc, l) => acc + l.daily_payment, 0);

  return (
    <div className="space-y-5 pb-16">
      {/* Date Header & Navigator */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider bg-sky-50 px-2 py-0.5 rounded-md">
            Ruta de Cobro
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Cobranza Diaria
          </h1>
          <p className="text-xs text-slate-500">
            Control de cobradores y metas del día
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 hover:bg-white rounded-xl text-slate-600 transition-colors shadow-none hover:shadow-sm"
            title="Día anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-2 text-xs font-bold text-slate-800">
            <Calendar className="w-4 h-4 text-sky-600" />
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>
          <button
            onClick={() => changeDate(1)}
            className="p-2 hover:bg-white rounded-xl text-slate-600 transition-colors shadow-none hover:shadow-sm"
            title="Día siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Daily Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Meta a Cobrar</p>
          <p className="text-lg font-black text-slate-900 mt-0.5">{formatCOP(totalDailyTarget)}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{loans.length} clientes en ruta</p>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Recaudado Hoy</p>
          <p className="text-lg font-black text-emerald-600 mt-0.5">{formatCOP(totalCollectedToday)}</p>
          <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
            {paidTodayLoans.length} cobros completados
          </p>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Pendiente Hoy</p>
          <p className="text-lg font-black text-sky-600 mt-0.5">
            {formatCOP(Math.max(0, totalDailyTarget - totalCollectedToday))}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {loans.length - paidTodayLoans.length} visitas pendientes
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-sm self-start">
          <button
            onClick={() => setFilterTab('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterTab === 'pending'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pendientes ({loans.filter((l) => !l.is_paid_today).length})
          </button>
          <button
            onClick={() => setFilterTab('paid')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterTab === 'paid'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cobrados ({paidTodayLoans.length})
          </button>
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterTab === 'all'
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente o dirección..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/80 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
          />
        </div>
      </div>

      {/* Loans Grid / Cards */}
      <div className="space-y-3">
        {filteredLoans.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 text-sm">No hay cobros en este filtro</h3>
            <p className="text-xs text-slate-400 mt-1">
              Todos los clientes están al día o no coinciden con la búsqueda.
            </p>
          </div>
        ) : (
          filteredLoans.map((loan) => (
            <div
              key={loan.id}
              className={`bg-white rounded-3xl p-5 border shadow-sm transition-all ${
                loan.is_paid_today
                  ? 'border-emerald-200/80 bg-emerald-50/20'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900">
                      {loan.borrower_name}
                    </h3>
                    {loan.is_paid_today ? (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Cobrado Hoy
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Pendiente
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{loan.borrower_address || 'Sin dirección'}</span>
                    <span className="text-slate-300">•</span>
                    <span>{loan.borrower_city}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                    <div>
                      <span className="text-slate-400 text-[11px]">Cuota Diaria: </span>
                      <span className="font-extrabold text-sky-700">
                        {formatCOP(loan.daily_payment)}
                      </span>
                    </div>
                    <span className="text-slate-300">•</span>
                    <div>
                      <span className="text-slate-400 text-[11px]">Saldo Pendiente: </span>
                      <span className="font-bold text-slate-900">
                        {formatCOP(loan.pending_amount || 0)}
                      </span>
                    </div>
                    <span className="text-slate-300">•</span>
                    <div>
                      <span className="text-slate-400 text-[11px]">Día: </span>
                      <span className="font-semibold text-slate-800">
                        {loan.payments_made} / {loan.total_days}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {loan.borrower_phone && (
                    <>
                      <a
                        href={`tel:${loan.borrower_phone}`}
                        className="p-2.5 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        title="Llamar al cliente"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                      <a
                        href={`https://wa.me/57${loan.borrower_phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(
                          loan.borrower_name || ''
                        )},%20te%20contacto%20de%20CobraDiario%20para%20la%20cuota%20diaria%20de%20${encodeURIComponent(
                          formatCOP(loan.daily_payment)
                        )}.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="Escribir por WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </>
                  )}

                  <button
                    onClick={() => setSelectedLoanForPayment(loan)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/10 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <DollarSign className="w-4 h-4 text-sky-400" />
                    <span>{loan.is_paid_today ? 'Registrar Abono' : 'Registrar Cobro'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <PaymentModal
        isOpen={Boolean(selectedLoanForPayment)}
        loan={selectedLoanForPayment}
        onClose={() => setSelectedLoanForPayment(null)}
        onPaymentSuccess={loadData}
      />
    </div>
  );
};
