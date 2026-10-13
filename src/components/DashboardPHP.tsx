import React, { useState, useEffect } from 'react';
import { SupabaseService } from '../core/services/supabase-service';
import { Borrower, Loan, Payment } from '../core/domain/types';

export const DashboardPHP: React.FC = () => {
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');

  useEffect(() => {
    async function loadData() {
      try {
        const [b, l, p] = await Promise.all([
          SupabaseService.getBorrowers(),
          SupabaseService.getLoans(),
          SupabaseService.getPayments(),
        ]);
        setBorrowers(b);
        setLoans(l);
        setPayments(p);
      } catch (err) {
        console.error('Failed loading Supabase data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);
  const activeLoans = loans.filter(l => l.status === 'active');
  const activeCount = activeLoans.length;

  // Payments today
  const paymentsToday = payments.filter(p => p.payment_date === todayStr);
  const todayTotal = paymentsToday.reduce((sum, p) => sum + Number(p.amount), 0);
  const paidTodayLoanIds = new Set(paymentsToday.map(p => p.loan_id));

  // Today collected per loan
  const collectedPerLoan: Record<number, number> = {};
  paymentsToday.forEach(p => {
    collectedPerLoan[p.loan_id] = (collectedPerLoan[p.loan_id] || 0) + Number(p.amount);
  });

  // Active borrowers with active loans
  const activeBorrowerIds = new Set(activeLoans.map(l => l.borrower_id));
  const activeClients = activeBorrowerIds.size;

  // Total lent
  const totalLent = activeLoans.reduce((sum, l) => sum + Number(l.amount), 0);
  const totalCollectedAll = loans.reduce((sum, l) => sum + Number(l.total_paid || 0), 0);
  const totalExpectedAll = loans.reduce((sum, l) => sum + Number(l.total_with_interest), 0);

  // Month stats
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const monthStart = new Date(currentYear, currentMonth, 1).toISOString().slice(0, 10);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0).toISOString().slice(0, 10);

  const monthPayments = payments.filter(p => p.payment_date >= monthStart && p.payment_date <= monthEnd);
  const monthCollected = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const monthPayCount = monthPayments.length;

  const monthLoans = loans.filter(l => l.start_date >= monthStart && l.start_date <= monthEnd);
  const monthLent = monthLoans.reduce((sum, l) => sum + Number(l.amount), 0);
  const monthExpected = monthLoans.reduce((sum, l) => sum + Number(l.total_with_interest), 0);
  const monthProgress = monthExpected > 0 ? Math.min((monthCollected / monthExpected) * 100, 100) : 0;
  const monthBalance = monthCollected - monthLent;

  // Counts for today
  let paidCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;
  let todayPending = 0;
  let expectedDailyTotal = 0;

  activeLoans.forEach(l => {
    expectedDailyTotal += Number(l.daily_payment);
    const isPaid = paidTodayLoanIds.has(l.id);
    if (isPaid) {
      paidCount++;
    } else {
      pendingCount++;
      todayPending += Number(l.daily_payment);
      const daysSinceStart = Math.floor((new Date(todayStr).getTime() - new Date(l.start_date).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceStart > l.payments_made) {
        overdueCount++;
      }
    }
  });

  const todayProgress = expectedDailyTotal > 0 ? Math.min((todayTotal / expectedDailyTotal) * 100, 100) : 0;
  const todayPct = expectedDailyTotal > 0 ? (todayTotal / expectedDailyTotal) * 100 : 0;

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const monthLabel = `${monthNames[currentMonth]} ${currentYear}`;

  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const todayLabel = `${dayNames[now.getDay()]} ${now.getDate()} de ${monthNames[currentMonth].toLowerCase()} de ${currentYear}`;

  const money = (val: number) => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Init leaflet map with dynamic loader and retry
  useEffect(() => {
    if (loading || typeof window === 'undefined') return;

    let isMounted = true;

    const getLeaflet = (): Promise<any> => {
      if ((window as any).L) return Promise.resolve((window as any).L);
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => resolve((window as any).L);
        document.head.appendChild(script);
      });
    };

    getLeaflet().then((L) => {
      if (!isMounted || !L) return;

      const mapContainer = document.getElementById('client-map');
      if (!mapContainer) return;

      if ((mapContainer as any)._leaflet_id) {
        mapContainer.innerHTML = '';
        (mapContainer as any)._leaflet_id = null;
      }

      const map = L.map('client-map', { zoomControl: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const withCoords = borrowers.filter(b => b.latitude && b.longitude);
      if (withCoords.length === 0) {
        map.setView([9.5620, -73.3340], 15); // La Jagua de Ibirico
      } else {
        const markers: [number, number][] = [];
        withCoords.forEach(b => {
          const lat = Number(b.latitude);
          const lng = Number(b.longitude);
          const isPaid = activeLoans.filter(l => l.borrower_id === b.id).every(l => paidTodayLoanIds.has(l.id));

          const color = isPaid ? '#22c55e' : '#3b82f6';
          const icon = L.divIcon({
            className: '',
            html: `<div style="
              width:34px;height:34px;border-radius:50%;
              background:${color};border:3px solid #fff;
              box-shadow:0 3px 8px rgba(0,0,0,.35);
              display:flex;align-items:center;justify-content:center;
              font-size:13px;font-weight:700;color:#fff;
              font-family:system-ui,sans-serif;
            ">${(b.full_name || 'C').charAt(0).toUpperCase()}</div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
            popupAnchor: [0, -18],
          });

          const statusLabel = isPaid
            ? `<span style="background:#dcfce7;color:#16a34a;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;">✓ Cobrado hoy</span>`
            : `<span style="background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;">Pendiente</span>`;

          const popup = `
            <div style="min-width:180px;">
              <p style="font-weight:700;font-size:14px;margin:0 0 4px;color:#111;">${b.full_name}</p>
              ${b.address ? `<p style="font-size:12px;color:#6b7280;margin:0 0 2px;">📍 ${b.address}${b.city ? ', '+b.city : ''}</p>` : ''}
              ${b.phone ? `<p style="font-size:12px;color:#6b7280;margin:0 0 6px;">📞 ${b.phone}</p>` : ''}
              <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;">
                ${statusLabel}
              </div>
              <a href="/loans?borrower_id=${b.id}"
                 style="display:block;margin-top:8px;text-align:center;background:#2563eb;color:#fff;padding:5px 0;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;">
                Ver préstamos →
              </a>
            </div>`;

          L.marker([lat, lng], { icon }).addTo(map).bindPopup(popup);
          markers.push([lat, lng]);
        });

        if (markers.length === 1) {
          map.setView(markers[0], 15);
        } else if (markers.length > 1) {
          map.fitBounds(markers, { padding: [40, 40] });
        }
      }

      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    });

    return () => {
      isMounted = false;
    };
  }, [loading, borrowers, activeLoans]);

  // Card filter
  const filteredLoans = activeLoans.filter(loan => {
    const isPaid = paidTodayLoanIds.has(loan.id);
    const daysSince = Math.floor((new Date(todayStr).getTime() - new Date(loan.start_date).getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = !isPaid && (daysSince > loan.payments_made);

    const matchesSearch = !search || (loan.borrower_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'paid' && isPaid) ||
      (filter === 'pending' && !isPaid) ||
      (filter === 'overdue' && isOverdue);

    return matchesSearch && matchesFilter;
  });

  const withoutCoords = borrowers.filter(b => !b.latitude || !b.longitude);

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
          <p className="text-sm text-gray-500">Resumen de tus cobros diarios</p>
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

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Cobro del día — blue */}
        <div className="bg-blue-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-blue-200 uppercase tracking-wide">Cobro del Día</p>
            <div className="w-7 h-7 bg-blue-500/50 rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold">{money(todayTotal)}</p>
          <p className="text-xs text-blue-200 mt-1">{activeCount} préstamos activos</p>
        </div>

        {/* Total Prestado */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total Prestado</p>
            <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{money(totalLent)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Capital en la calle</p>
        </div>

        {/* Total Cobrado */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total Cobrado</p>
            <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{money(totalCollectedAll)}</p>
          <p className="text-xs text-gray-400 mt-0.5">de {money(totalExpectedAll)} total</p>
        </div>

        {/* Clientes */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Clientes</p>
            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeClients}</p>
          <p className="text-xs text-gray-400 mt-0.5">{activeClients} con préstamos activos</p>
        </div>
      </div>

      {/* Monthly report */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            <span className="text-sm font-semibold text-gray-800">Reporte del Mes</span>
          </div>
          <span className="text-xs text-gray-400">{monthLabel}</span>
        </div>

        {/* Top two columns: prestado / cobrado */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p class="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Prestado este mes</p>
            <p className="text-2xl font-bold text-gray-900">{money(monthLent)}</p>
            <p className="text-xs text-gray-400">{monthLoans.length} préstamos nuevos</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Cobrado este mes</p>
            <p className="text-2xl font-bold text-green-600">{money(monthCollected)}</p>
            <p className="text-xs text-gray-400">{monthPayCount} pagos recibidos</p>
          </div>
        </div>

        {/* Bottom four mini-stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="text-center p-3 rounded-xl border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Cuota esperada hoy</p>
            <p className="text-base font-bold text-gray-800">{money(expectedDailyTotal)}</p>
          </div>
          <div className="text-center p-3 rounded-xl border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Cobrado hoy</p>
            <p className="text-base font-bold text-green-600">{money(todayTotal)}</p>
          </div>
          <div className="text-center p-3 rounded-xl border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Falta por cobrar</p>
            <p className={`text-base font-bold ${todayPending > 0 ? 'text-orange-500' : 'text-gray-800'}`}>
              {money(todayPending)}
            </p>
          </div>
          <div className="text-center p-3 rounded-xl border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Clientes vencidos</p>
            <p className={`text-base font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-gray-800'}`}>
              {overdueCount}
            </p>
          </div>
        </div>

        {/* Progress bars */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Cobranzas del mes</span>
              <span>{Math.round(monthProgress)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(monthProgress, 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Cobro del día</span>
              <span>{Math.round(todayProgress)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`${todayProgress >= 100 ? 'bg-green-500' : todayProgress > 50 ? 'bg-blue-500' : 'bg-orange-400'} h-2 rounded-full transition-all`}
                style={{ width: `${todayProgress}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs pt-1 border-t border-gray-100">
            <span className="text-gray-400">Ganancia neta del mes</span>
            <span className={`font-semibold ${monthBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {(monthBalance >= 0 ? '+' : '') + money(monthBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* MAPA DE CLIENTES */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
              </svg>
              Mapa de Clientes
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {borrowers.filter(b => b.latitude && b.longitude).length} de {borrowers.length} clientes con ubicación registrada
            </p>
          </div>
          <a
            href="/borrowers"
            className="text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
          >
            Gestionar clientes
          </a>
        </div>

        {/* Map container */}
        <div id="client-map" style={{ height: '420px', zIndex: 0 }} />

        {withoutCoords.length > 0 && (
          <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 flex items-start gap-2 text-xs text-amber-700">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>
              {withoutCoords.length} cliente{withoutCoords.length > 1 ? 's' : ''} sin ubicación: {' '}
              {withoutCoords.slice(0, 5).map((b, i) => (
                <span key={b.id}>
                  {i > 0 && ', '}
                  <a href={`/borrowers/edit?id=${b.id}`} className="underline font-semibold text-amber-800 hover:text-amber-900">
                    {b.full_name}
                  </a>
                </span>
              ))}
              {withoutCoords.length > 5 && ` y ${withoutCoords.length - 5} más...`}
              — Haz clic en el nombre para fijar su ubicación.
            </span>
          </div>
        )}
      </div>

      {/* COBRO DE HOY */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Cobro de Hoy
              </h2>
              <p className="text-xs text-gray-400 mt-0.5 capitalize">{todayLabel}</p>
            </div>
            <a
              href="/daily"
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
            >
              Ir a cobrar
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center p-3 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-[10px] text-blue-400 uppercase tracking-wide">Total del día</p>
              <p className="text-xl font-bold text-blue-700">{money(expectedDailyTotal)}</p>
              <p className="text-[10px] text-blue-400">{activeCount} préstamos</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-green-50 border border-green-100">
              <p className="text-[10px] text-green-500 uppercase tracking-wide">Ya cobrado</p>
              <p className="text-xl font-bold text-green-600">{money(todayTotal)}</p>
              <p className="text-[10px] text-green-400">{paidCount} cliente{paidCount !== 1 ? 's' : ''}</p>
            </div>
            <div className={`text-center p-3 rounded-xl ${todayPending > 0 ? 'bg-orange-50 border border-orange-100' : 'bg-gray-50 border border-gray-100'}`}>
              <p className={`text-[10px] ${todayPending > 0 ? 'text-orange-400' : 'text-gray-400'} uppercase tracking-wide`}>Por cobrar</p>
              <p className={`text-xl font-bold ${todayPending > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{money(todayPending)}</p>
              <p className={`text-[10px] ${todayPending > 0 ? 'text-orange-400' : 'text-gray-400'}`}>{pendingCount} cliente{pendingCount !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progreso de hoy</span>
              <span>{Math.round(todayPct)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${todayPct >= 100 ? 'bg-green-500' : todayPct >= 50 ? 'bg-blue-500' : 'bg-orange-400'}`}
                style={{ width: `${Math.min(todayPct, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Per client breakdown */}
        <div className="divide-y divide-gray-50">
          {activeLoans.map(loan => {
            const isPaid = paidTodayLoanIds.has(loan.id);
            const collected = collectedPerLoan[loan.id] || 0;
            const daysSince = Math.floor((new Date(todayStr).getTime() - new Date(loan.start_date).getTime()) / (1000 * 60 * 60 * 24));
            const missed = Math.max(daysSince - loan.payments_made, 0);
            const isOverdue = !isPaid && missed > 0;
            const daysLeft = loan.total_days - loan.payments_made;
            const isNearEnd = !isPaid && daysLeft > 0 && daysLeft <= 5;

            return (
              <a
                key={loan.id}
                href={`/loans/${loan.id}`}
                className={`flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors ${isOverdue ? 'bg-red-50/30' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${isPaid ? 'bg-green-100' : isOverdue ? 'bg-red-100' : 'bg-gray-100'}`}>
                  {isPaid ? (
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                    </svg>
                  ) : isOverdue ? (
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isOverdue ? 'text-red-700' : 'text-gray-900'}`}>
                    {loan.borrower_name}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                    {loan.borrower_address && (
                      <>
                        <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        {loan.borrower_address}
                      </>
                    )}
                    {isOverdue && (
                      <>&nbsp;·&nbsp;<span className="text-red-400 font-medium">{missed} cuota{missed > 1 ? 's' : ''} atrasada{missed > 1 ? 's' : ''}</span></>
                    )}
                    {isNearEnd && (
                      <>&nbsp;·&nbsp;<span className="text-amber-500 font-medium">Finaliza en {daysLeft} día{daysLeft > 1 ? 's' : ''}</span></>
                    )}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  {isPaid ? (
                    <>
                      <p className="text-sm font-bold text-green-600">{money(collected)}</p>
                      <p className="text-[10px] text-green-400">Cobrado</p>
                    </>
                  ) : (
                    <>
                      <p className={`text-sm font-bold ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>{money(loan.daily_payment)}</p>
                      <p className={`text-[10px] ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>Pendiente</p>
                    </>
                  )}
                </div>

                <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </a>
            );
          })}
        </div>
      </div>

      {/* Filter pills & search */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Cobros de Hoy</h2>
            <p className="text-xs text-gray-400 capitalize">{todayLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400">Total del día</p>
            <p className="text-lg font-bold text-blue-600">{money(todayTotal)}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setFilter(filter === 'paid' ? 'all' : 'paid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === 'paid' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-600 border-green-300 hover:bg-green-50'
            }`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {paidCount} Finalizados
          </button>
          <button
            onClick={() => setFilter(filter === 'pending' ? 'all' : 'pending')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === 'pending' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
            }`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {pendingCount} Pendientes
          </button>
          {overdueCount > 0 && (
            <button
              onClick={() => setFilter(filter === 'overdue' ? 'all' : 'overdue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filter === 'overdue' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-600 border-red-300 hover:bg-red-50'
              }`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              {overdueCount} Vencidos
            </button>
          )}
        </div>

        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLoans.map(loan => {
            const isPaid = paidTodayLoanIds.has(loan.id);
            const daysSince = Math.floor((new Date(todayStr).getTime() - new Date(loan.start_date).getTime()) / (1000 * 60 * 60 * 24));
            const missedPayments = Math.max(daysSince - loan.payments_made, 0);
            const isOverdue = !isPaid && missedPayments > 0;
            const progress = loan.total_with_interest > 0 ? Math.min((loan.total_paid / loan.total_with_interest) * 100, 100) : 0;
            const remaining = Math.max(loan.total_with_interest - loan.total_paid, 0);

            return (
              <a
                key={loan.id}
                href={`/loans/${loan.id}`}
                className={`rounded-2xl border-2 ${isOverdue ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-white'} p-4 hover:shadow-md transition-all block`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {isOverdue && (
                      <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                    )}
                    <p className={`text-sm font-bold truncate ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                      {loan.borrower_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {isPaid ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Al día</span>
                    ) : isOverdue ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-600">Vencido</span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-600">Pendiente</span>
                    )}
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 flex items-center gap-1 mb-2">
                  <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span className="truncate">{loan.borrower_address || 'Sin dirección'}</span>
                </p>

                {isOverdue && (
                  <p className="text-[10px] text-red-500 font-medium mb-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {missedPayments === 1 ? '1 cuota sin pagar' : `${missedPayments} cuotas sin pagar`}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide">Préstamo</p>
                    <p className="text-xs font-bold text-gray-900">{money(loan.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide">Interés</p>
                    <p className="text-xs font-bold text-blue-600">{loan.interest_rate}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide">Cuota/día</p>
                    <p className="text-xs font-bold text-gray-900">{money(loan.daily_payment)}</p>
                  </div>
                </div>

                <p className="text-[10px] text-gray-400 mb-1">
                  {loan.payments_made} de {loan.total_days} pagos
                </p>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                  <div
                    className={`${isOverdue ? 'bg-red-400' : isPaid ? 'bg-blue-600' : 'bg-blue-500'} h-1.5 rounded-full`}
                    style={{ width: `${Math.round(progress)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-gray-400">
                    Pendiente: <span className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>{money(remaining)}</span>
                  </p>
                  <p className="text-[10px] text-gray-400">{Math.round(progress)}%</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </main>
  );
};
