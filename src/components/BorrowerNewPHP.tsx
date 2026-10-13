import React, { useState } from 'react';
import { SupabaseService } from '../core/services/supabase-service';

export const BorrowerNewPHP: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('La Jagua de Ibirico');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleGeocode = async () => {
    if (!address && !city) {
      alert('Ingresa una dirección o ciudad para geolocalizar.');
      return;
    }
    try {
      const q = `${address}, ${city}, Colombia`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=co&q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setLatitude(data[0].lat);
        setLongitude(data[0].lon);
      } else {
        alert('No se encontraron coordenadas para esta dirección.');
      }
    } catch (e: any) {
      alert('Error en geocodificación: ' + e.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrors({ full_name: 'El nombre es obligatorio.' });
      return;
    }

    setSubmitting(true);
    try {
      let lat = latitude ? parseFloat(latitude) : null;
      let lng = longitude ? parseFloat(longitude) : null;

      // Auto-geocode if missing
      if ((!lat || !lng) && (address || city)) {
        try {
          const q = `${address}, ${city}, Colombia`;
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=co&q=${encodeURIComponent(q)}`);
          const data = await res.json();
          if (data && data.length > 0) {
            lat = parseFloat(data[0].lat);
            lng = parseFloat(data[0].lon);
          }
        } catch (_) {}
      }

      await SupabaseService.saveBorrower({
        full_name: fullName.trim(),
        document_number: documentNumber.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        latitude: lat,
        longitude: lng,
        status: 'active'
      });

      window.location.href = '/borrowers';
    } catch (err: any) {
      alert('Error creando cliente: ' + err.message);
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <a href="/borrowers" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Volver
        </a>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Nuevo Cliente</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej. Juan Pérez"
              className={`w-full px-4 py-2 rounded-xl border ${errors.full_name ? 'border-red-400 bg-red-50' : 'border-gray-200'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cédula / Documento</label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="1003255..."
                className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="310..."
                className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle 5 #8-98"
                className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad / Municipio</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="La Jagua de Ibirico"
                className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Coordinates */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Geolocalización en Mapa</label>
              <button
                type="button"
                onClick={handleGeocode}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
              >
                📍 Auto-detectar coordenadas
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Latitud (ej: 9.5607)"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Longitud (ej: -73.3350)"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <a href="/borrowers" className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </a>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer"
            >
              {submitting ? 'Guardando...' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};
