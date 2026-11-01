'use client';

import { useId, useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface AuthScreenProps {
  userEmail?: string;
  syncStatus: 'Synced' | 'Syncing' | 'Offline' | 'Error';
  syncError?: string;
  lastSynced?: Date;
  onSignOut: () => void;
  onSyncNow: () => void;
}

export default function AuthScreen({ userEmail, syncStatus, syncError, lastSynced, onSignOut, onSyncNow }: AuthScreenProps) {
  const formId = useId();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    // No need to set success message because the provider will pick up the user and update the UI
    setLoading(false);
  };

  const handleSignUp = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email to confirm your account!');
    }
    setLoading(false);
  };

  if (userEmail) {
    return (
      <div className="auth-card glass-surface rounded-[24px] p-6 space-y-5 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none" />
        
        <div className="auth-account-row flex items-start justify-between">
          <div>
            <h3 className="text-[11px] font-bold text-white/50 tracking-widest uppercase">Cloud Sync</h3>
            <p className="auth-email text-white font-medium mt-1">{userEmail}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05]">
              <div className={`w-2 h-2 rounded-full ${
                syncStatus === 'Synced' ? 'bg-emerald-400' :
                syncStatus === 'Syncing' ? 'bg-amber-400 animate-pulse' :
                syncStatus === 'Error' ? 'bg-red-400' :
                'bg-white/20'
              }`} />
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">{syncStatus}</span>
            </div>
            {syncStatus === 'Error' && syncError && (
              <span className="text-[9px] text-red-400 font-medium max-w-[120px] text-right truncate" title={syncError}>
                {syncError}
              </span>
            )}
          </div>
        </div>

        {lastSynced && (
          <p className="text-[10px] text-white/40">
            Last synced: {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}

        <div className="auth-actions flex gap-3 pt-2">
          <button
            onClick={onSyncNow}
            disabled={syncStatus === 'Syncing'}
            className="flex-1 glass-control-active rounded-[14px] py-3 text-xs font-bold text-white tracking-wide flex items-center justify-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={syncStatus === 'Syncing' ? 'animate-spin' : ''}>
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
            </svg>
            {syncStatus === 'Syncing' ? 'Syncing…' : 'Sync now'}
          </button>
          
          <button
            onClick={onSignOut}
            className="px-4 glass-control rounded-[14px] text-xs font-bold text-white/60 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-card glass-surface rounded-[24px] p-6 space-y-5 relative overflow-hidden">
      
      <div>
        <h3 className="auth-heading">Keep your semester in sync.</h3>
        <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
          Sign in to keep your attendance available across devices.
        </p>
      </div>

      <form onSubmit={handleSignIn} className="space-y-3">
        <div>
          <label htmlFor={`${formId}-email`} className="auth-label">Email</label>
          <input
            id={`${formId}-email`}
            type="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full glass-control rounded-[16px] px-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
          />
        </div>
        <div>
          <label htmlFor={`${formId}-password`} className="auth-label">Password</label>
          <div className="auth-password-field">
          <input
            id={`${formId}-password`}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            className="w-full glass-control rounded-[16px] pl-4 pr-14 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
          />
          <button type="button" className="auth-password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(previous => !previous)}>{showPassword ? <EyeSlashIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}</button>
          </div>
        </div>

        {error && <p role="alert" className="text-[10px] text-red-400 font-medium px-1">{error}</p>}
        {message && <p role="status" className="text-[10px] text-emerald-400 font-medium px-1">{message}</p>}

        <div className="auth-actions flex gap-3 pt-1">
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="flex-1 glass-control-active rounded-[16px] py-3 text-xs font-bold text-white tracking-widest disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          
          <button
            type="button"
            onClick={handleSignUp}
            disabled={loading || !email || !password}
            className="flex-1 glass-control rounded-[16px] py-3 text-xs font-bold text-white/60 hover:text-white disabled:opacity-50 transition-all"
          >
            Create account
          </button>
        </div>
      </form>
    </div>
  );
}
