import React, { useState } from 'react';
import { Track } from '../types';
import { X, Search, Play, Volume2, Music } from 'lucide-react';
import { getUniqueFallbackCover } from '../utils/artworkResolver';

interface SongListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  currentTrackIndex: number;
  isPlaying: boolean;
  onSelectTrack: (index: number) => void;
}

export const SongListDrawer: React.FC<SongListDrawerProps> = ({
  isOpen,
  onClose,
  tracks,
  currentTrackIndex,
  isPlaying,
  onSelectTrack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredTracks = tracks.map((track, originalIndex) => ({ track, originalIndex })).filter(({ track }) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      track.title.toLowerCase().includes(q) ||
      track.artist.toLowerCase().includes(q) ||
      (track.featuredArtist && track.featuredArtist.toLowerCase().includes(q)) ||
      track.album.toLowerCase().includes(q)
    );
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xl transition-all duration-300">
      <div
        className="w-full max-w-2xl max-h-[85vh] bg-stone-950/90 border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-stone-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-lg">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Music Library</h2>
              <p className="text-xs text-white/50">{tracks.length} songs available with original cover art</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center text-white/80 hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-stone-900/20 border-b border-white/5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search by title, artist, or album..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-900/80 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-amber-500/50 transition"
            />
          </div>
        </div>

        {/* Song List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {filteredTracks.length === 0 ? (
            <div className="text-center py-12 text-white/40 text-sm">
              No songs matched your search query "{searchQuery}"
            </div>
          ) : (
            filteredTracks.map(({ track, originalIndex }) => {
              const isActive = originalIndex === currentTrackIndex;

              return (
                <button
                  key={track.id}
                  onClick={() => {
                    onSelectTrack(originalIndex);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3.5 p-2.5 rounded-2xl transition text-left group ${
                    isActive
                      ? 'bg-white/15 border border-amber-500/40 shadow-md'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {/* Track Number / Play Indicator */}
                  <span className="w-6 text-center text-xs font-semibold text-white/40 group-hover:text-white/80">
                    {isActive ? (
                      isPlaying ? (
                        <Volume2 className="w-4 h-4 text-amber-400 animate-pulse mx-auto" />
                      ) : (
                        <Play className="w-4 h-4 text-amber-400 fill-amber-400 mx-auto" />
                      )
                    ) : (
                      originalIndex + 1
                    )}
                  </span>

                  {/* Artwork Image */}
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-stone-800 flex-shrink-0 shadow-md border border-white/10">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover transition transform group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = getUniqueFallbackCover(track);
                      }}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-sm font-semibold truncate ${
                        isActive ? 'text-amber-400 font-bold' : 'text-white group-hover:text-amber-200'
                      }`}
                    >
                      {track.title}
                      {track.version && (
                        <span className="ml-1.5 text-[10px] font-normal px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                          {track.version}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-white/60 truncate mt-0.5">
                      {track.artist}
                      {track.featuredArtist && (
                        <span className="text-white/40"> ft. {track.featuredArtist}</span>
                      )}
                    </p>
                  </div>

                  {/* Album Badge */}
                  <div className="hidden sm:block text-right pr-2">
                    <span className="text-xs text-white/40 truncate max-w-[120px] block">
                      {track.album}
                    </span>
                  </div>

                  {/* Duration */}
                  <div className="text-xs font-mono text-white/40 pl-2">
                    {formatDuration(track.duration)}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/10 bg-stone-900/40 text-center text-xs text-white/40">
          Click any song to play instantly in 3D Cover Flow
        </div>
      </div>
    </div>
  );
};
