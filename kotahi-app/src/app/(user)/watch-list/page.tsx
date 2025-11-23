"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useWatchHistory,
  useRecentWatched,
  useCompletedVideos,
  useWatchHistoryMutations,
} from "@/lib/hooks/api";
import { toast } from "sonner";
import type { WatchHistory, VideoData } from "@/lib/types";
import { Play, Trash2, Calendar } from "lucide-react";
import Link from "next/link";
import { useVideos } from "@/lib/hooks/api";

export default function WatchListPage() {
  const [filterType, setFilterType] = useState<string>("all");
  const [token] = useState(() => localStorage.getItem("token"));

  const {
    data: watchHistoryData,
    isLoading,
    error,
    refetch,
  } = useWatchHistory(token);
  const { data: recentWatchedData } = useRecentWatched(token, 10);
  const { data: completedVideosData } = useCompletedVideos(token);
  const { videos: videosData } = useVideos();
  const { deleteWatchHistory } = useWatchHistoryMutations();

  const watchHistory = watchHistoryData?.data || [];
  const recentWatched = recentWatchedData?.data || [];
  const completedVideos = completedVideosData?.data || [];
  const videos = videosData || [];

  // Create a map of video IDs to video data for quick lookup
  const videoMap = new Map<string, VideoData>();
  videos.forEach((video: VideoData) => {
    videoMap.set(video.id, video);
  });

  const handleDelete = async (videoId: string) => {
    if (
      !confirm(
        "Are you sure you want to remove this video from your watch history?"
      )
    ) {
      return;
    }

    try {
      await deleteWatchHistory(token || "", videoId);
      toast.success("Video removed from watch history!");
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to remove video");
    }
  };

  const getFilteredData = () => {
    switch (filterType) {
      case "recent":
        return recentWatched;
      case "completed":
        return completedVideos;
      case "in-progress":
        return watchHistory.filter(
          (item) => !item.completed && item.progress > 0
        );
      case "not-started":
        return watchHistory.filter((item) => item.progress === 0);
      default:
        return watchHistory;
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatProgress = (progress: number) => {
    return Math.round(progress * 100);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return "bg-green-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-primary";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Filter and Watch List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Watch History</CardTitle>
              <CardDescription>
                Manage your video viewing progress
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Videos</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="not-started">Not Started</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Failed to load watch history</p>
            </div>
          ) : getFilteredData().length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                {filterType === "all"
                  ? "No videos in your watch history. Start watching some videos to see them here!"
                  : `No ${filterType.replace("-", " ")} videos found.`}
              </p>
              <Button asChild className="mt-4">
                <Link href="/library">Browse Videos</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Video</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Last Watched</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredData().map((item: WatchHistory) => {
                  const video = videoMap.get(item.video_id);
                  if (!video) return null;

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-16 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <Link
                              href={`/watch/${item.video_id}`}
                              className="font-medium hover:text-primary transition-colors"
                            >
                              {video.title}
                            </Link>
                            {video.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                                {video.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getProgressColor(
                                item.progress
                              )}`}
                              style={{
                                width: `${formatProgress(item.progress)}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatProgress(item.progress)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDuration(item.duration)}</div>
                          <div className="text-gray-500">
                            {formatDuration(item.current_time)} /{" "}
                            {formatDuration(item.duration)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(item.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button asChild size="sm" variant="outline">
                            <Link
                              href={`/watch/${item.video_id}?t=${Math.round(
                                item.current_time
                              )}`}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              {item.completed ? "Rewatch" : "Continue"}
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(item.video_id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
