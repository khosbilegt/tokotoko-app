"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVocabularies } from "@/lib/hooks/api";
import type { Vocabulary } from "@/lib/types";
import { PracticeCard } from "@/components/practice/practice-card";
import { TrendingUp, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type AnswerResult = "correct" | "incorrect" | null;

interface PracticeSession {
  vocabulary: Vocabulary;
  result: AnswerResult;
}

export default function PracticePage() {
  const [numCards, setNumCards] = useState<number>(10);
  const [practiceVocabularies, setPracticeVocabularies] = useState<
    Vocabulary[]
  >([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const { vocabularies, isLoading, error } = useVocabularies();

  // Shuffle vocabularies and select random ones
  const startPractice = () => {
    if (!vocabularies || vocabularies.length === 0) return;

    const shuffled = [...vocabularies].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(numCards, vocabularies.length));

    setPracticeVocabularies(selected);
    setSessions(selected.map((v) => ({ vocabulary: v, result: null })));
    setCurrentIndex(0);
    setIsStarted(true);
    setIsFinished(false);
  };

  const handleAnswer = (correct: boolean) => {
    const updatedSessions = [...sessions];
    updatedSessions[currentIndex] = {
      ...updatedSessions[currentIndex],
      result: correct ? "correct" : "incorrect",
    };
    setSessions(updatedSessions);

    // Move to next card or finish
    if (currentIndex < practiceVocabularies.length - 1) {
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 500);
    } else {
      setTimeout(() => {
        setIsFinished(true);
      }, 500);
    }
  };

  const resetPractice = () => {
    setIsStarted(false);
    setIsFinished(false);
    setCurrentIndex(0);
    setPracticeVocabularies([]);
    setSessions([]);
  };

  const currentCard = practiceVocabularies[currentIndex];
  const currentSession = sessions[currentIndex];

  // Calculate results
  const results = useMemo(() => {
    const correct = sessions.filter((s) => s.result === "correct").length;
    const incorrect = sessions.filter((s) => s.result === "incorrect").length;
    const total = sessions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    return { correct, incorrect, total, percentage };
  }, [sessions]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-96" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Failed to load vocabularies</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!vocabularies || vocabularies.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              No vocabularies available for practice.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results screen
  if (isFinished) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">Practice Summary</h1>
            <p className="text-muted-foreground">
              Review your performance from this practice session
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Results</CardTitle>
                <div className="text-right">
                  <div className="text-2xl font-semibold text-primary">
                    {results.percentage}%
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    Accuracy
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1 p-4 border rounded-lg border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/30">
                  <div className="text-sm font-medium text-green-700 dark:text-green-400">
                    Correct
                  </div>
                  <div className="text-2xl font-semibold text-green-600 dark:text-green-500">
                    {results.correct}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {results.total > 0
                      ? `${Math.round(
                          (results.correct / results.total) * 100
                        )}%`
                      : "0%"}
                  </div>
                </div>
                <div className="space-y-1 p-4 border rounded-lg border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30">
                  <div className="text-sm font-medium text-red-700 dark:text-red-400">
                    Incorrect
                  </div>
                  <div className="text-2xl font-semibold text-red-600 dark:text-red-500">
                    {results.incorrect}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {results.total > 0
                      ? `${Math.round(
                          (results.incorrect / results.total) * 100
                        )}%`
                      : "0%"}
                  </div>
                </div>
                <div className="space-y-1 p-4 border rounded-lg border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10">
                  <div className="text-sm font-medium text-muted-foreground">
                    Total Cards
                  </div>
                  <div className="text-2xl font-semibold text-primary">
                    {results.total}
                  </div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-end">
                  <Button onClick={resetPractice} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Start New Session
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Start screen
  if (!isStarted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Practice</h1>
            <p className="text-xl text-muted-foreground">
              Practice your Māori vocabulary with flashcards
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Start Practice Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="numCards" className="text-sm font-medium">
                  Number of cards (1 - {vocabularies.length})
                </label>
                <Input
                  id="numCards"
                  type="number"
                  min={1}
                  max={vocabularies.length}
                  value={numCards}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (
                      !isNaN(value) &&
                      value >= 1 &&
                      value <= vocabularies.length
                    ) {
                      setNumCards(value);
                    }
                  }}
                  className="max-w-xs"
                />
              </div>

              <Button
                onClick={startPractice}
                size="lg"
                className="w-full sm:w-auto"
              >
                Start Practice
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Practice screen
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Card {currentIndex + 1} of {practiceVocabularies.length}
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {sessions.filter((s) => s.result === "correct").length} correct
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{
              width: `${
                ((currentIndex + 1) / practiceVocabularies.length) * 100
              }%`,
            }}
          />
        </div>

        {/* Practice card */}
        {currentCard && (
          <PracticeCard
            key={currentCard.id}
            vocabulary={currentCard}
            onAnswer={handleAnswer}
            isAnswered={currentSession?.result !== null}
            result={currentSession?.result || null}
          />
        )}
      </div>
    </div>
  );
}
