import { createContext, useCallback, useContext, useRef, useState } from 'react';

const NoticeCtx = createContext(null);
let seq = 0;

/**
 * Sistema propio de avisos Naty (reutilizable en toda la app).
 * - toast(msg, type): aviso que se desvanece solo ('ok' | 'error' | 'info').
 * - alertDialog(msg, opts): modal con un botón Aceptar. Devuelve promesa.
 * - confirmDialog(msg, opts): modal Aceptar/Cancelar. Resuelve true/false.
 * Estética calma: mismos tokens, sin alerts nativos del navegador.
 */
export function NoticeProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const timers = useRef({});

  const pushToast = useCallback((message, type = 'ok', ms) => {
    const id = ++seq;
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
    timers.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete timers.current[id];
    }, ms ?? (type === 'error' ? 4200 : 3000));
  }, []);

  const closeToast = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const alertDialog = useCallback((message, { title = 'Aviso 🌿', okLabel = 'Entendido' } = {}) => {
    return new Promise((resolve) => {
      setDialog({ message, title, okLabel, mode: 'alert', resolve });
    });
  }, []);

  const confirmDialog = useCallback((message, { title = '¿Confirmas? 🍃', okLabel = 'Sí, continuar', cancelLabel = 'Cancelar', danger = false } = {}) => {
    return new Promise((resolve) => {
      setDialog({ message, title, okLabel, cancelLabel, danger, mode: 'confirm', resolve });
    });
  }, []);

  const settle = useCallback((value) => {
    setDialog((d) => {
      if (d) setTimeout(() => d.resolve(value), 0);
      return null;
    });
  }, []);

  return (
    <NoticeCtx.Provider value={{ toast: pushToast, alertDialog, confirmDialog }}>
      {children}
      <div className="naty-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`naty-toast ${t.type}`}>
            <span>{t.message}</span>
            <button onClick={() => closeToast(t.id)} aria-label="Cerrar aviso">✕</button>
          </div>
        ))}
      </div>
      {dialog && (
        <div className="modal-overlay" onClick={() => settle(dialog.mode === 'confirm' ? false : true)}>
          <div className="modal-dialog notice-dialog" role="alertdialog" aria-modal="true" aria-label={dialog.title} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><strong>{dialog.title}</strong></div>
            <div className="modal-body">
              <p className="notice-text">{dialog.message}</p>
              <div className="notice-actions">
                {dialog.mode === 'confirm' && (
                  <button className="btn btn-ghost" onClick={() => settle(false)}>{dialog.cancelLabel}</button>
                )}
                <button className={`btn ${dialog.danger ? 'btn-danger' : 'btn-verde'}`} onClick={() => settle(true)} autoFocus>{dialog.okLabel}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </NoticeCtx.Provider>
  );
}

export const useNotice = () => {
  const ctx = useContext(NoticeCtx);
  if (!ctx) throw new Error('useNotice debe usarse dentro de <NoticeProvider>');
  return ctx;
};
