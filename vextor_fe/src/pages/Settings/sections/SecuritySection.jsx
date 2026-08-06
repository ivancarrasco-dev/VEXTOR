import React from 'react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';

const SecuritySection = ({
  passwordForm,
  setPasswordForm,
  handlePasswordChange,
  is2FAEnabled,
  setIs2FAEnabled,
  activeSessions,
  handleRevokeSession,
  showToast
}) => {
  return (
    <div className="space-y-6">
      {/* Change password */}
      <form onSubmit={handlePasswordChange} className="bg-v-dark/20 border border-v-dark-border p-4 rounded-xl space-y-4">
        <h4 className="font-bold text-sm text-v-white">Cambiar Contraseña</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Contraseña Actual"
            type="password"
            required
            value={passwordForm.current}
            onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
          />
          <Input
            label="Nueva Contraseña"
            type="password"
            required
            value={passwordForm.next}
            onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
          />
          <Input
            label="Confirmar Contraseña"
            type="password"
            required
            value={passwordForm.confirm}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="primary">Actualizar Contraseña</Button>
        </div>
      </form>

      {/* 2FA block */}
      <div className="flex justify-between items-center bg-v-dark/20 p-4 border border-v-dark-border rounded-xl">
        <div>
          <p className="font-bold text-v-white text-sm">Autenticación en Dos Pasos (2FA)</p>
          <p className="text-xs text-v-gray mt-0.5">Añada una capa de seguridad extra utilizando una app de autenticación como Google Authenticator o Duo.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIs2FAEnabled(!is2FAEnabled);
            showToast(is2FAEnabled ? '2FA deshabilitado.' : '¡2FA habilitado correctamente!');
          }}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
            is2FAEnabled ? "bg-primary" : "bg-v-dark-border"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-v-dark shadow ring-0 transition duration-200 ease-in-out",
              is2FAEnabled ? "translate-x-5 bg-v-dark-constant" : "translate-x-0 bg-v-gray"
            )}
          />
        </button>
      </div>

      {/* Active sessions */}
      <div className="space-y-3">
        <h4 className="font-bold text-sm text-v-white">Sesiones Activas</h4>
        <p className="text-xs text-v-gray">Lista de dispositivos que han iniciado sesión recientemente en su cuenta.</p>
        <div className="border border-v-dark-border rounded-xl divide-y divide-v-dark-border bg-v-dark/10">
          {activeSessions.map((session) => (
            <div key={session.id} className="p-4 flex justify-between items-center text-sm">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-v-white">{session.browser}</span>
                  {session.isCurrent && (
                    <span className="text-[9px] font-bold tracking-wide uppercase px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20">
                      Esta Sesión
                    </span>
                  )}
                </div>
                <p className="text-xs text-v-gray mt-1">{session.location} • IP: {session.ip}</p>
              </div>
              {!session.isCurrent && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 h-8 font-semibold"
                  onClick={() => handleRevokeSession(session.id)}
                >
                  Revocar
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecuritySection;
