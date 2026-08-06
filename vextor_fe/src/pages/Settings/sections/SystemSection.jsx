import React from 'react';
import { Select } from '../../../components/ui/Select';

const SystemSection = ({ systemSettings, setSystemSettings, showToast }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Timezone */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-v-gray">Zona Horaria del Servidor</label>
          <Select
            value={systemSettings.timezone}
            onChange={(e) => {
              setSystemSettings({ ...systemSettings, timezone: e.target.value });
              showToast('Zona horaria configurada.');
            }}
          >
            <option value="America/Bogota">Bogotá (GMT-5)</option>
            <option value="America/Santiago">Santiago (GMT-4)</option>
            <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
            <option value="America/Lima">Lima (GMT-5)</option>
            <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
          </Select>
        </div>

        {/* Currency */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-v-gray">Moneda Base</label>
          <Select
            value={systemSettings.currency}
            onChange={(e) => {
              setSystemSettings({ ...systemSettings, currency: e.target.value });
              showToast('Moneda base actualizada.');
            }}
          >
            <option value="COP">COP ($) - Peso Colombiano</option>
            <option value="USD">USD ($) - Dólar Estadounidense</option>
            <option value="EUR">EUR (€) - Euro</option>
            <option value="MXN">MXN ($) - Peso Mexicano</option>
            <option value="CLP">CLP ($) - Peso Chileno</option>
          </Select>
        </div>

        {/* Date format */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-v-gray">Formato de Fecha</label>
          <Select
            value={systemSettings.dateFormat}
            onChange={(e) => {
              setSystemSettings({ ...systemSettings, dateFormat: e.target.value });
              showToast('Formato de fecha de interfaz configurado.');
            }}
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY (Ej. 05/08/2026)</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY (Ej. 08/05/2026)</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (Ej. 2026-08-05)</option>
          </Select>
        </div>

        {/* Records per page */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-v-gray">Registros por Página (Listados)</label>
          <Select
            value={systemSettings.recordsPerPage}
            onChange={(e) => {
              setSystemSettings({ ...systemSettings, recordsPerPage: e.target.value });
              showToast('Límite de paginación configurado.');
            }}
          >
            <option value="5">5 registros por página</option>
            <option value="10">10 registros por página</option>
            <option value="25">25 registros por página</option>
            <option value="50">50 registros por página</option>
          </Select>
        </div>

      </div>
    </div>
  );
};

export default SystemSection;
