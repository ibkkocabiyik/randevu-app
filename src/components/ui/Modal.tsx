import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

// Inject modal animations once
if (typeof document !== 'undefined') {
  const ID = '__modal-kf';
  if (!document.getElementById(ID)) {
    const s = document.createElement('style');
    s.id = ID;
    s.textContent = `
      @keyframes __overlay-in { from{opacity:0} to{opacity:1} }
      @keyframes __modal-pop {
        0%   { opacity:0; transform:scale(0.88) }
        60%  { opacity:1; transform:scale(1.03) }
        80%  { transform:scale(0.98) }
        100% { opacity:1; transform:scale(1) }
      }
      @keyframes __sheet-up {
        0%   { opacity:0; transform:translateY(100%) }
        65%  { transform:translateY(-4px) }
        82%  { transform:translateY(2px) }
        100% { opacity:1; transform:translateY(0) }
      }
    `;
    document.head.appendChild(s);
  }
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width:767px)').matches;

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    const scrollW = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = `${scrollW}px`;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.paddingRight = '';
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
        style={{ animation: '__overlay-in 0.2s ease both' }}
        onClick={onClose}
      />

      {isMobile ? (
        /* Bottom sheet on mobile */
        <div
          ref={ref}
          className="fixed inset-x-0 bottom-0 z-[201] flex flex-col rounded-t-2xl bg-white shadow-2xl dark:bg-gray-800"
          style={{ maxHeight: '92dvh', animation: '__sheet-up 0.36s cubic-bezier(0.32,0.72,0,1) both' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 cursor-pointer justify-center py-4" onClick={onClose}>
            <div className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-600" />
          </div>
          {title && (
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 pb-3 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
              <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                <X size={18} />
              </button>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        </div>
      ) : (
        /* Center modal on desktop */
        <div
          className="fixed inset-0 z-[201] flex items-center justify-center p-4"
          style={{ pointerEvents: 'none' }}
        >
          <div
            ref={ref}
            className={cn(
              'relative w-full rounded-2xl bg-white shadow-2xl dark:bg-gray-800',
              sizeMap[size]
            )}
            style={{
              pointerEvents: 'auto',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              animation: '__modal-pop 0.3s cubic-bezier(0.34,1.4,0.64,1) both',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {title ? (
              <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <button
                onClick={onClose}
                aria-label="Kapat"
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <X size={18} />
              </button>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5">{children}</div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
