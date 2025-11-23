"use client";
import React, { useMemo, useState } from "react";
import { useGetUserProgressQuery } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Level thresholds in hours
const LEVEL_THRESHOLDS = [0, 50, 150, 300, 600];

function calculateLevel(hours: number): {
  level: number;
  hoursToNext: number;
  progressPercent: number;
} {
  let currentLevel = 1;
  let hoursToNext = LEVEL_THRESHOLDS[1] - hours;

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 1; i--) {
    if (hours >= LEVEL_THRESHOLDS[i]) {
      currentLevel = i + 1;
      if (i + 1 < LEVEL_THRESHOLDS.length) {
        hoursToNext = LEVEL_THRESHOLDS[i + 1] - hours;
      } else {
        hoursToNext = 0; // Max level
      }
      break;
    } else {
      hoursToNext = LEVEL_THRESHOLDS[i] - hours;
    }
  }

  const progressPercent =
    currentLevel === 1
      ? (hours / LEVEL_THRESHOLDS[1]) * 100
      : currentLevel > LEVEL_THRESHOLDS.length
      ? 100
      : ((hours - LEVEL_THRESHOLDS[currentLevel - 1]) /
          (LEVEL_THRESHOLDS[currentLevel] -
            LEVEL_THRESHOLDS[currentLevel - 1])) *
        100;

  return {
    level: currentLevel,
    hoursToNext: Math.max(0, hoursToNext),
    progressPercent: Math.min(100, Math.max(0, progressPercent)),
  };
}

function calculateWeeksInARow(dailyActivity: number[] | undefined): number {
  if (!dailyActivity || dailyActivity.length === 0) return 0;

  let weeks = 0;
  let currentWeekActivity = 0;

  // Check from most recent week backwards
  for (let i = dailyActivity.length - 1; i >= 0; i--) {
    if (dailyActivity[i] > 0) {
      currentWeekActivity++;
    } else {
      break; // Week is broken
    }

    if (currentWeekActivity === 7) {
      weeks++;
      currentWeekActivity = 0;
    }
  }

  // If we have partial week activity, count it
  if (currentWeekActivity > 0) {
    weeks++;
  }

  return weeks;
}

function calculateHoursThisMonth(
  totalMinutes: number,
  dailyActivity: number[] | undefined
): number {
  // For simplicity, use last 7 days as proxy for this month
  // In a real implementation, you'd calculate from the start of the month
  if (!dailyActivity) return 0;
  const last7DaysMinutes = dailyActivity
    .slice(-7)
    .reduce((sum, min) => sum + min, 0);
  return Math.round(last7DaysMinutes / 60);
}

function SimpleCalendar() {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const days = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">
        {monthNames[currentMonth]} {currentYear}
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs">
        {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
          <div
            key={day}
            className="text-center text-muted-foreground font-medium"
          >
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          const isToday = day === today.getDate();
          return (
            <div
              key={index}
              className={`aspect-square flex items-center justify-center rounded text-xs ${
                day === null
                  ? ""
                  : isToday
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "hover:bg-muted cursor-pointer"
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProgressPage() {
  const { data, isLoading, error } = useGetUserProgressQuery();
  const [outsideHours, setOutsideHours] = useState(0); // Placeholder state

  const progressData = useMemo(() => {
    if (!data?.data) return null;

    const stats = data.data;
    const totalHours = stats.total_minutes / 60;
    const levelInfo = calculateLevel(totalHours);
    const weeksInARow = calculateWeeksInARow(stats.daily_activity);
    const hoursThisMonth = calculateHoursThisMonth(
      stats.total_minutes,
      stats.daily_activity
    );

    return {
      totalMinutes: Math.round(stats.total_minutes),
      totalHours: totalHours,
      last7DaysMinutes: Math.round(stats.last_7_days_minutes),
      currentStreak: stats.current_streak,
      longestStreak: stats.longest_streak,
      totalVideosWatched: stats.total_videos_watched,
      completedVideos: stats.completed_videos,
      dailyActivity: stats.daily_activity || [],
      levelInfo,
      weeksInARow,
      hoursThisMonth,
    };
  }, [data]);

  // Calculate badges earned
  const badges = useMemo(() => {
    if (!progressData) return [];

    const earnedBadges = [];

    if (progressData.currentStreak >= 3) {
      earnedBadges.push({ name: "3-day streak", icon: "🔥" });
    }
    if (progressData.currentStreak >= 7) {
      earnedBadges.push({ name: "7-day streak", icon: "🌟" });
    }
    if (progressData.weeksInARow >= 4) {
      earnedBadges.push({ name: "4 weeks", icon: "📅" });
    }
    if (progressData.hoursThisMonth >= 5) {
      earnedBadges.push({ name: ">=5h this month", icon: "⏰" });
    }
    if (progressData.levelInfo.level >= 2) {
      earnedBadges.push({
        name: `Level ${progressData.levelInfo.level}`,
        icon: "⭐",
      });
    }

    return earnedBadges;
  }, [progressData]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Your progress</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch lg:min-h-[calc(100vh-12rem)]">
        {/* Left Column */}
        <div className="space-y-6 lg:flex lg:flex-col lg:h-full">
          {/* Overall Progression */}
          <Card className="lg:flex-1 lg:flex lg:flex-col">
            <CardHeader>
              <CardTitle>Overall progression</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 lg:flex-1 lg:flex lg:flex-col lg:justify-between">
              <div>
                <div className="text-2xl font-bold">
                  Level {progressData.levelInfo.level}
                </div>
                <div className="text-sm text-muted-foreground">
                  {progressData.totalHours.toFixed(1)} hrs
                </div>
              </div>
              {progressData.levelInfo.hoursToNext > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      Hours to level {progressData.levelInfo.level + 1}
                    </span>
                    <span className="font-semibold">
                      {progressData.levelInfo.hoursToNext.toFixed(1)} hrs
                    </span>
                  </div>
                  <Progress
                    value={progressData.levelInfo.progressPercent}
                    className="h-2"
                  />
                </div>
              )}
              {progressData.levelInfo.hoursToNext === 0 &&
                progressData.levelInfo.level >= LEVEL_THRESHOLDS.length && (
                  <div className="text-sm text-muted-foreground">
                    Maximum level reached! 🎉
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Outside Hours */}
          <Card className="lg:flex-1 lg:flex lg:flex-col">
            <CardHeader>
              <CardTitle>Outside hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 lg:flex-1 lg:flex lg:flex-col lg:justify-center lg:items-center text-center">
              <div className="text-lg">
                <span className="text-primary">{outsideHours}</span>{" "}
                <span className="text-muted-foreground">
                  hours outside the platform
                </span>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Add hours outside the platform
              </Button>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card className="lg:flex-1 lg:flex lg:flex-col">
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="lg:flex-1 lg:flex lg:flex-col lg:justify-center lg:items-center text-center">
              <div className="text-lg">
                <span className="font-semibold">
                  {progressData.totalMinutes}
                </span>{" "}
                <span className="text-muted-foreground">minutes watched</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Your Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Your activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Stats */}
                <div className="space-y-6">
                  {/* Current Streak */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">
                        Current streak
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">
                        {progressData.currentStreak}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        days
                      </span>
                    </div>
                    {progressData.longestStreak > 0 && (
                      <div className="space-y-1">
                        <Progress
                          value={
                            (progressData.currentStreak /
                              progressData.longestStreak) *
                            100
                          }
                          className="h-2"
                        />
                      </div>
                    )}
                  </div>

                  {/* Weeks in a row */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Weeks in a row
                    </span>
                    <span className="font-semibold">
                      {progressData.weeksInARow}
                    </span>
                  </div>

                  {/* Hours this month */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Hours this month
                    </span>
                    <span className="font-semibold">
                      {progressData.hoursThisMonth}
                    </span>
                  </div>
                </div>

                {/* Calendar */}
                <div>
                  <SimpleCalendar />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Levels */}
          <Card>
            <CardHeader>
              <CardTitle>Levels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {LEVEL_THRESHOLDS.map((threshold, index) => {
                const level = index + 1;
                const isCurrentLevel = level === progressData.levelInfo.level;
                const isReached = progressData.totalHours >= threshold;

                return (
                  <div
                    key={level}
                    className={`flex items-center gap-3 p-2 rounded ${
                      isCurrentLevel ? "bg-primary/10" : ""
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                        isCurrentLevel
                          ? "bg-primary text-primary-foreground"
                          : isReached
                          ? "bg-muted text-muted-foreground"
                          : "bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      {isCurrentLevel ? "•" : level}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Level {level}</div>
                      <div className="text-xs text-muted-foreground">
                        {threshold} hours of input
                      </div>
                    </div>
                    <Progress
                      value={
                        isReached
                          ? 100
                          : level === progressData.levelInfo.level + 1
                          ? ((progressData.totalHours -
                              LEVEL_THRESHOLDS[level - 2]) /
                              (threshold - LEVEL_THRESHOLDS[level - 2])) *
                            100
                          : 0
                      }
                      className="w-24 h-1.5"
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {badges.length > 0 ? (
                  badges.map((badge, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center gap-2 p-3 border rounded-lg"
                    >
                      <div className="text-2xl">{badge.icon}</div>
                      <div className="text-xs font-medium text-center">
                        {badge.name}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-sm text-muted-foreground text-center py-4">
                    No badges earned yet. Keep learning!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ProgressPage;
