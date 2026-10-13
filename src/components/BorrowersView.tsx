import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Phone, MapPin, MessageCircle, ChevronRight } from 'lucide-react';
import { store } from '../core/services/store';
import type { Borrower, Loan } from '../core/domain/types';

export const BorrowersView: React.FC = () => {
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [search, setSearch] = useState('');

  const loadData = () => {
    setBorrowers(store.getBorrowers());
    setLoans(store.getLoans());
  };

  useEffect(() => {
    loadData();
    return store.subscribe(loadData);
  }, []);

  const filtered = borrowers.filter((b) => {
    const term = search.toLowerCase();
    return (
      b.full_name.toLowerCase().includes(term) ||
      b.document_number.toLowerCase().includes(term) ||
      b.phone.includes(term) ||
      b.address.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 pb-16">
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider bg-sky-50 px-2 py-0.5 rounded-md">
            Directorio Telefónico & Rutas
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Clientes Prestatarios
          </h1>
          <p className="text-xs text-slate-500">
            Administración de clientes, domicilios y georreferenciación
          </p>
        </div>

        <a
          href="/borrowers/new"
          className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/10 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus className="w-4 h-4 text-sky-400" />
          <span>Registrar Cliente</span>
        </a>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, cédula, teléfono o dirección..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((b) => {
          const clientLoans = loans.filter((l) => l.borrower_id === b.id);
          const activeLoan = clientLoans.find((l) => l.status === 'active');

          return (
            <div
              key={b.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 hover:border-slate-300 shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
                    {b.full_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      {b.full_name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold">
                      CC: {b.document_number || 'Sin documento'}
                    </p>
                  </div>
                </div>

                {activeLoan ? (
                  <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                    Crédito Activo
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    Sin Crédito
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 mb-4 p-3 bg-slate-50 rounded-2xl">
                <p className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{b.address || 'Sin dirección registrada'}</span>
                </p>
                <p className="flex items-center gap-2 text-slate-400 text-[11px]">
                  <span>{b.city || 'La Jagua de Ibirico'}</span>
                  {b.latitude && (
                    <span className="text-emerald-600 font-medium">
                      • GPS: {b.latitude.toFixed(4)}, {b.longitude?.toFixed(4)}
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {b.phone ? (
                    <>
                      <a
                        href={`tel:${b.phone}`}
                        className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        title="Llamar"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                      <a
                        href={`https://wa.me/57${b.phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(
                          b.full_name
                        )},%20te%20contacto%20de%20CobraDiario.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </>
                  ) : (
                    <span className="text-[11px] text-slate-400">Sin teléfono</span>
                  )}
                </div>

                {activeLoan ? (
                  <a
                    href={`/loans/${activeLoan.id}`}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                  >
                    <span>Ver Préstamo</span>
                    <ChevronRight className="w-4 h-4" />
                  </a>
                ) : (
                  <a
                    href={`/loans/new`}
                    className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                  >
                    <span>Prestar</span>
                    <ChevronRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
