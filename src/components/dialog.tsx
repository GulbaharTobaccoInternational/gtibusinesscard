'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function AppDialog({ children, titleId, onClose, className = '' }: {
  children: ReactNode; titleId: string; onClose: () => void; className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    closeButtonRef.current?.focus();
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; if(previousFocus?.isConnected)previousFocus.focus(); };
  }, []);
  return <dialog ref={dialogRef} className={`app-dialog ${className}`} aria-labelledby={titleId}
    onKeyDown={event => {
      if(event.key!=='Tab')return;
      const items=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),[tabindex="0"]')).filter(element=>element.getClientRects().length>0);
      const first=items[0],last=items[items.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="dialog-content">
      <button ref={closeButtonRef} type="button" className="icon-button dialog-close" aria-label="Close dialog" onClick={onClose}><X size={19}/></button>
      {children}
    </div>
  </dialog>;
}
