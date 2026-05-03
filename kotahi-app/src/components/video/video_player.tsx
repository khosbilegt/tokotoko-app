"use client";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { VideoPlayerProps, VideoPlayerRef } from "./types";
import { environment } from "@/lib/config";
import {
  trackVideoPlay,
  trackVideoPause,
  trackVideoSeek,
  VideoProgressTracker,
} from "@/lib/analytics";

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  (
    {
      src,
      subtitleSrc,
      onTimeUpdate,
      onDurationChange,
      onVideoEnd,
      className = "",
      initialTime = 0,
      videoId,
    },
    ref,
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const trackElementRef = useRef<HTMLTrackElement | null>(null);
    const progressTracker = useRef<VideoProgressTracker | null>(null);
    const lastSeekTime = useRef<number>(0);
    const isPlaying = useRef<boolean>(false);

    // Handle dynamic subtitle loading
    useEffect(() => {
      const video = videoRef.current;
      if (!video || !subtitleSrc) return;

      // Remove existing track if it exists
      if (trackElementRef.current && video.contains(trackElementRef.current)) {
        video.removeChild(trackElementRef.current);
      }

      // Create new track element
      const track = document.createElement("track");
      track.kind = "subtitles";
      track.src = environment.apiBaseUrl + subtitleSrc;
      track.srclang = "en";
      track.label = "English";
      track.default = true;

      video.appendChild(track);
      trackElementRef.current = track;

      // Cleanup function
      return () => {
        if (
          trackElementRef.current &&
          video.contains(trackElementRef.current)
        ) {
          video.removeChild(trackElementRef.current);
        }
      };
    }, [subtitleSrc]);

    useImperativeHandle(ref, () => ({
      getCurrentTime: () => videoRef.current?.currentTime || 0,
      getDuration: () => videoRef.current?.duration || 0,
      seekTo: (time: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = time;
        }
      },
      play: () => videoRef.current?.play(),
      pause: () => videoRef.current?.pause(),
    }));

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      // Initialize progress tracker
      if (!progressTracker.current) {
        progressTracker.current = new VideoProgressTracker(videoId);
      }

      const handleTimeUpdate = () => {
        onTimeUpdate?.(video.currentTime);
        // Track video progress
        if (progressTracker.current) {
          progressTracker.current.updateProgress(video.currentTime);
        }
      };

      const handleLoadedMetadata = () => {
        onDurationChange?.(video.duration);
        // Set initial time if provided
        if (initialTime > 0 && video.currentTime === 0) {
          video.currentTime = initialTime;
        }
        // Set duration for progress tracker
        if (progressTracker.current) {
          progressTracker.current.setDuration(video.duration);
        }
      };

      const handleVideoEnd = () => {
        onVideoEnd?.();
      };

      const handlePlay = () => {
        isPlaying.current = true;
        trackVideoPlay(video.currentTime, video.playbackRate, videoId);
      };

      const handlePause = () => {
        isPlaying.current = false;
        trackVideoPause(video.currentTime, videoId);
      };

      const handleSeeked = () => {
        const currentTime = video.currentTime;
        if (Math.abs(currentTime - lastSeekTime.current) > 1) {
          trackVideoSeek(lastSeekTime.current, currentTime, videoId);
          lastSeekTime.current = currentTime;
        }
      };

      const handleSeeking = () => {
        lastSeekTime.current = video.currentTime;
      };

      video.addEventListener("timeupdate", handleTimeUpdate);
      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      video.addEventListener("ended", handleVideoEnd);
      video.addEventListener("play", handlePlay);
      video.addEventListener("pause", handlePause);
      video.addEventListener("seeked", handleSeeked);
      video.addEventListener("seeking", handleSeeking);

      return () => {
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video.removeEventListener("ended", handleVideoEnd);
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("pause", handlePause);
        video.removeEventListener("seeked", handleSeeked);
        video.removeEventListener("seeking", handleSeeking);
      };
    }, [onTimeUpdate, onDurationChange, onVideoEnd, initialTime, videoId]);

    return (
      <div className={`relative w-full max-w-4xl mx-auto ${className}`}>
        <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
          <video
            ref={videoRef}
            src={src}
            controls
            className="w-full h-auto aspect-video"
            preload="metadata"
          />
        </div>
      </div>
    );
  },
);

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;
