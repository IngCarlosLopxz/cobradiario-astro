import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Users,
  CreditCard,
  TrendingUp,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Phone,
  Navigation,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { store } from '../core/services/store';
import { formatCOP } from '../core/services/loan-calculator';
import { InteractiveMap } from './InteractiveMap';
import { PaymentModal } from './PaymentModal';
import type { Loan, RouteMarker } from '../core/domain/types';

export const DashboardView: React.FC = () => {
  const [stats, setStats] = useState(store.getDashboardStats());
  const [markers, setMarkers] = useState<RouteMarker[]>([]);
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [recentPayments, setRecentPayments] = useState(store.getPayments().slice(0, 5));
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<Loan | null>(null);

  const refreshData = () => {
    setStats(store.getDashboardStats());
    setMarkers(store.getRouteMarkers());
    setActiveLoans(store.getLoans().filter(l => l.status === 'active'));
    setRecentPayments(store.getPayments().slice(0, 5));
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = store.subscribe(() => {
      refreshData();
    });
    return unsubscribe;
  }, []);

  const progressPercent = stats.todayTarget > 0
    ? Math.min(100, Math.round((stats.todayCollected / stats.todayTarget) * 100))
    : 0;

  const todayDateString = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const handleOpenPayment = (loanId: number) => {
    const loan = store.getLoanById(loanId);
    if (loan) {
      setSelectedLoanForPayment(loan);
    }
  };

  const handleSelectMarker = (marker: RouteMarker) => {
    handleOpenPayment(marker.loan_id);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 mb-1 capitalize">
            <Calendar className="w-3.5 h-3.5" />
            <span>{todayDateString}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Panel de Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gestión de cobros diarios ultra-fluida con Astro
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/daily"
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-sky-100"
          >
            <Navigation className="w-4 h-4 text-sky-600" />
            <span>Ruta de Cobro</span>
          </a>
          <a
            href="/loans/new"
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/10 transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Nuevo Préstamo</span>
          </a>
        </div>
      </div>

      {/* 4 Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Cobrado Hoy */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Cobrado Hoy
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900">
            {formatCOP(stats.todayCollected)}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
            <span>Meta del día:</span>
            <span className="font-bold text-slate-700">{formatCOP(stats.todayTarget)}</span>
          </div>
        </div>

        {/* Clientes Activos */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Clientes Activos
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900">
            {stats.activeClientsCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            En {stats.activeLoansCount} préstamos vigentes
          </p>
        </div>

        {/* Cartera Activa */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Cartera Prestada
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900">
            {formatCOP(stats.totalLent)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Capital colocado en calle
          </p>
        </div>

        {/* Recaudo Total */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Recaudo Total
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900">
            {formatCOP(stats.totalCollected)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Total histórico recuperado
          </p>
        </div>
      </div>

      {/* Progress Bar of Daily Collection */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Progreso del Cobro de Hoy</span>
          </div>
          <span className="text-sky-600 font-extrabold text-sm">{progressPercent}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2">
          <span>{formatCOP(stats.todayCollected)} recaudado</span>
          <span>Faltan {formatCOP(Math.max(0, stats.todayTarget - stats.todayCollected))}</span>
        </div>
      </div>

      {/* Interactive Route Map & Customer Pins */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <MapPin className="w-5 h-5 text-sky-600" />
              <span>Mapa de Ruta & Cobro en Vivo</span>
            </h2>
            <p className="text-xs text-slate-500">
              Toca cualquier marcador para ver detalles y registrar cobro inmediato
            </p>
          </div>
          <a
            href="/daily"
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <span>Ver listado</span>
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        <InteractiveMap
          markers={markers}
          onSelectMarker={handleSelectMarker}
        />
      </div>

      {/* Two Column Section: Priority Daily List & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Route List */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>Clientes en Ruta de Hoy</span>
            </h3>
            <span className="text-xs font-bold bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full">
              {activeLoans.length} préstamos
            </span>
          </div>

          <div className="space-y-2.5">
            {activeLoans.slice(0, 5).map((loan) => (
              <div
                key={loan.id}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-all flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-slate-900 truncate">
                      {loan.borrower_name}
                    </p>
                    {loan.is_paid_today ? (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                        Cobrado
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full">
                        Pendiente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {loan.borrower_address || 'Sin dirección'}
                  </p>
                  <p className="text-xs font-extrabold text-sky-700 mt-1">
                    Cuota: {formatCOP(loan.daily_payment)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {loan.borrower_phone && (
                    <a
                      href={`https://wa.me/57${loan.borrower_phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(
                        loan.borrower_name || ''
                      )},%20te%20saludamos%20de%20CobraDiario%20para%20la%20cuota%20de%20hoy.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                      title="Enviar WhatsApp"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleOpenPayment(loan.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
                  >
                    Cobrar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments Feed */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Últimos Pagos Registrados</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Recientes</span>
          </div>

          <div className="space-y-2.5">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No hay pagos registrados aún.
              </p>
            ) : (
              recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{p.borrower_name}</p>
                    <p className="text-[11px] text-slate-400">
                      Cuota #{p.payment_number} • {p.payment_date}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-600">
                      +{formatCOP(p.amount)}
                    </span>
                    {p.notes && (
                      <p className="text-[10px] text-slate-400 italic truncate max-w-[120px]">
                        {p.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={Boolean(selectedLoanForPayment)}
        loan={selectedLoanForPayment}
        onClose={() => setSelectedLoanForPayment(null)}
        onPaymentSuccess={refreshData}
      />
    </div>
  );
};
