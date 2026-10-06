import React, { useState } from 'react';
import { User, Mail, Phone, Save, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { showAlert } from '../../utils/sweetalert';

export const UserProfile = () => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || 'Juan Pérez',
    email: user?.email || 'usuario@empresa.com',
    phone: user?.phone || '310 123 4567',
    city: 'Bogotá, D.C.',
    document: '1018293847'
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showAlert('Perfil Actualizado', 'Los cambios en tu perfil han sido guardados correctamente.', 'success');
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 text-left">
      {/* Header */}
      <div className="bg-v-dark-soft p-6 sm:p-8 rounded-3xl border border-v-dark-border shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-3xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary font-black text-3xl shadow-inner shrink-0">
            {formData.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-v-white tracking-tight">{formData.name}</h1>
              <Badge variant="primary" size="xs">Cuenta Activa</Badge>
            </div>
            <p className="text-xs text-v-gray mt-1 flex items-center gap-2">
              <Mail size={14} className="text-primary" /> {formData.email}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Edit Form */}
      <div className="bg-v-dark-soft p-6 sm:p-8 rounded-3xl border border-v-dark-border shadow-xl space-y-6">
        <h2 className="text-lg font-extrabold text-v-white border-b border-v-dark-border pb-3 flex items-center gap-2">
          <User size={20} className="text-primary" /> Datos Personales del Usuario
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Nombre Completo"
              icon={User}
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <Input
              label="Correo Electrónico"
              icon={Mail}
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <Input
              label="Número Telefónico"
              icon={Phone}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <Input
              label="Número de Documento"
              icon={ShieldCheck}
              value={formData.document}
              onChange={(e) => setFormData({ ...formData, document: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t border-v-dark-border flex justify-end">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
              className="flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Save size={16} /> Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfile;
