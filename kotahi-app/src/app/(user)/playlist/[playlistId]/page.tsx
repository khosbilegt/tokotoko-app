"use client";
import React, { useEffect, useState } from "react";
import { usePlaylist, useWatchHistory } from "@/lib/hooks/api";
import VideoCard from "@/components/video/video_card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PlaylistDetailPage({
  params,
}: {
  params: { playlistId: string };
}) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const {
    data: playlistData,
    isLoading,
    error,
  } = usePlaylist(params.playlistId);
  const { data: watchHistoryData } = useWatchHistory(token || "");

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  // Create a map of video IDs to watch history data for efficient lookup
  const watchHistoryMap = new Map();
  if (watchHistoryData?.data) {
    watchHistoryData.data.forEach((history) => {
      watchHistoryMap.set(history.video_id, history);
    });
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !playlistData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Unable to load playlist. Please try again later.
            </p>
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{playlistData.name}</h1>
            {playlistData.description && (
              <p className="text-muted-foreground mt-2">
                {playlistData.description}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {playlistData.videos?.length || 0} videos
            </p>
          </div>
        </div>
      </div>

      {/* Videos Grid */}
      {playlistData.videos?.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              This playlist is empty.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {playlistData.videos?.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              watchHistory={watchHistoryMap.get(video.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
