"use client";
import React, { useMemo } from "react";
import { useGetUserProgressQuery } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  TrendingUp,
  Clock,
  Trophy,
  Film,
  CheckCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function ProgressPage() {
  const { data, isLoading, error } = useGetUserProgressQuery();

  const progressData = useMemo(() => {
    if (!data?.data) return null;

    const stats = data.data;
    return {
      totalMinutes: Math.round(stats.total_minutes),
      last7DaysMinutes: Math.round(stats.last_7_days_minutes),
      currentStreak: stats.current_streak,
      longestStreak: stats.longest_streak,
      totalVideosWatched: stats.total_videos_watched,
      completedVideos: stats.completed_videos,
      // Calculate completion rate
      completionRate:
        stats.total_videos_watched > 0
          ? Math.round(
              (stats.completed_videos / stats.total_videos_watched) * 100
            )
          : 0,
      // Average minutes per video (simplified)
      averageMinutesPerVideo:
        stats.total_videos_watched > 0
          ? Math.round(stats.total_minutes / stats.total_videos_watched)
          : 0,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !progressData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Unable to load progress data. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">My Progress</h1>
          <p className="text-muted-foreground">
            Track your learning journey and achievements
          </p>
        </div>

        {/* Streak Card */}
        <Card className="bg-gradient-to-r from-amber-100/80 to-orange-100/80 dark:from-yellow-900/20 dark:to-orange-900/20 border-amber-300 dark:border-yellow-800 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-700 dark:text-yellow-400" />
              <CardTitle className="text-amber-900 dark:text-yellow-100">
                Current Streak
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-amber-700 dark:text-yellow-400">
                {progressData.currentStreak}
              </span>
              <span className="text-amber-800 dark:text-muted-foreground">
                days
              </span>
            </div>
            {progressData.currentStreak > 0 && (
              <p className="text-sm text-amber-800 dark:text-muted-foreground mt-2">
                Keep it up! You&apos;re on fire 🔥
              </p>
            )}
            {progressData.currentStreak === 0 && (
              <p className="text-sm text-amber-800 dark:text-muted-foreground mt-2">
                Start your streak today!
              </p>
            )}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1 text-amber-900 dark:text-foreground">
                <span>Longest streak</span>
                <span className="font-semibold">
                  {progressData.longestStreak} days
                </span>
              </div>
              {progressData.longestStreak > 0 && (
                <Progress
                  value={
                    (progressData.currentStreak / progressData.longestStreak) *
                    100
                  }
                  className="h-2"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Total Minutes Watched */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Minutes
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {progressData.totalMinutes}
              </div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          {/* Last 7 Days */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {progressData.last7DaysMinutes}
              </div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>

          {/* Total Videos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Videos Watched
              </CardTitle>
              <Film className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {progressData.totalVideosWatched}
              </div>
              <p className="text-xs text-muted-foreground">Unique videos</p>
            </CardContent>
          </Card>

          {/* Completed Videos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {progressData.completedVideos}
              </div>
              <p className="text-xs text-muted-foreground">
                {progressData.completionRate}% completion rate
              </p>
            </CardContent>
          </Card>

          {/* Average per Video */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. per Video
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {progressData.averageMinutesPerVideo}
              </div>
              <p className="text-xs text-muted-foreground">Minutes per video</p>
            </CardContent>
          </Card>

          {/* Completion Progress */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {progressData.completionRate}%
              </div>
              <Progress value={progressData.completionRate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {progressData.completedVideos} of{" "}
                {progressData.totalVideosWatched} completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Simple Chart - Daily Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Activity this week</span>
                <span className="text-sm font-semibold">
                  {progressData.last7DaysMinutes} min
                </span>
              </div>
              {progressData.last7DaysMinutes > 0 ? (
                <div className="flex gap-1 h-6">
                  {data?.data.daily_activity?.map((minutes, i) => {
                    // Find max minutes for scaling
                    const maxMinutes = Math.max(
                      ...(data?.data.daily_activity || [0]),
                      1
                    );
                    const height = (minutes / maxMinutes) * 100;

                    // Get day name
                    const days = [
                      "Sun",
                      "Mon",
                      "Tue",
                      "Wed",
                      "Thu",
                      "Fri",
                      "Sat",
                    ];
                    const dayIndex = (new Date().getDay() - (6 - i) + 7) % 7;

                    return (
                      <div
                        key={i}
                        className="flex-1 bg-primary rounded flex items-end"
                        title={`${days[dayIndex]}: ${Math.round(minutes)} min`}
                      >
                        <div
                          className="w-full bg-primary rounded transition-all"
                          style={{
                            height: `${Math.max(height, 5)}%`,
                            minHeight: minutes > 0 ? "5%" : "0%",
                          }}
                        />
                      </div>
                    );
                  }) ||
                    [...Array(7)].map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-muted rounded"
                        title="No activity"
                      />
                    ))}
                </div>
              ) : (
                <div className="flex gap-1 h-6">
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-muted rounded"
                      title="No activity"
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ProgressPage;
