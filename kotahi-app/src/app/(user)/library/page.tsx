"use client";
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Library,
  BookOpen,
  List,
  Settings,
  Medal,
  GraduationCap,
  Zap,
} from "lucide-react";
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
import { useUser } from "@/lib/user-context";
import { cn } from "@/lib/utils";

function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const { user } = useUser();

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

  const menuItems = [
    { href: "/library", icon: Library, label: "Library" },
    { href: "/progress", icon: Medal, label: "Progress" },
    { href: "/watch-list", icon: List, label: "History" },
    { href: "/word-list", icon: BookOpen, label: "Word List" },
    { href: "/method", icon: GraduationCap, label: "Method" },
    { href: "/practice", icon: Zap, label: "Practice" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <StreakBar />
      <div className="flex flex-col lg:flex-row gap-6 mt-6">
        {/* Left Sidebar - Search and Menu */}
        <div className="lg:w-64 lg:flex-shrink-0 space-y-4">
          {/* Search Bar */}
          <div className="relative">
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

          {/* Menu Items */}
          <div className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = false; // You can add pathname check here if needed
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2",
                      isActive && "bg-secondary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            {user?.role === "admin" && (
              <Link href="/admin">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Settings className="h-4 w-4" />
                  Admin Panel
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
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

          {/* Search Results */}
          {searchQuery.length >= 2 && (
            <div className="mb-6">
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
      </div>
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
