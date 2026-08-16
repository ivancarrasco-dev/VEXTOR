import React from 'react';
import { Camera } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

const ProfileSection = ({ profileData, setProfileData, handleProfileSave, showToast }) => {
  const handlePhotoUpload = () => {
    const photoUrl = prompt('Ingrese la URL o cadena Base64 para su foto de perfil:');
    if (photoUrl !== null) {
      setProfileData({ ...profileData, photo: photoUrl });
      showToast('Previsualización de foto cargada.');
    }
  };

  return (
    <form onSubmit={handleProfileSave} className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center gap-5 bg-v-dark/30 p-4 rounded-xl border border-v-dark-border/40">
        <div className="relative group shrink-0">
          {profileData.photo ? (
            <img src={profileData.photo} alt="Foto Perfil" className="h-20 w-20 rounded-full object-cover border-2 border-primary/20" />
          ) : (
            <div className="h-20 w-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-2xl uppercase overflow-hidden shadow-inner">
              {profileData.name ? profileData.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'AV'}
            </div>
          )}
          <button type="button" onClick={handlePhotoUpload} className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-v-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Camera size={18} />
          </button>
        </div>
        <div className="text-center sm:text-left">
          <h4 className="font-bold text-v-white">{profileData.name}</h4>
          <p className="text-xs text-v-gray mt-0.5">{profileData.role}</p>
          <button type="button" onClick={handlePhotoUpload} className="text-xs font-semibold text-primary hover:underline mt-1.5 inline-block cursor-pointer">Cambiar fotografía de perfil</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Nombres y Apellidos"
          placeholder="Ej. Juan Pérez"
          value={profileData.name}
          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
          required
        />
        <Input
          label="Correo Electrónico"
          type="email"
          placeholder="admin@vextor.com"
          value={profileData.email}
          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Número de Teléfono"
          placeholder="+57 321 456 7890"
          value={profileData.phone}
          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
        />
        <Input
          label="Cargo Administrativo"
          placeholder="Administrador"
          value={profileData.role}
          disabled
          className="opacity-70 bg-v-dark cursor-not-allowed"
        />
      </div>

      <div className="pt-4 border-t border-v-dark-border flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => showToast('Se descartaron los cambios.')}>Descartar</Button>
        <Button type="submit" variant="primary">Guardar Perfil</Button>
      </div>
    </form>
  );
};

export default ProfileSection;
