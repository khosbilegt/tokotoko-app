"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import type { Vocabulary } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface PracticeCardProps {
  vocabulary: Vocabulary;
  onAnswer: (correct: boolean) => void;
  isAnswered: boolean;
  result: "correct" | "incorrect" | null;
}

export function PracticeCard({
  vocabulary,
  onAnswer,
  isAnswered,
  result,
}: PracticeCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset flip state when vocabulary changes (new card appears)
  useEffect(() => {
    setIsFlipped(false);
  }, [vocabulary.id]);

  const handleReveal = () => {
    setIsFlipped(true);
  };

  const handleAnswer = (correct: boolean) => {
    onAnswer(correct);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative h-[400px] perspective-1000">
        <div
          className={cn(
            "relative w-full h-full preserve-3d transition-transform duration-700 ease-in-out"
          )}
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front side - Māori word */}
          <Card
            className={cn(
              "absolute inset-0 w-full h-full backface-hidden flex flex-col items-center justify-center p-6"
            )}
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <CardContent className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold">{vocabulary.maori}</h2>
              </div>
              {!isFlipped && (
                <Button onClick={handleReveal} size="lg">
                  Reveal
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Back side - Māori word (primary) and English word (secondary) with popover */}
          <Card
            className={cn(
              "absolute inset-0 w-full h-full backface-hidden flex flex-col items-center justify-center p-6"
            )}
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <CardContent className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="text-center space-y-4">
                {/* Māori word - primary */}
                <h2 className="text-4xl font-bold">{vocabulary.maori}</h2>
                {/* English word - secondary with question mark */}
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-xl text-muted-foreground">
                    {vocabulary.english}
                  </h3>
                  {vocabulary.description && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Show explanation"
                        >
                          <HelpCircle className="h-5 w-5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <p className="text-sm">{vocabulary.description}</p>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
              {!isAnswered && (
                <div className="flex gap-4 w-full">
                  <Button
                    onClick={() => handleAnswer(false)}
                    variant="secondary"
                    size="lg"
                    className="flex-1"
                  >
                    Need practice
                  </Button>
                  <Button
                    onClick={() => handleAnswer(true)}
                    size="lg"
                    className="flex-1"
                  >
                    I knew it
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
