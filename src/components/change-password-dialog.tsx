'use client';

import { useState, type FormEvent } from 'react';
import { changePasswordSchema, PASSWORD_MIN_LENGTH } from '@/lib/password-auth';
import { AppDialog } from './dialog';
import { PasswordInput } from './password-input';

export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const parsed = changePasswordSchema.safeParse({ currentPassword, password, confirmPassword });
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    setError('');
    setBusy(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data), cache: 'no-store',
      });
      if (!response.ok) {
        const result = await response.json();
        setError(result.error || 'Your password could not be updated.');
        setBusy(false);
        return;
      }
      window.location.replace('/login?password=updated');
    } catch {
      setError('Unable to reach the application. Please try again.');
      setBusy(false);
    }
  }

  return <AppDialog titleId="change-password-title" className="change-password-dialog" onClose={() => { if (!busy) onClose(); }}>
    <h2 id="change-password-title">Change password</h2>
    <form onSubmit={submit} onChange={() => setError('')} aria-busy={busy}>
      <PasswordInput id="change-current" label="Current password" value={currentPassword} onChange={setCurrent} disabled={busy} />
      <PasswordInput id="change-new" label="New password" autoComplete="new-password" value={password} onChange={setPassword} disabled={busy} describedBy="change-password-hint" />
      <p className="field-hint password-requirements" id="change-password-hint">Use at least {PASSWORD_MIN_LENGTH} characters. You’ll sign in again after updating.</p>
      <PasswordInput id="change-confirm" label="Confirm new password" autoComplete="new-password" value={confirmPassword} onChange={setConfirm} disabled={busy} />
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="change-password-actions">
        <button className="text-button" type="button" disabled={busy} onClick={onClose}>Cancel</button>
        <button className="button print-button" type="submit" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button>
      </div>
    </form>
  </AppDialog>;
}
