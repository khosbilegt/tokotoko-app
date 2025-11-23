"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useLearningList,
  useLearningListStats,
  useVocabularies,
  useLearningListMutations,
  useSearchVocabularyWithVideos,
  useExportLearningList,
  useThrottledGeneralSearch,
} from "@/lib/hooks/api";
import { toast } from "sonner";
import type { LearningListItem, VocabularyIndex } from "@/lib/types";
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  Play,
  Trash2,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import SearchResults from "@/components/search/SearchResults";

function formatTime(seconds: number | undefined | null): string {
  if (seconds == null) return "";

  const totalSeconds = Math.floor(seconds);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  } else {
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }
}

export default function LearningListPage() {
  const router = useRouter();
  const [selectedWord, setSelectedWord] = useState<LearningListItem | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: learningListData,
    isLoading: isLoadingWords,
    error: wordsError,
  } = useLearningList();
  const { data: statsData } = useLearningListStats();
  const {
    vocabularies,
    isLoading: isLoadingVocab,
    error: vocabError,
  } = useVocabularies();
  const { updateItem, deleteItem } = useLearningListMutations();
  const { exportFile } = useExportLearningList();

  // Search for videos containing the selected word
  const {
    data: vocabularySearchData,
    isLoading: isLoadingSearch,
    error: searchError,
  } = useSearchVocabularyWithVideos(selectedWord?.text || "");

  // General search for vocabulary
  const {
    data: searchData,
    isLoading: searchLoading,
    error: generalSearchError,
  } = useThrottledGeneralSearch(searchQuery);

  const stats = statsData?.data;
  const isLoading = isLoadingWords || isLoadingVocab;

  // Memoize learning list to prevent unnecessary re-renders
  const learningList = React.useMemo(() => {
    return learningListData?.data || [];
  }, [learningListData?.data]);

  // Enrich learning list with vocabulary data
  const enrichedWords = React.useMemo(() => {
    if (!learningList.length || !vocabularies?.length) return learningList;

    return learningList.map((word) => {
      // Find matching vocabulary entry
      const vocabMatch = vocabularies.find(
        (vocab) => vocab.maori?.toLowerCase() === word.text.toLowerCase()
      );

      return {
        ...word,
        // Use vocabulary data if available, otherwise use notes
        notes: vocabMatch?.english || word.notes || "",
        description: vocabMatch?.description || "",
        vocabulary: vocabMatch,
      };
    });
  }, [learningList, vocabularies]);

  // Handle status change
  const handleStatusChange = async (wordId: string, newStatus: string) => {
    try {
      await updateItem(wordId, {
        status: newStatus as "new" | "learning" | "learned",
      });
      toast.success("Status updated successfully!");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update status");
    }
  };

  // Handle word deletion
  const handleDeleteWord = async (wordId: string, wordText: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${wordText}" from your learning list?`
      )
    ) {
      return;
    }

    try {
      await deleteItem(wordId);
      toast.success("Word deleted successfully!");

      // If the deleted word was selected, clear the selection
      if (selectedWord?.id === wordId) {
        setSelectedWord(null);
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete word");
    }
  };

  // Restore last selected word from localStorage or default to first
  useEffect(() => {
    if (!enrichedWords || enrichedWords.length === 0) return;
    const storedId = localStorage.getItem("lastSelectedWordId");
    if (!selectedWord) {
      if (storedId) {
        const found = enrichedWords.find((w) => w.id === storedId);
        if (found) {
          setSelectedWord(found);
          return;
        }
      }
      setSelectedWord(enrichedWords[0]);
    }
  }, [enrichedWords, selectedWord]);

  // Persist selected word id to localStorage
  useEffect(() => {
    if (selectedWord?.id) {
      localStorage.setItem("lastSelectedWordId", selectedWord.id);
    }
  }, [selectedWord?.id]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Statistics Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (wordsError || vocabError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <p className="text-red-600">Failed to load data</p>
          {wordsError && (
            <p className="text-sm text-gray-500">Words: Failed to load</p>
          )}
          {vocabError && (
            <p className="text-sm text-gray-500">Vocabulary: Failed to load</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-3xl font-bold text-foreground">
                {stats?.total || enrichedWords.length}
              </p>
              <p className="text-sm text-muted-foreground font-medium">
                Saved words
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-3xl font-bold text-foreground">
                {stats?.learning || 0}
              </p>
              <p className="text-sm text-muted-foreground font-medium">
                Learning
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-3xl font-bold text-foreground">
                {stats?.learned || 0}
              </p>
              <p className="text-sm text-muted-foreground font-medium">
                Learned
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-3xl font-bold text-foreground">
                {stats?.new || 0}
              </p>
              <p className="text-sm text-muted-foreground font-medium">New</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={exportFile}>
          Export learning list
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex w-full justify-start">
        <div className="w-full max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            className="w-full pl-10 pr-4"
            placeholder="Search vocabulary (e.g., 'tup', 'hauora')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery.length >= 2 && searchLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          )}
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
            error={generalSearchError}
          />
        </div>
      )}

      {/* Main Content - Learning List */}
      {learningList.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
          {/* Left Column - Your Words */}
          <Card className="h-fit">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg">Your words</CardTitle>
              <Link
                href="#"
                className="text-sm text-primary hover:underline font-medium"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
              {enrichedWords.map((word) => (
                <div
                  key={word.id}
                  className={`group p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedWord?.id === word.id
                      ? "bg-primary/10 border-primary shadow-sm"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
                  }`}
                  onClick={() => setSelectedWord(word)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                        {word.text}
                      </span>
                      {word.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                          {word.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <Select
                        value={word.status}
                        onValueChange={(value) =>
                          handleStatusChange(word.id, value)
                        }
                      >
                        <SelectTrigger
                          className="w-28 h-8 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              New
                            </div>
                          </SelectItem>
                          <SelectItem value="learning">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-3 h-3" />
                              Learning
                            </div>
                          </SelectItem>
                          <SelectItem value="learned">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3" />
                              Learned
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWord(word.id, word.text);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Right Column - Selected Word Details */}
          <div className="space-y-6">
            {selectedWord && (
              <>
                {/* Word Details */}
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                          {selectedWord.text}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                          {selectedWord.notes}
                        </p>
                        <div className="flex flex-wrap items-center gap-6">
                          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                              Total Exposures:
                            </span>
                            <span className="text-sm font-bold text-primary">
                              {vocabularySearchData?.total_exposures || 0}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                              This Week:
                            </span>
                            <span className="text-sm font-bold text-primary">
                              {vocabularySearchData?.recent_exposures || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Examples Section */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Example Usage
                        </h3>
                        {!vocabularySearchData?.results ||
                        vocabularySearchData?.results?.length === 0 ? (
                          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No examples available for this word
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {vocabularySearchData?.results?.length &&
                              vocabularySearchData?.results[0]?.occurrences
                                .slice(0, 3) // Show only first 3 examples
                                .map((occurrence) => (
                                  <div
                                    key={occurrence.id}
                                    className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                  >
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                      &quot;{occurrence?.transcript}&quot;
                                    </p>
                                    <div className="flex items-center justify-between">
                                      <Link
                                        href={`/watch/${occurrence?.video?.id}?t=${occurrence?.start_time}`}
                                        className="text-xs text-primary hover:text-primary/80 hover:underline font-medium"
                                      >
                                        {occurrence?.video?.title}
                                      </Link>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatTime(occurrence?.start_time)} -{" "}
                                        {formatTime(occurrence?.end_time)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                            {vocabularySearchData?.results[0]?.occurrences
                              .length > 3 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                                +
                                {vocabularySearchData.results[0].occurrences
                                  .length - 3}{" "}
                                more examples
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <Button
                        className="w-full h-12 text-base font-semibold"
                        disabled={
                          !vocabularySearchData?.results ||
                          vocabularySearchData?.results?.length === 0 ||
                          !vocabularySearchData?.results[0]?.occurrences ||
                          vocabularySearchData?.results[0]?.occurrences
                            .length === 0
                        }
                        onClick={() => {
                          if (
                            vocabularySearchData?.results &&
                            vocabularySearchData.results.length > 0 &&
                            vocabularySearchData.results[0]?.occurrences &&
                            vocabularySearchData.results[0].occurrences.length >
                              0
                          ) {
                            const firstOccurrence =
                              vocabularySearchData.results[0].occurrences[0];
                            router.push(
                              `/watch/${firstOccurrence.video.id}?t=${firstOccurrence.start_time}`
                            );
                          }
                        }}
                      >
                        <BookOpen className="w-5 h-5 mr-2" />
                        {!vocabularySearchData?.results ||
                        vocabularySearchData?.results?.length === 0 ||
                        !vocabularySearchData?.results[0]?.occurrences ||
                        vocabularySearchData?.results[0]?.occurrences.length ===
                          0
                          ? "No examples available"
                          : "Practice this word"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Videos containing the word */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Videos containing &apos;{selectedWord.text}&apos;
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingSearch ? (
                      <div className="space-y-4 max-h-[600px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                              <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="aspect-video bg-gray-200 dark:bg-gray-700"></div>
                                <div className="p-4 space-y-3">
                                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                  <div className="flex items-center justify-between">
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : searchError ? (
                      <div className="text-center py-8">
                        <p className="text-red-600 text-sm">
                          Failed to load videos
                        </p>
                      </div>
                    ) : vocabularySearchData?.results?.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          No videos found containing this word
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-[600px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pr-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {vocabularySearchData?.results &&
                            vocabularySearchData?.results[0]?.occurrences.map(
                              (result: VocabularyIndex) => (
                                <div
                                  key={result.id}
                                  className="group rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md dark:hover:shadow-lg transition-all duration-200 hover:border-primary/20"
                                >
                                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                                    {result?.video.thumbnail ? (
                                      <img
                                        src={result?.video.thumbnail}
                                        alt={result?.video.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Play className="w-8 h-8 text-gray-400" />
                                      </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <Button
                                          size="sm"
                                          className="rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-lg"
                                          asChild
                                        >
                                          <Link
                                            href={`/watch/${result?.video.id}?t=${result?.start_time}`}
                                          >
                                            <Play className="w-4 h-4" />
                                          </Link>
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="p-4 space-y-3">
                                    <h3 className="font-medium text-sm line-clamp-2 text-gray-900 dark:text-gray-100">
                                      {result?.video.title}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                        {formatTime(result?.start_time)} -{" "}
                                        {formatTime(result?.end_time)}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs h-7 px-3"
                                        asChild
                                      >
                                        <Link
                                          href={`/watch/${result?.video.id}?t=${result?.start_time}`}
                                        >
                                          <Play className="w-3 h-3 mr-1" />
                                          Watch
                                        </Link>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 flex flex-col items-center gap-6">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Kia Ora! Your learning list is empty
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
              Start watching videos and tap words to save them. They will appear
              here so you can review and practice across devices.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="h-12 px-8">
              <Link href="/library">
                <Play className="w-5 h-5 mr-2" />
                Watch videos
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-8">
              <ArrowRight className="w-5 h-5 mr-2" />
              Import my words
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
