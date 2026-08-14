import Swal from 'sweetalert2';

export const vextorSwal = Swal.mixin({
  background: 'var(--v-bg-soft)',
  color: 'var(--v-text)',
  buttonsStyling: false,
  customClass: {
    popup: 'bg-v-dark-soft border border-v-dark-border rounded-2xl p-6 shadow-2xl max-w-sm',
    title: 'text-xl font-bold text-v-white text-left',
    htmlContainer: 'text-sm text-v-gray mt-2 leading-relaxed text-left',
    actions: 'flex gap-3 justify-end mt-6 w-full',
    confirmButton: 'px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-emerald-600 rounded-xl transition-colors cursor-pointer focus:outline-none',
    cancelButton: 'px-4 py-2 text-sm font-semibold text-v-white bg-v-dark border border-v-dark-border hover:bg-v-dark-border rounded-xl transition-colors cursor-pointer focus:outline-none',
  }
});

export const showConfirm = async (title, text, confirmText = 'Aceptar', cancelText = 'Cancelar', isWarning = false) => {
  return vextorSwal.fire({
    title,
    text,
    icon: isWarning ? 'warning' : 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    customClass: {
      popup: 'bg-v-dark-soft border border-v-dark-border rounded-2xl p-6 shadow-2xl max-w-sm',
      title: 'text-xl font-bold text-v-white text-left',
      htmlContainer: 'text-sm text-v-gray mt-2 leading-relaxed text-left',
      actions: 'flex gap-3 justify-end mt-6 w-full',
      confirmButton: `px-4 py-2 text-sm font-semibold text-white ${isWarning ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-emerald-600'} rounded-xl transition-colors cursor-pointer focus:outline-none`,
      cancelButton: 'px-4 py-2 text-sm font-semibold text-v-white bg-v-dark border border-v-dark-border hover:bg-v-dark-border rounded-xl transition-colors cursor-pointer focus:outline-none',
    }
  });
};
