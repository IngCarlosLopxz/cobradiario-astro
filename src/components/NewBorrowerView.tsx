import React, { useState } from 'react';
import { ArrowLeft, User, Phone, MapPin, Navigation, Check, Loader2, FileText } from 'lucide-react';
import { store } from '../core/services/store';

export const NewBorrowerView: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('La Jagua de Ibirico');
  const [latitude, setLatitude] = useState<number | ''>(9.5607);
  const [longitude, setLongitude] = useState<number | ''>(-73.3350);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGeocode = async () => {
    if (!address && !city) {
      alert('Ingresa una dirección o ciudad primero');
      return;
    }

    try {
      setIsGeocoding(true);
      const query = `${address}, ${city}, Cesar, Colombia`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=co&q=${encodeURIComponent(
        query
      )}`;

      const res = await fetch(url, {
        headers: { 'User-Agent': 'CobraDiarioApp/1.0' },
      });
      const data = await res.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setLatitude(lat);
        setLongitude(lon);
      } else {
        setLatitude(9.5607);
        setLongitude(-73.3350);
      }
    } catch {
      alert('Error al consultar el servicio de mapas');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    try {
      setIsSubmitting(true);
      const borrower = store.saveBorrower({
        full_name: fullName.trim(),
        document_number: documentNumber.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        latitude: typeof latitude === 'number' ? latitude : null,
        longitude: typeof longitude === 'number' ? longitude : null,
        status: 'active',
      });

      window.location.href = '/borrowers';
    } catch (err: any) {
      alert(err.message || 'Error al guardar el cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <a
        href="/borrowers"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a Clientes</span>
      </a>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div>
          <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider bg-sky-50 px-2 py-0.5 rounded-md">
            Nuevo Registro
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Registrar Cliente
          </h1>
          <p className="text-xs text-slate-500">
            Ingresa los datos personales y ubicación para la ruta diaria
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nombre Completo *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. María Fernanda Gómez"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Cédula / Documento
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FileText className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="Ej. 1003254879"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Teléfono Celular / WhatsApp
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. 3105196193"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Dirección del Domicilio
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej. Calle 5 # 8-98 Barrio El Centro"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Municipio / Ciudad
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="La Jagua de Ibirico"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Georreferenciación GPS</p>
                <p className="text-[10px] text-slate-500">
                  Ubica el punto en el mapa para la ruta del cobrador
                </p>
              </div>
              <button
                type="button"
                onClick={handleGeocode}
                disabled={isGeocoding}
                className="px-3 py-1.5 rounded-xl bg-sky-100 text-sky-700 hover:bg-sky-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isGeocoding ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5" />
                )}
                <span>Auto-ubicar</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  Latitud
                </label>
                <input
                  type="number"
                  step="0.0000001"
                  value={latitude}
                  onChange={(e) => setLatitude(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  Longitud
                </label>
                <input
                  type="number"
                  step="0.0000001"
                  value={longitude}
                  onChange={(e) => setLongitude(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 mt-4 cursor-pointer"
          >
            <Check className="w-4 h-4 text-sky-400" />
            <span>Guardar Cliente</span>
          </button>
        </form>
      </div>
    </div>
  );
};
