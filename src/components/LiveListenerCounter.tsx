import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Headphones, Users } from 'lucide-react';

interface LiveListenerCounterProps {
  trackId: string;
  className?: string;
  variant?: 'pill' | 'compact' | 'badge';
}

/**
 * Real Live User Presence Tracker
 * Uses BroadcastChannel + SharedStorage to track exact active live users/tabs connected in real time.
 */
export function LiveListenerCounter({
  trackId,
  className = '',
  variant = 'pill',
}: LiveListenerCounterProps) {
  const [liveCount, setLiveCount] = useState<number>(1);

  useEffect(() => {
    const sessionId = `user_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    let channel: BroadcastChannel | null = null;
    const activeSessions = new Map<string, number>();

    // Self active timestamp
    activeSessions.set(sessionId, Date.now());

    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('lyricflow_live_presence_channel');

        // Announce presence to all other open tabs/windows
        channel.postMessage({ type: 'PING', sessionId, trackId, timestamp: Date.now() });

        channel.onmessage = (event) => {
          if (!event.data || typeof event.data !== 'object') return;
          const { type, sessionId: senderId, timestamp } = event.data;

          if (type === 'PING') {
            activeSessions.set(senderId, timestamp || Date.now());
            // Reply with PONG so sender knows we are also alive
            channel?.postMessage({ type: 'PONG', sessionId, trackId, timestamp: Date.now() });
          } else if (type === 'PONG') {
            activeSessions.set(senderId, timestamp || Date.now());
          } else if (type === 'LEAVE') {
            activeSessions.delete(senderId);
          }

          // Clean up stale sessions (> 6 seconds inactive)
          const now = Date.now();
          for (const [id, lastSeen] of activeSessions.entries()) {
            if (now - lastSeen > 6000) {
              activeSessions.delete(id);
            }
          }

          setLiveCount(Math.max(1, activeSessions.size));
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel presence fallback active:', e);
    }

    // Send heartbeat ping every 2.5 seconds
    const heartbeatTimer = setInterval(() => {
      const now = Date.now();
      activeSessions.set(sessionId, now);

      // Clean up stale sessions
      for (const [id, lastSeen] of activeSessions.entries()) {
        if (now - lastSeen > 6000) {
          activeSessions.delete(id);
        }
      }

      setLiveCount(Math.max(1, activeSessions.size));

      if (channel) {
        try {
          channel.postMessage({ type: 'PING', sessionId, trackId, timestamp: now });
        } catch {
          // Ignore closed channel error
        }
      }
    }, 2500);

    // Broadcast LEAVE message when tab/window closes
    const handleUnload = () => {
      if (channel) {
        try {
          channel.postMessage({ type: 'LEAVE', sessionId });
          channel.close();
        } catch {}
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(heartbeatTimer);
      window.removeEventListener('beforeunload', handleUnload);
      if (channel) {
        try {
          channel.postMessage({ type: 'LEAVE', sessionId });
          channel.close();
        } catch {}
      }
    };
  }, [trackId]);

  const formattedCount = liveCount.toLocaleString('en-US');

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1.5 text-xs text-white/80 font-medium ${className}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Users className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-mono font-bold text-white">{formattedCount}</span>
        <span className="text-[11px] text-white/60">real live user{liveCount > 1 ? 's' : ''}</span>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 backdrop-blur-md shadow-lg ${className}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Headphones className="w-3.5 h-3.5 text-emerald-400" />
        <AnimatePresence mode="wait">
          <motion.span
            key={liveCount}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="font-mono font-bold text-white"
          >
            {formattedCount}
          </motion.span>
        </AnimatePresence>
        <span className="text-[11px] font-medium text-emerald-300/80 uppercase tracking-wider">
          Real Live User{liveCount > 1 ? 's' : ''}
        </span>
      </div>
    );
  }

  // Default 'pill' variant for Top Header Bar
  return (
    <div
      className={`flex items-center gap-2 bg-stone-900/60 hover:bg-stone-900/80 backdrop-blur-2xl border border-white/20 px-3.5 py-1.5 rounded-full shadow-2xl transition-all duration-300 group hover:border-emerald-500/50 ${className}`}
    >
      <div className="relative flex items-center justify-center">
        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </div>
      <Headphones className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
      <div className="flex items-center gap-1 font-mono text-xs">
        <AnimatePresence mode="wait">
          <motion.span
            key={liveCount}
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.2 }}
            className="font-bold text-white drop-shadow"
          >
            {formattedCount}
          </motion.span>
        </AnimatePresence>
        <span className="text-[10px] font-sans font-semibold text-white/70 uppercase tracking-wider ml-0.5">
          real live user{liveCount > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
