"use client";
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { ListVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  usePlaylists,
  useWatchHistory,
  useThrottledGeneralSearch,
} from "@/lib/hooks/api";
import { PlaylistRow } from "@/components/playlist/playlist_row";
import StreakBar from "@/components/user/streak_bar";
import SearchResults from "@/components/search/SearchResults";
import type { Playlist } from "@/lib/types";
import Link from "next/link";
import { usePlaylist } from "@/lib/hooks/api";
import { Skeleton } from "@/components/ui/skeleton";

function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [token, setToken] = useState<string | null>(null);

  // Get token and update when it changes
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);

    // Poll for token changes on mount (after login redirect)
    const interval = setInterval(() => {
      const newToken = localStorage.getItem("token");
      if (newToken !== token) {
        setToken(newToken);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [token]);

  const {
    playlists,
    isLoading: playlistsLoading,
    error: playlistsError,
  } = usePlaylists();
  const { data: watchHistoryData } = useWatchHistory(token || "");
  const {
    data: searchData,
    isLoading: searchLoading,
    error: searchError,
  } = useThrottledGeneralSearch(searchQuery);

  // Create a map of video IDs to watch history data for efficient lookup
  const watchHistoryMap = new Map();
  if (watchHistoryData?.data) {
    watchHistoryData.data.forEach((history) => {
      watchHistoryMap.set(history.video_id, history);
    });
  }

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col gap-6">
      <StreakBar />
      <div className="flex w-full justify-between">
        <div className="w-1/2 relative">
          <Input
            className="w-full"
            placeholder="Search titles or kupu (e.g, 'pakihi', 'hauora')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery.length >= 2 && searchLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
        <div className="flex gap-4">
          <Button variant="outline">
            <Link href="/watch-list" className="text-sm">
              History
            </Link>
            <ListVideo />
          </Button>
        </div>
      </div>

      {/* Search Results */}
      {searchQuery.length >= 2 && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-4">
            Search Results for &ldquo;{searchQuery}&rdquo;
          </h2>
          <SearchResults
            results={searchData?.results || []}
            isLoading={searchLoading}
            error={searchError}
          />
        </div>
      )}

      {/* Playlist Rows */}
      {!searchQuery && (
        <div className="space-y-8">
          {playlistsLoading ? (
            <div className="space-y-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-8 w-64" />
                  <div className="flex gap-4 overflow-hidden">
                    {[...Array(4)].map((_, j) => (
                      <Skeleton
                        key={j}
                        className="h-64 w-[280px] flex-shrink-0"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : playlistsError ? (
            <div className="text-center py-8">
              <p className="text-red-600">Failed to load playlists</p>
            </div>
          ) : playlists?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                No playlists available
              </p>
            </div>
          ) : (
            playlists?.map((playlist: Playlist) => (
              <PlaylistWithVideos
                key={playlist.id}
                playlist={playlist}
                watchHistoryMap={watchHistoryMap}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Component to load playlist videos
function PlaylistWithVideos({
  playlist,
  watchHistoryMap,
}: {
  playlist: Playlist;
  watchHistoryMap: Map<string, any>;
}) {
  const { data: playlistData, isLoading } = usePlaylist(playlist.id, {
    skip: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-[280px] flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!playlistData?.videos || playlistData.videos.length === 0) {
    return null;
  }

  return (
    <PlaylistRow
      title={playlist.name}
      videos={playlistData.videos}
      watchHistoryMap={watchHistoryMap}
      playlistId={playlist.id}
    />
  );
}

export default LibraryPage;
