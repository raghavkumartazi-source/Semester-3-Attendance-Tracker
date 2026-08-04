'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthScreenProps {
  userEmail?: string;
  syncStatus: 'Synced' | 'Syncing' | 'Offline' | 'Error';
  lastSynced?: Date;
  onSignOut: () => void;
  onSyncNow: () => void;
}

export default function AuthScreen({ userEmail, syncStatus, lastSynced, onSignOut, onSyncNow }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for the login link!');
    }
    setLoading(false);
  };

  if (userEmail) {
    return (
      <div className="glass-surface rounded-[24px] p-6 space-y-5 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none" />
        
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[11px] font-bold text-white/50 tracking-widest uppercase">Cloud Sync</h3>
            <p className="text-white font-medium mt-1">{userEmail}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05]">
            <div className={`w-2 h-2 rounded-full ${
              syncStatus === 'Synced' ? 'bg-emerald-400' :
              syncStatus === 'Syncing' ? 'bg-amber-400 animate-pulse' :
              syncStatus === 'Error' ? 'bg-red-400' :
              'bg-white/20'
            }`} />
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">{syncStatus}</span>
          </div>
        </div>

        {lastSynced && (
          <p className="text-[10px] text-white/40">
            Last synced: {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}

        <div className="flex gap-3 pt-2">
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
            {syncStatus === 'Syncing' ? 'SYNCING...' : 'SYNC NOW'}
          </button>
          
          <button
            onClick={onSignOut}
            className="px-4 glass-control rounded-[14px] text-xs font-bold text-white/60 hover:text-white"
          >
            SIGN OUT
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-surface rounded-[24px] p-6 space-y-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full pointer-events-none" />
      
      <div>
        <h3 className="text-sm font-bold text-white drop-shadow-sm">Sign in to Sync</h3>
        <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
          Keep your attendance synchronized across all your devices securely via Supabase.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-3">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full glass-control rounded-[16px] px-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
          />
        </div>

        {error && <p className="text-[10px] text-red-400 font-medium px-1">{error}</p>}
        {message && <p className="text-[10px] text-emerald-400 font-medium px-1">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full glass-control-active rounded-[16px] py-3.5 text-xs font-bold text-white tracking-widest disabled:opacity-50"
        >
          {loading ? 'SENDING LINK...' : 'SEND MAGIC LINK'}
        </button>
      </form>
    </div>
  );
}
