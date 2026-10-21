import { useRef, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { Eye, Radio } from 'lucide-react';

interface PlayerSectionProps {
  videoId: string;
  audioUrl?: string | null;
  onTimeUpdate: (time: number) => void;
  seekTo?: number | null;
}

export default function PlayerSection({ videoId, audioUrl, onTimeUpdate, seekTo }: PlayerSectionProps) {
  const playerRef = useRef<ReactPlayer>(null);
  const rafRef = useRef<number>(0);
  const isPlayingRef = useRef(false);

  const tick = useCallback(() => {
    if (playerRef.current && isPlayingRef.current) {
      const time = playerRef.current.getCurrentTime();
      if (time !== undefined && time !== null) {
        onTimeUpdate(time);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [onTimeUpdate]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  useEffect(() => {
    if (seekTo !== null && seekTo !== undefined && playerRef.current) {
      playerRef.current.seekTo(seekTo, 'seconds');
      onTimeUpdate(seekTo);
    }
  }, [seekTo, onTimeUpdate]);

  const mediaSource =
    audioUrl || (videoId && videoId !== 'local-file' ? `https://www.youtube.com/watch?v=${videoId}` : undefined);

  return (
    <div className="bracket-container relative bg-[#000000] border border-[#2a333a] aspect-video flex items-center justify-center overflow-hidden">
      <div className="bracket-tl" />
      <div className="bracket-tr" />
      <div className="bracket-bl" />
      <div className="bracket-br" />

      {/* Top viewport tag */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 bg-[#08090a]/80 border border-[#2a333a] text-[10px] font-mono text-[#86949e]">
        <Eye className="w-3 h-3 text-[#d4a35f]" />
        <span>OPTICAL PORT // SYNCED</span>
      </div>

      {mediaSource ? (
        <ReactPlayer
          ref={playerRef}
          url={mediaSource}
          width="100%"
          height="100%"
          controls
          playing
          onPlay={() => (isPlayingRef.current = true)}
          onPause={() => (isPlayingRef.current = false)}
          onEnded={() => (isPlayingRef.current = false)}
          onProgress={(state) => {
            if (isPlayingRef.current) {
              onTimeUpdate(state.playedSeconds);
            }
          }}
          config={{
            youtube: {
              playerVars: {
                modestbranding: 1,
                rel: 0,
              },
            },
            file: {
              forceAudio: true,
            },
          }}
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-[#4a5761] font-mono text-xs">
          <Radio className="w-6 h-6 stroke-[1.5]" />
          <span>NO INCOMING SIGNAL FEED</span>
        </div>
      )}
    </div>
  );
}
