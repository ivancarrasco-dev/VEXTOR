import React from 'react';
import { Camera, Building2 } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

const CompanySection = ({ companyData, setCompanyData, handleCompanySave, showToast }) => {
  return (
    <form onSubmit={handleCompanySave} className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center gap-5 bg-v-dark/30 p-4 rounded-xl border border-v-dark-border/40">
        <div className="relative group shrink-0">
          <div className="h-16 w-16 rounded-xl bg-v-dark border border-v-dark-border flex items-center justify-center text-v-gray p-2 overflow-hidden shadow-inner">
            <Building2 size={24} />
          </div>
          <button type="button" className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center text-v-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Camera size={16} />
          </button>
        </div>
        <div className="text-center sm:text-left">
          <h4 className="font-bold text-v-white">{companyData.name}</h4>
          <p className="text-xs text-v-gray mt-0.5">NIT: {companyData.nit}</p>
          <button type="button" className="text-xs font-semibold text-primary hover:underline mt-1.5 inline-block cursor-pointer">Subir nuevo logotipo institucional</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Razón Social / Nombre Comercial"
          value={companyData.name}
          onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
          required
        />
        <Input
          label="Identificación Tributaria (NIT / RUC)"
          placeholder="901.458.125-3"
          value={companyData.nit}
          onChange={(e) => setCompanyData({ ...companyData, nit: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Dirección Principal"
          value={companyData.address}
          onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
        />
        <Input
          label="Ciudad / Municipio"
          value={companyData.city}
          onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Correo de Contacto"
          type="email"
          value={companyData.email}
          onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
        />
        <Input
          label="Teléfono PBX"
          value={companyData.phone}
          onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
        />
      </div>

      <div className="pt-4 border-t border-v-dark-border flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => showToast('Se descartaron los cambios.')}>Descartar</Button>
        <Button type="submit" variant="primary">Guardar Datos</Button>
      </div>
    </form>
  );
};

export default CompanySection;
