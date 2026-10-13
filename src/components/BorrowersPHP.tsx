import React, { useState, useEffect } from 'react';
import { SupabaseService } from '../core/services/supabase-service';
import { Borrower, Loan } from '../core/domain/types';

export const BorrowersPHP: React.FC = () => {
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const [b, l] = await Promise.all([
          SupabaseService.getBorrowers(),
          SupabaseService.getLoans(),
        ]);
        setBorrowers(b);
        setLoans(l);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Group active loans and calculate alerts
  const loanAlerts: Record<number, { overdue: boolean; near_end: boolean; days_left: number; missed: number }> = {};
  const activeLoansCount: Record<number, number> = {};
  const totalLoansCount: Record<number, number> = {};

  loans.forEach(l => {
    totalLoansCount[l.borrower_id] = (totalLoansCount[l.borrower_id] || 0) + 1;
    if (l.status === 'active') {
      activeLoansCount[l.borrower_id] = (activeLoansCount[l.borrower_id] || 0) + 1;

      const daysLeft = l.total_days - l.payments_made;
      const daysSinceStart = Math.floor((new Date(todayStr).getTime() - new Date(l.start_date).getTime()) / (1000 * 60 * 60 * 24));
      const missed = Math.max(daysSinceStart - l.payments_made, 0);
      const isOverdue = missed > 0;
      const isNearEnd = !isOverdue && daysLeft > 0 && daysLeft <= 5;

      const bid = l.borrower_id;
      if (!loanAlerts[bid] || isOverdue) {
        loanAlerts[bid] = { overdue: isOverdue, near_end: isNearEnd, days_left: daysLeft, missed };
      }
    }
  });

  const filtered = borrowers.filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (b.full_name || '').toLowerCase().includes(q) ||
      (b.phone || '').toLowerCase().includes(q) ||
      (b.city || '').toLowerCase().includes(q) ||
      (b.document_number || '').toLowerCase().includes(q) ||
      (b.address || '').toLowerCase().includes(q)
    );
  });

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">{borrowers.length} clientes registrados</p>
        </div>
        <a
          href="/borrowers/new"
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo Cliente
        </a>
      </div>

      {/* Live Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, teléfono o ciudad..."
          className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {search && (
        <p className="text-xs text-gray-400 -mt-3">
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para "<strong>{search}</strong>"
        </p>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            No hay clientes registrados
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Documento</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Teléfono</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Ciudad</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Préstamos</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(b => {
                const alert = loanAlerts[b.id];
                const isOver = alert && alert.overdue;
                const isNear = alert && !isOver && alert.near_end;
                const activeL = activeLoansCount[b.id] || 0;
                const totalL = totalLoansCount[b.id] || 0;
                const rowBg = isOver ? 'bg-red-50/40 hover:bg-red-50' : isNear ? 'bg-amber-50/40 hover:bg-amber-50' : 'hover:bg-gray-50';

                return (
                  <tr key={b.id} className={`${rowBg} transition-colors`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isOver ? 'bg-red-100 text-red-600' : isNear ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {(b.full_name || 'C').charAt(0).toUpperCase()}
                          </div>
                          {isOver && (
                            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center" title="Cuotas atrasadas">
                              <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 9v4m0 4h.01"/>
                              </svg>
                            </span>
                          )}
                          {isNear && (
                            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center" title="Préstamo próximo a vencer">
                              <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 8v4l2 2"/>
                              </svg>
                            </span>
                          )}
                        </div>

                        <div>
                          <p className={`font-medium ${isOver ? 'text-red-700' : 'text-gray-900'}`}>{b.full_name}</p>
                          {b.address && <p className="text-xs text-gray-400">{b.address}</p>}
                          {isOver && (
                            <p className="text-[10px] text-red-500 font-medium flex items-center gap-0.5 mt-0.5">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                              </svg>
                              {alert.missed === 1 ? '1 cuota atrasada' : `${alert.missed} cuotas atrasadas`}
                            </p>
                          )}
                          {isNear && (
                            <p className="text-[10px] text-amber-600 font-medium flex items-center gap-0.5 mt-0.5">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                              Finaliza en {alert.days_left} día{alert.days_left > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 hidden md:table-cell">
                      {b.document_number ? (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-lg font-mono">
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"/>
                          </svg>
                          {b.document_number}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{b.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{b.city || '—'}</td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {activeL > 0 ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            isOver ? 'bg-red-100 text-red-700' : isNear ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {activeL} activo{activeL > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Sin préstamos</span>
                        )}
                        {totalL > activeL && (
                          <span className="text-[10px] text-gray-400">({totalL} total)</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        b.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {b.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/loans?borrower_id=${b.id}`}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          Préstamos
                        </a>
                        <a
                          href={`/borrowers/edit?id=${b.id}`}
                          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                        >
                          Editar
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
};
