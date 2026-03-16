import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import YouTube from 'youtube-video-element/react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';

interface LessonPlayerProps {
  lessonId: string;
  videoUrl: string;
  title: string;
  initialProgress?: number;
}

export function LessonPlayer({ lessonId, videoUrl, title, initialProgress = 0 }: LessonPlayerProps) {
  const { user } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);
  const playerRef = useRef<any>(null);

  // Standardize YouTube URLs
  const cleanUrl = (videoUrl || '').trim();
  let finalUrl = cleanUrl;
  
  const isYouTube = cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be');
  
  if (cleanUrl.includes('youtube.com/embed/')) {
    const videoId = cleanUrl.split('embed/')[1]?.split('?')[0];
    if (videoId) finalUrl = `https://www.youtube.com/watch?v=${videoId}`;
  }

  const handleProgress = (state: { playedSeconds: number }) => {
    setPlayedSeconds(state.playedSeconds);
    
    if (!user || !lessonId) return;

    // Heartbeat/Progress sync every ~15 seconds
    if (Math.floor(state.playedSeconds) % 15 === 0 && Math.floor(state.playedSeconds) !== 0) {
      supabase.from('user_progress').upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          last_watched_timestamp: Math.floor(state.playedSeconds),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lesson_id' }
      ).then(({ error }) => {
        if (error) console.error('Failed to sync progress:', error);
      });
    }

    // Completion check
    if (duration > 0 && !isCompleted) {
      const percentComplete = state.playedSeconds / duration;
      if (percentComplete >= 0.90) {
        setIsCompleted(true);
        supabase.from('user_progress').upsert(
          {
            user_id: user.id,
            lesson_id: lessonId,
            is_completed: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,lesson_id' }
        ).then(({ error }) => {
          if (error) console.error('Failed to mark as completed:', error);
        });
      }
    }
  };

  const handleError = (e: any) => {
    console.error('Video Player Error:', e);
    setHasError(true);
  };

  // Reset error state when URL changes
  useEffect(() => {
    setHasError(false);
    console.log('LessonPlayer loading URL:', finalUrl, 'isYouTube:', isYouTube);
  }, [finalUrl]);

  // Handle potential CJS/ESM default export issues
  const Player: any = (ReactPlayer as any).default || ReactPlayer;

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4 px-4 sm:px-0">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      </div>
      
      <div className="w-full bg-black relative aspect-video rounded-xl overflow-hidden shadow-2xl">
        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 p-6 text-center">
            <p className="mb-2 font-bold">Failed to load video</p>
            <p className="text-sm mb-4">Please check the URL: {finalUrl}</p>
            <button 
              onClick={() => setHasError(false)}
              className="px-6 py-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-all font-bold"
            >
              Retry
            </button>
          </div>
        ) : (
          isYouTube ? (
            <YouTube
              src={finalUrl}
              style={{ width: '100%', height: '100%' }}
              controls
              onTimeUpdate={(e: any) => handleProgress({ playedSeconds: e.target.currentTime })}
              onLoadedMetadata={(e: any) => setDuration(e.target.duration)}
              onError={handleError}
            />
          ) : (
            <Player
              key={finalUrl}
              ref={playerRef}
              url={finalUrl}
              width="100%"
              height="100%"
              controls
              playsinline
              onProgress={handleProgress}
              onReady={() => setDuration(playerRef.current?.getDuration() || 0)}
              onError={handleError}
              config={{
                file: {
                  forceHLS: finalUrl.includes('.m3u8')
                }
              }}
            />
          )
        )}
      </div>
    </div>
  );
}
