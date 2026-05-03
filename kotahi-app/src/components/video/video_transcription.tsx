"use client";
import React, { useEffect, useRef } from "react";
import { TranscriptItem } from "./types";
import { Vocabulary } from "@/lib/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "../ui/button";
import { Notebook } from "lucide-react";
import { useLearningList, useLearningListMutations } from "@/lib/hooks/api";
import { toast } from "sonner";
import {
  trackTranscriptScroll,
  trackTranscriptClickLine,
  trackVocabClick,
  trackVocabMarkUnknown,
  createThrottledTracker,
} from "@/lib/analytics";

function VideoTranscription({
  isLoadingTranscript,
  transcript,
  currentTime,
  onSeek,
  vocabularies,
  videoId,
}: {
  isLoadingTranscript: boolean;
  transcript: TranscriptItem[];
  currentTime: number;
  onSeek: (time: number) => void;
  vocabularies: Vocabulary[];
  videoId?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const { createItem } = useLearningListMutations();
  const { data: learningListData } = useLearningList();

  // Create throttled scroll tracker
  const throttledScrollTracker = createThrottledTracker(() => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      trackTranscriptScroll(scrollTop, videoId);
    }
  }, 1000);
  const learningTexts = React.useMemo(() => {
    const raw = learningListData?.data;
    const items = Array.isArray(raw) ? raw : [];
    return new Set<string>(
      items.map((i) => (i.text ? String(i.text).toLowerCase() : "")),
    );
  }, [learningListData]);

  // Find vocabulary matches in text
  const findVocabularyMatches = (text: string, vocabularies: Vocabulary[]) => {
    const matches: Array<{
      start: number;
      end: number;
      vocabulary: Vocabulary;
      length: number;
    }> = [];

    vocabularies.forEach((vocab) => {
      if (!vocab.maori) return;

      // Escape special regex characters in the Māori word
      const escapedWord = vocab.maori.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      // Unicode-aware whole-word match using letter boundaries.
      // Use lookarounds to avoid partial matches inside other words.
      const pattern = new RegExp(
        `(?<!\\\p{L})${escapedWord}(?!\\\p{L})`,
        "giu",
      );

      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        const wordStart = match.index;
        const wordEnd = wordStart + match[0].length;

        matches.push({
          start: wordStart,
          end: wordEnd,
          vocabulary: vocab,
          length: wordEnd - wordStart,
        });
      }
    });

    // Sort by start position, then by length (longest first for overlapping matches)
    matches.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return b.length - a.length;
    });

    // Remove overlapping matches, keeping the longest ones
    const filteredMatches: typeof matches = [];
    let lastEnd = 0;

    matches.forEach((match) => {
      if (match.start >= lastEnd) {
        filteredMatches.push(match);
        lastEnd = match.end;
      }
    });

    return filteredMatches;
  };

  // Render text with vocabulary highlights
  const renderTextWithVocabulary = (
    text: string,
    vocabularies: Vocabulary[],
  ) => {
    if (!vocabularies.length) return text;

    const matches = findVocabularyMatches(text, vocabularies);
    if (!matches.length) return text;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      // Add text before the match
      if (match.start > lastIndex) {
        parts.push(text.slice(lastIndex, match.start));
      }

      // Add the vocabulary button
      const vocabText = text.slice(match.start, match.end);
      const isInLearningList = learningTexts.has(
        match.vocabulary.maori?.toLowerCase?.() || vocabText.toLowerCase(),
      );

      parts.push(
        <Popover key={`vocab-${index}`}>
          <PopoverTrigger asChild>
            <span
              className={`inline-block px-1 text-primary rounded-md hover:decoration-yellow-400 transition-colors cursor-pointer underline underline-offset-2 decoration-2 focus:outline-none focus-visible:outline-none focus:ring-0 ${
                isInLearningList ? "decoration-yellow-400" : "decoration-white"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                // Track vocabulary click when the word is clicked
                trackVocabClick(
                  match.vocabulary.id || match.vocabulary.maori,
                  videoId,
                );
              }}
            >
              {vocabText}
            </span>
          </PopoverTrigger>
          <PopoverContent side="top">
            <div className="flex justify-between">
              <p className="font-light">{match.vocabulary.maori}</p>
              <Button
                variant="ghost"
                className="p-0"
                onClick={async () => {
                  try {
                    // Track vocabulary mark as unknown (adding to learning list)
                    trackVocabMarkUnknown(
                      match.vocabulary.id || match.vocabulary.maori,
                      videoId,
                    );

                    await createItem({
                      text: match.vocabulary.maori,
                      video_id: "",
                      notes: "",
                    });
                    toast.success(
                      `Added "${match.vocabulary.maori}" to learning list`,
                    );
                  } catch (error) {
                    toast.error(
                      `Failed to add "${match.vocabulary.maori}" to learning list`,
                    );
                    console.error("Error adding to learning list:", error);
                  }
                }}
              >
                <Notebook />
              </Button>
            </div>
            <p className="font-semibold">{match.vocabulary.english}</p>
            <p className="text-muted-foreground">
              {match.vocabulary.description}
            </p>
          </PopoverContent>
        </Popover>,
      );

      lastIndex = match.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  // Auto-scroll to current transcript item
  useEffect(() => {
    if (!transcript.length || !containerRef.current) return;

    const currentItem = transcript.find(
      (item) => currentTime >= item.startTime && currentTime <= item.endTime,
    );

    if (currentItem) {
      const itemIndex = transcript.findIndex(
        (item) => item.id === currentItem.id,
      );
      const itemElement = itemRefs.current.get(itemIndex);

      if (itemElement && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const itemRect = itemElement.getBoundingClientRect();

        // Check if item is not visible in the container
        const isVisible =
          itemRect.top >= containerRect.top &&
          itemRect.bottom <= containerRect.bottom;

        if (!isVisible) {
          itemElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    }
  }, [currentTime, transcript]);
  return (
    <div
      ref={containerRef}
      className="overflow-y-scroll h-[400px] lg:h-full"
      onScroll={throttledScrollTracker}
    >
      <div className="bg-card border rounded-lg p-4 space-y-2">
        {isLoadingTranscript ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading transcript...
          </div>
        ) : transcript.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No transcript available
          </div>
        ) : (
          transcript.map((item: TranscriptItem, index: number) => (
            <div
              ref={(el) => {
                if (el) {
                  itemRefs.current.set(index, el);
                } else {
                  itemRefs.current.delete(index);
                }
              }}
              onClick={() => {
                // Track transcript line click
                trackTranscriptClickLine(item.id, videoId);
                onSeek(item.startTime + 1);
              }}
              key={item.id || index}
              className={`p-2 rounded transition-colors cursor-pointer ${
                currentTime >= item.startTime && currentTime <= item.endTime
                  ? "bg-primary/10 border-l-4 border-primary"
                  : "hover:bg-muted/50"
              }`}
            >
              <span className="text-sm text-muted-foreground mr-2">
                {Math.floor(item.startTime / 60)}:
                {(item.startTime % 60).toFixed(0).padStart(2, "0")}
              </span>
              <span className="text-foreground">
                {renderTextWithVocabulary(item.text, vocabularies)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default VideoTranscription;
