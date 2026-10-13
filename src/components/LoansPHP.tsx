import React, { useState, useEffect } from 'react';
import { SupabaseService } from '../core/services/supabase-service';
import { Loan } from '../core/domain/types';

export const LoansPHP: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'defaulted'>('all');
  const [borrowerFilterId, setBorrowerFilterId] = useState<number | null>(null);
  const [borrowerName, setBorrowerName] = useState<string>('');
  const [counts, setCounts] = useState({ all: 0, active: 0, completed: 0, defaulted: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const bId = params.get('borrower_id');
      const st = params.get('status') as any;
      if (bId) setBorrowerFilterId(Number(bId));
      if (st && ['all', 'active', 'completed', 'defaulted'].includes(st)) {
        setStatusFilter(st);
      }
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      const allLoans = await SupabaseService.getLoans();
      const cnt = { all: allLoans.length, active: 0, completed: 0, defaulted: 0 };
      allLoans.forEach(l => {
        if (l.status === 'active') cnt.active++;
        else if (l.status === 'completed') cnt.completed++;
        else if (l.status === 'defaulted') cnt.defaulted++;
      });
      setCounts(cnt);

      let filtered = allLoans;
      if (borrowerFilterId) {
        filtered = filtered.filter(l => l.borrower_id === borrowerFilterId);
        if (filtered.length > 0) {
          setBorrowerName(filtered[0].borrower_name || '');
        }
      }
      if (statusFilter !== 'all') {
        filtered = filtered.filter(l => l.status === statusFilter);
      }
      setLoans(filtered);
    }
    loadData();
  }, [statusFilter, borrowerFilterId]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const money = (val: number) => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const tabs = [
    { key: 'all', label: 'Todos', color: 'gray' },
    { key: 'active', label: 'Activos', color: 'blue' },
    { key: 'completed', label: 'Completados', color: 'green' },
    { key: 'defaulted', label: 'Vencidos', color: 'red' },
  ] as const;

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Préstamos</h1>
          <p className="text-sm text-gray-500">
            {borrowerFilterId ? (
              <>
                Préstamos de <strong>{borrowerName}</strong> —{' '}
                <a href="/loans" className="text-blue-600 hover:underline">Ver todos</a>
              </>
            ) : (
              `${loans.length} préstamos encontrados`
            )}
          </p>
        </div>
        <a
          href="/loans/new"
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo Préstamo
        </a>
      </div>

      {/* Tabs */}
      {!borrowerFilterId && (
        <div className="flex gap-2 flex-wrap">
          {tabs.map(tab => {
            const isActive = statusFilter === tab.key;
            const colorClass =
              tab.color === 'gray' ? (isActive ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')
              : tab.color === 'blue' ? (isActive ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50')
              : tab.color === 'green' ? (isActive ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-600 border-green-200 hover:bg-green-50')
              : (isActive ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-600 border-red-200 hover:bg-red-50');

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${colorClass}`}
              >
                {tab.label}
                <span className={`${isActive ? 'bg-white/30' : 'bg-gray-100'} px-1.5 py-0.5 rounded-full text-[10px] font-bold`}>
                  {counts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* List */}
      {loans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center text-sm text-gray-400">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          No hay préstamos en esta categoría
        </div>
      ) : (
        <div className="space-y-3">
          {loans.map(loan => {
            const progress = loan.total_with_interest > 0 ? Math.min((loan.total_paid / loan.total_with_interest) * 100, 100) : 0;
            const remaining = Math.max(loan.total_with_interest - loan.total_paid, 0);
            const daysLeft = loan.total_days - loan.payments_made;

            const daysSinceStart = Math.floor((new Date(todayStr).getTime() - new Date(loan.start_date).getTime()) / (1000 * 60 * 60 * 24));
            const missedPayments = loan.status === 'active' ? Math.max(daysSinceStart - loan.payments_made, 0) : 0;
            const isOverdue = missedPayments > 0;

            const cardBorder = isOverdue ? 'border-red-300' : 'border-gray-200';
            const cardBg = isOverdue ? 'bg-red-50/40' : 'bg-white';
            const avatarColors = isOverdue ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600';
            const nameColor = isOverdue ? 'text-red-700' : 'text-gray-900';
            const barColor = loan.status === 'completed' ? 'bg-green-500' : isOverdue ? 'bg-red-400' : 'bg-blue-600';

            return (
              <a
                key={loan.id}
                href={`/loans/${loan.id}`}
                className={`${cardBg} rounded-2xl border ${cardBorder} p-4 hover:shadow-md transition-all block`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full ${avatarColors} flex items-center justify-center text-sm font-bold shrink-0 relative`}>
                      {(loan.borrower_name || 'C').charAt(0).toUpperCase()}
                      {isOverdue && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 9v4m0 4h.01"/>
                          </svg>
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-semibold ${nameColor}`}>{loan.borrower_name}</p>
                        {loan.status === 'active' ? (
                          isOverdue ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-600">Vencido</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">Activo</span>
                          )
                        ) : loan.status === 'completed' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">Completado</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-600">Vencido</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {loan.borrower_address || loan.borrower_city || 'Sin dirección'}
                      </p>
                      <p className="text-xs text-gray-400">Inicio: {loan.start_date}</p>
                      {isOverdue && (
                        <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-0.5">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          {missedPayments === 1 ? '1 cuota sin pagar' : `${missedPayments} cuotas sin pagar`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`text-lg font-bold ${isOverdue ? 'text-red-700' : 'text-gray-900'}`}>{money(loan.amount)}</p>
                    <p className="text-xs text-gray-400">{loan.interest_rate}% interés</p>
                    <p className={`text-xs ${isOverdue ? 'text-red-500' : 'text-blue-600'} font-medium`}>{money(loan.daily_payment)}/día</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{loan.payments_made} de {loan.total_days} pagos</span>
                    <span>
                      {loan.status === 'active' ? `${daysLeft} días restantes` : loan.status === 'completed' ? 'Completado' : 'Vencido'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`${barColor} h-2 rounded-full`} style={{ width: `${Math.round(progress)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Cobrado: <span className="font-medium text-gray-700">{money(loan.total_paid)}</span></span>
                    <span>Pendiente: <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>{money(remaining)}</span></span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </main>
  );
};
