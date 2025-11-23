"use client";
import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import VideoCard from "@/components/video/video_card";
import type { VideoData, WatchHistory } from "@/lib/types";
import Link from "next/link";

interface PlaylistRowProps {
  title: string;
  videos: VideoData[];
  watchHistoryMap?: Map<string, WatchHistory>;
  playlistId: string;
}

export function PlaylistRow({
  title,
  videos,
  watchHistoryMap,
  playlistId,
}: PlaylistRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);

  // Check scroll position on mount and after videos load
  useEffect(() => {
    const checkScroll = () => {
      if (!scrollContainerRef.current) return;
      const container = scrollContainerRef.current;
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    };

    // Check after a short delay to ensure DOM is rendered
    const timer = setTimeout(() => {
      checkScroll();
    }, 100);

    return () => clearTimeout(timer);
  }, [videos.length]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    const targetScroll =
      direction === "left"
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = container;

    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Drag to scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;

    // Don't start dragging if clicking on a button, link, or other interactive element
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest("[role='button']")
    ) {
      return;
    }

    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    scrollContainerRef.current.style.cursor = "grabbing";
    scrollContainerRef.current.style.userSelect = "none";
  };

  const handleMouseLeave = () => {
    if (!scrollContainerRef.current) return;
    setIsDragging(false);
    scrollContainerRef.current.style.cursor = "grab";
    scrollContainerRef.current.style.userSelect = "auto";
  };

  const handleMouseUp = () => {
    if (!scrollContainerRef.current) return;
    setIsDragging(false);
    scrollContainerRef.current.style.cursor = "grab";
    scrollContainerRef.current.style.userSelect = "auto";

    // Reset hasDragged after a short delay to allow click events
    setTimeout(() => {
      setHasDragged(false);
    }, 100);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();

    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;

    // Track if we've actually dragged (moved more than 5px)
    if (Math.abs(walk) > 5) {
      setHasDragged(true);
    }
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;

    const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  if (videos.length === 0) {
    return null;
  }

  return (
    <div className="relative group">
      {/* Header with title and navigation */}
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          {/* Navigation arrows */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => scroll("left")}
              disabled={!showLeftArrow}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => scroll("right")}
              disabled={!showRightArrow}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {/* View all button */}
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/playlist/${playlistId}`}>View all →</Link>
          </Button>
        </div>
      </div>

      {/* Scrollable container */}
      <div className="relative">
        {/* Left gradient overlay */}
        {showLeftArrow && (
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
        )}

        {/* Right gradient overlay */}
        {showRightArrow && (
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
        )}

        {/* Scrollable content */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex gap-4 overflow-x-auto px-4 pb-4 cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ userSelect: isDragging ? "none" : "auto" }}
        >
          {videos.map((video) => (
            <div key={video.id} className="flex-shrink-0 w-[280px]">
              <VideoCard
                video={video}
                watchHistory={watchHistoryMap?.get(video.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
