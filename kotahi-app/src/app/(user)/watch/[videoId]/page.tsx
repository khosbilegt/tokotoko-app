"use client";
import VideoPlayer from "@/components/video/video_player";
import {
  useVideo,
  useVocabularies,
  useWatchHistoryByVideo,
  useWatchHistoryMutations,
} from "@/lib/hooks/api";
import { useParams, useSearchParams } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import type { TranscriptItem } from "@/lib/types";
import { loadVTTTranscript } from "@/lib/vtt-parser";
import VideoTranscription from "@/components/video/video_transcription";
import type { VideoPlayerRef } from "@/components/video/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { trackVideoPageView } from "@/lib/custom-pageview-tracker";
import { useLearningAnalytics } from "@/lib/analytics-hook";

function WatchPage() {
  const { videoId } = useParams();
  const searchParams = useSearchParams();
  const { data: video } = useVideo(videoId as string);
  const { vocabularies } = useVocabularies();
  const [currentTime, setCurrentTime] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [token] = useState(() => localStorage.getItem("token"));
  const [isInWatchList, setIsInWatchList] = useState(false);
  const [currentTranscriptIndex, setCurrentTranscriptIndex] = useState(-1);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [initialTime, setInitialTime] = useState(0);
  const videoPlayerRef = useRef<VideoPlayerRef>(null);

  const { data: watchHistoryData } = useWatchHistoryByVideo(
    token,
    videoId as string,
  );
  const { createOrUpdate } = useWatchHistoryMutations();
  const { trackVideoStart, trackVideoComplete } = useLearningAnalytics();

  // Track video page view
  useEffect(() => {
    if (video) {
      trackVideoPageView(video.id, video.title);
      trackVideoStart(video.id, video.title);
    }
  }, [video, trackVideoStart]);

  useEffect(() => {
    if (watchHistoryData?.data) {
      setIsInWatchList(true);
    } else {
      setIsInWatchList(false);
    }
  }, [watchHistoryData]);

  useEffect(() => {
    const loadTranscript = async () => {
      if (!video?.subtitle) {
        setTranscript([]);
        return;
      }

      setIsLoadingTranscript(true);
      try {
        const transcriptData = await loadVTTTranscript(
          video.subtitle,
          // process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
          process.env.NEXT_PUBLIC_API_BASE_URL || "https://tokotoko.app",
        );
        setTranscript(transcriptData);
      } catch (error) {
        console.error("Failed to load transcript:", error);
        setTranscript([]);
      } finally {
        setIsLoadingTranscript(false);
      }
    };

    loadTranscript();
  }, [video?.subtitle]);

  // Reset transcript index when video changes
  useEffect(() => {
    setCurrentTranscriptIndex(-1);
    setLastUpdateTime(0);
  }, [videoId]);

  // Read initial time from query parameter
  useEffect(() => {
    const timeParam = searchParams.get("t");
    if (timeParam) {
      const time = parseFloat(timeParam);
      if (!isNaN(time) && time >= 0) {
        setInitialTime(time);
        setCurrentTime(time);
        // Also seek the video player if it's already loaded
        if (videoPlayerRef.current) {
          videoPlayerRef.current.seekTo(time);
        }
      }
    }
  }, [searchParams]);

  // Helper function to find the current transcript index based on time
  const findCurrentTranscriptIndex = (time: number): number => {
    for (let i = 0; i < transcript.length; i++) {
      const item = transcript[i];
      if (time >= item.startTime && time <= item.endTime) {
        return i;
      }
    }
    return -1;
  };

  // Helper function to update watch history
  const updateWatchHistory = async (time: number, duration: number) => {
    if (!token || !videoId) return;

    try {
      const progress = duration > 0 ? time / duration : 0;
      const completed = progress >= 0.95; // Consider 95% as completed

      await createOrUpdate(token, {
        video_id: videoId as string,
        progress: progress,
        current_time: time,
        duration: duration,
        completed: completed,
      });

      // Track video completion in analytics
      if (completed && video) {
        trackVideoComplete(video.id, video.title, duration);
      }

      // Update the watch list status if this is the first time adding to watch history
      if (!isInWatchList) {
        setIsInWatchList(true);
      }
    } catch (error) {
      console.error("Failed to update watch history:", error);
      // Don&apos;t show toast errors for automatic updates to avoid spam
    }
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);

    // Only update watch history if we have transcript data and token
    if (transcript.length > 0 && token && videoId) {
      const newTranscriptIndex = findCurrentTranscriptIndex(time);

      // Update watch history when transcript segment changes
      if (
        newTranscriptIndex !== currentTranscriptIndex &&
        newTranscriptIndex !== -1
      ) {
        setCurrentTranscriptIndex(newTranscriptIndex);

        // Throttle updates to avoid too many API calls (update every 5 seconds max)
        if (time - lastUpdateTime >= 5 && videoDuration > 0) {
          updateWatchHistory(time, videoDuration);
          setLastUpdateTime(time);
        }
      }
    }
  };

  const handleSeek = (time: number) => {
    videoPlayerRef.current?.seekTo(time);
  };

  const handleDurationChange = (duration: number) => {
    setVideoDuration(duration);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/library">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold">{video?.title}</h1>
          </div>
        </div>
        <p className="text-muted-foreground">{video?.description}</p>

        {/* Resume indicator */}
        {initialTime > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              📍 Resuming from {Math.floor(initialTime / 60)}:
              {(initialTime % 60).toFixed(0).padStart(2, "0")}
            </p>
          </div>
        )}

        {/* Current transcript segment indicator */}
        {transcript.length > 0 && currentTranscriptIndex >= 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
              Current Segment ({currentTranscriptIndex + 1} of{" "}
              {transcript.length})
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {transcript[currentTranscriptIndex]?.text}
            </p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 lg:flex-[2]">
            <VideoPlayer
              ref={videoPlayerRef}
              src={video?.video}
              subtitleSrc={video?.subtitle}
              onTimeUpdate={handleTimeUpdate}
              onDurationChange={handleDurationChange}
              transcript={transcript}
              currentTime={currentTime}
              initialTime={initialTime}
              videoId={videoId as string}
            />
          </div>

          <div className="flex-1 lg:flex-[1] lg:h-[500px]">
            <VideoTranscription
              isLoadingTranscript={isLoadingTranscript}
              transcript={transcript}
              currentTime={currentTime}
              onSeek={handleSeek}
              vocabularies={vocabularies || []}
              videoId={videoId as string}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default WatchPage;
