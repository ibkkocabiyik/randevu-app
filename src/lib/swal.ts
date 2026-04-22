import Swal from 'sweetalert2';

function getSwalTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  return {
    background: isDark ? '#1f2937' : '#ffffff',
    color: isDark ? '#f9fafb' : '#111827',
  };
}

export function useSwal() {
  return {
    confirm: async (opts: { title: string; text?: string; confirmText?: string }) => {
      const { background, color } = getSwalTheme();
      const result = await Swal.fire({
        title: opts.title,
        text: opts.text,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: opts.confirmText ?? 'Evet',
        cancelButtonText: 'İptal',
        confirmButtonColor: '#6366f1',
        cancelButtonColor: 'transparent',
        background,
        color,
        customClass: {
          cancelButton: '!text-gray-500 !shadow-none',
          popup: '!rounded-2xl !shadow-2xl',
        },
      });
      return result.isConfirmed;
    },

    toast: (opts: { icon: 'success' | 'error' | 'warning' | 'info'; title: string }) => {
      const { background, color } = getSwalTheme();
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: opts.icon,
        title: opts.title,
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        background,
        color,
        customClass: { popup: '!rounded-xl !shadow-xl' },
      });
    },

    error: (title: string, text?: string) => {
      const { background, color } = getSwalTheme();
      Swal.fire({
        title,
        text,
        icon: 'error',
        confirmButtonColor: '#6366f1',
        background,
        color,
        customClass: { popup: '!rounded-2xl' },
      });
    },
  };
}
