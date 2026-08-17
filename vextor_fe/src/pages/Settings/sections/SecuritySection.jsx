import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';
import { Laptop, Smartphone, ShieldCheck, RefreshCw, AlertCircle, LogOut } from 'lucide-react';
import axios from 'axios';
import { vextorSwal, showConfirm } from '../../../utils/sweetalert';

const getRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 1000 / 60);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} min`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;

  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
};

const formatFriendlyDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const SecuritySection = ({
  is2FAEnabled,
  setIs2FAEnabled,
  showToast
}) => {
  // Password state
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Active Sessions state
  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [revokingId, setRevokingId] = useState(null);
  const [isRevokingOthers, setIsRevokingOthers] = useState(false);

  // Fetch real active sessions
  const fetchActiveSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const response = await axios.get('http://localhost:8000/api/security/sessions');
      setSessions(response.data || []);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      showToast('Error al cargar las sesiones activas.');
    } finally {
      setIsLoadingSessions(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchActiveSessions();
  }, [fetchActiveSessions]);

  // Handle Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.next !== passwordForm.confirm) {
      vextorSwal.fire({
        icon: 'warning',
        title: 'Las contraseñas no coinciden',
        text: 'La nueva contraseña y su confirmación deben ser idénticas.'
      });
      return;
    }

    if (passwordForm.next.length < 6) {
      vextorSwal.fire({
        icon: 'warning',
        title: 'Contraseña débil',
        text: 'La nueva contraseña debe tener al menos 6 caracteres.'
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await axios.post('http://localhost:8000/api/security/change-password', {
        current_password: passwordForm.current,
        new_password: passwordForm.next
      });

      showToast('¡Contraseña actualizada exitosamente!');
      setPasswordForm({ current: '', next: '', confirm: '' });
    } catch (error) {
      console.error('Error updating password:', error);
      const msg = error.response?.data?.detail || 'Error al actualizar la contraseña.';
      vextorSwal.fire({
        icon: 'error',
        title: 'Error de Seguridad',
        text: msg
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Revoke single session
  const handleRevokeSingle = async (sessionId) => {
    const result = await showConfirm(
      '¿Revocar esta sesión?',
      'El dispositivo seleccionado perderá acceso inmediato al sistema y requerirá volver a iniciar sesión.',
      'Sí, revocar sesión',
      'Cancelar',
      true
    );

    if (!result.isConfirmed) return;

    setRevokingId(sessionId);
    try {
      await axios.delete(`http://localhost:8000/api/security/sessions/${sessionId}`);
      showToast('Sesión revocada correctamente.');
      fetchActiveSessions();
    } catch (error) {
      console.error('Error revoking session:', error);
      const msg = error.response?.data?.detail || 'Error al revocar la sesión.';
      showToast(msg);
    } finally {
      setRevokingId(null);
    }
  };

  // Revoke all other sessions
  const handleRevokeAllOthers = async () => {
    const otherCount = sessions.filter(s => !s.is_current).length;
    if (otherCount === 0) {
      showToast('No hay otras sesiones activas para revocar.');
      return;
    }

    const result = await showConfirm(
      '¿Cerrar todas las demás sesiones?',
      `Se cerrarán ${otherCount} sesión(es) activa(s) en otros dispositivos. Tu sesión actual permanecerá activa.`,
      'Sí, cerrar todas las demás',
      'Cancelar',
      true
    );

    if (!result.isConfirmed) return;

    setIsRevokingOthers(true);
    try {
      const response = await axios.delete('http://localhost:8000/api/security/sessions-others/all');
      showToast(`Se cerraron ${response.data.count || otherCount} sesión(es) exitosamente.`);
      fetchActiveSessions();
    } catch (error) {
      console.error('Error revoking other sessions:', error);
      showToast('Error al cerrar las demás sesiones.');
    } finally {
      setIsRevokingOthers(false);
    }
  };

  const otherSessionsCount = sessions.filter(s => !s.is_current).length;

  return (
    <div className="space-y-6 text-left">
      {/* Change password */}
      <form onSubmit={handlePasswordSubmit} className="bg-v-dark/20 border border-v-dark-border p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-primary" size={20} />
          <h4 className="font-bold text-base text-v-white">Cambiar Contraseña</h4>
        </div>
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
            label="Confirmar Nueva Contraseña"
            type="password"
            required
            value={passwordForm.confirm}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
          />
        </div>
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" disabled={isChangingPassword}>
            {isChangingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
          </Button>
        </div>
      </form>

      {/* 2FA block */}
      <div className="flex justify-between items-center bg-v-dark/20 p-5 border border-v-dark-border rounded-2xl">
        <div>
          <p className="font-bold text-v-white text-sm">Autenticación en Dos Pasos (2FA)</p>
          <p className="text-xs text-v-gray mt-0.5">Añada una capa de seguridad extra utilizando una aplicación de autenticación como Google Authenticator o Duo.</p>
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
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-base text-v-white">Sesiones Activas ({sessions.length})</h4>
            <p className="text-xs text-v-gray mt-0.5">Dispositivos y navegadores reales que han iniciado sesión recientemente en su cuenta VEXTOR.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchActiveSessions}
              disabled={isLoadingSessions}
              className="p-2 text-v-gray hover:text-v-white bg-v-dark/40 hover:bg-v-dark border border-v-dark-border rounded-xl transition-all cursor-pointer"
              title="Refrescar sesiones"
            >
              <RefreshCw size={15} className={cn(isLoadingSessions && "animate-spin text-primary")} />
            </button>
            {otherSessionsCount > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isRevokingOthers}
                className="text-xs text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300 font-semibold flex items-center gap-1.5"
                onClick={handleRevokeAllOthers}
              >
                <LogOut size={13} />
                {isRevokingOthers ? 'Cerrando...' : 'Cerrar las demás sesiones'}
              </Button>
            )}
          </div>
        </div>

        <div className="border border-v-dark-border rounded-2xl divide-y divide-v-dark-border bg-v-dark/10 overflow-hidden">
          {isLoadingSessions ? (
            <div className="p-8 text-center text-v-gray">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Cargando sesiones activas...
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-v-gray flex flex-col items-center justify-center gap-2">
              <AlertCircle size={24} className="text-v-gray" />
              <span>No se encontraron sesiones activas registradas.</span>
            </div>
          ) : (
            sessions.map((session) => {
              const isMobile = session.dispositivo?.toLowerCase().includes('mobile') || session.dispositivo?.toLowerCase().includes('ios') || session.dispositivo?.toLowerCase().includes('android');
              const IconComponent = isMobile ? Smartphone : Laptop;

              return (
                <div key={session.id_sesion} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm hover:bg-v-dark/30 transition-colors">
                  <div className="flex items-start gap-3.5">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5",
                      session.is_current
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-v-dark border-v-dark-border text-v-gray"
                    )}>
                      <IconComponent size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-v-white">{session.dispositivo || 'Navegador Web'}</span>
                        {session.is_current && (
                          <span className="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-md border border-emerald-500/30">
                            Sesión Actual
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-v-gray mt-1">
                        IP: <span className="font-mono text-v-white">{session.ip_origen || '127.0.0.1'}</span> • Última actividad: <strong className="text-v-white">{getRelativeTime(session.ultima_actividad)}</strong>
                      </p>
                      <p className="text-[11px] text-v-gray/80 mt-0.5">
                        Iniciada: {formatFriendlyDate(session.fecha_inicio)}
                      </p>
                    </div>
                  </div>

                  {!session.is_current && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={revokingId === session.id_sesion}
                      className="text-xs text-red-400 border-red-500/20 hover:bg-red-500/10 hover:text-red-300 h-8 font-semibold shrink-0 self-end sm:self-center"
                      onClick={() => handleRevokeSingle(session.id_sesion)}
                    >
                      {revokingId === session.id_sesion ? 'Revocando...' : 'Revocar'}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default SecuritySection;
