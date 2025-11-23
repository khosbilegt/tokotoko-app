"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, BookOpen, TrendingUp, HelpCircle } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";

export default function MethodPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Our Method</h1>
          <p className="text-xl text-muted-foreground">
            A comprehensible-input approach to acquiring te reo Māori.
          </p>
        </div>

        {/* Why this works */}
        <Card>
          <CardHeader>
            <CardTitle>Why this works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              We focus on{" "}
              <strong className="text-foreground">comprehensible input</strong>:
              listening and reading you can mostly understand, so your brain
              naturally acquires vocabulary, grammar, and a feel for the
              language without heavy memorisation. Speaking confidence follows
              once enough input has built a clear mental model of the sounds and
              patterns of the language.
            </p>
          </CardContent>
        </Card>

        {/* Core Principles */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Comprehensible input first
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Understand messages → acquire forms and patterns implicitly.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acquisition ≠ study</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Exposure builds fast, intuitive knowledge; rules stay optional.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Delay output pressure</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Speak when ready; clear sound targets come from rich input.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How to use this app */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              How to use this app
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Watch what you understand.</p>
                  <p className="text-sm text-muted-foreground">
                    Pick topics you know (e.g., kai prep, kapa haka intros,
                    pepeha basics) so kupu like whānau, kura, mahi, kai feel
                    obvious from context.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Use transcripts when helpful.</p>
                  <p className="text-sm text-muted-foreground">
                    Prefer ones with tohutō (macrons). Skim for patterns like{" "}
                    <span className="font-mono">Kei te …</span> (state),
                    location with i/ki, and simple{" "}
                    <span className="font-mono">He …</span> sentences.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Log outside input.</p>
                  <p className="text-sm text-muted-foreground">
                    Add reading/listening done elsewhere in Progress → Outside
                    hours.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Practice speaking later.</p>
                  <p className="text-sm text-muted-foreground">
                    When ready, lean on frames like{" "}
                    <span className="font-mono">Ko … tōku ingoa</span>,{" "}
                    <span className="font-mono">Nō … au</span>,{" "}
                    <span className="font-mono">Kei te … au</span> to ease in.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Māori-specific examples */}
        <Card>
          <CardHeader>
            <CardTitle>Māori-specific examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Useful sentence frames */}
            <div>
              <h3 className="font-semibold text-lg mb-3">
                Useful sentence frames
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-sm mb-1">Kupu whakatau:</p>
                  <p className="text-sm font-mono text-muted-foreground bg-muted p-2 rounded">
                    Kia ora. Tēnā koe/kōrua/koutou.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">
                    <span className="font-mono">Kei te … au</span>:
                  </p>
                  <p className="text-sm font-mono text-muted-foreground bg-muted p-2 rounded">
                    Kei te hiakai au. Kei te ngenge au. Kei te harikoa au.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">
                    <span className="font-mono">He … tāku/tōku</span>:
                  </p>
                  <p className="text-sm font-mono text-muted-foreground bg-muted p-2 rounded">
                    He pukapuka tāku. He waka tōku.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">
                    <span className="font-mono">Kei … te …</span>:
                  </p>
                  <p className="text-sm font-mono text-muted-foreground bg-muted p-2 rounded">
                    Kei te whare pukapuka te kaiako. Kei te marae te whānau.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">
                    <span className="font-mono">Pātai āhua</span>:
                  </p>
                  <p className="text-sm font-mono text-muted-foreground bg-muted p-2 rounded">
                    He aha tēnei? He pene tēnei.
                  </p>
                </div>
              </div>
            </div>

            {/* Starter vocabulary domains */}
            <div>
              <h3 className="font-semibold text-lg mb-3">
                Starter vocabulary domains
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="font-medium text-sm mb-1">Whānau:</p>
                  <p className="text-sm text-muted-foreground">
                    whaea, matua, tuakana, teina, tamariki
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">Kai:</p>
                  <p className="text-sm text-muted-foreground">
                    kai, wai, hēki, rēwena, mīti, huawhenua
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">Wāhi/Mahi:</p>
                  <p className="text-sm text-muted-foreground">
                    whare, kura, mahi, toa, marae
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">Wā/Āhua:</p>
                  <p className="text-sm text-muted-foreground">
                    rangi, raumati, hotoke, makariri, wera
                  </p>
                </div>
              </div>
            </div>

            {/* Pronunciation and spelling */}
            <div>
              <h3 className="font-semibold text-lg mb-3">
                Pronunciation and spelling (tohutō)
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    Long vowels <span className="font-mono">ā, ē, ī, ō, ū</span>{" "}
                    change meaning: kaka vs kākā.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    <span className="font-mono">wh</span> often sounds like f;{" "}
                    <span className="font-mono">r</span> is a tap;{" "}
                    <span className="font-mono">ng</span> as in
                    &ldquo;singer&rdquo;.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    Prefer content with macrons to reinforce vowel length while
                    reading.
                  </span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Input levels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Input levels (guideline)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-6">
              Approximate cumulative hours of comprehensible input. Your path
              may vary.
            </p>
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Level 1</h3>
                  <span className="text-sm text-muted-foreground font-mono">
                    0–50 hrs
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  • Get familiar sounds, core words, simple stories.
                </p>
              </div>

              <div className="border-l-4 border-primary/60 pl-4 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Level 2</h3>
                  <span className="text-sm text-muted-foreground font-mono">
                    50–150 hrs
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  • Understand everyday topics with support.
                </p>
              </div>

              <div className="border-l-4 border-primary/40 pl-4 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Level 3</h3>
                  <span className="text-sm text-muted-foreground font-mono">
                    150–300 hrs
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  • Patterns feel natural; light conversation.
                </p>
              </div>

              <div className="border-l-4 border-primary/30 pl-4 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Level 4</h3>
                  <span className="text-sm text-muted-foreground font-mono">
                    300–600 hrs
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  • Broad topics, fewer transcripts needed.
                </p>
              </div>

              <div className="border-l-4 border-primary/20 pl-4 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Level 5+</h3>
                  <span className="text-sm text-muted-foreground font-mono">
                    600+ hrs
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  • Fluent input; reading and speaking expand fast.
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm font-medium">
                Tip: Consistency beats intensity. Aim for daily minutes, not
                occasional marathons.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              FAQ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion
              items={[
                {
                  question: "Do I need grammar study?",
                  answer:
                    "Optional. Input builds the intuitions you actually use in real time. Light study can be interesting, but isn't required to progress.",
                },
                {
                  question: "Will speaking suffer if I don't practice early?",
                  answer:
                    "No. Clear pronunciation and fluent phrasing follow quickly once your input is strong; early forcing often reinforces L1 habits.",
                },
                {
                  question: "When should I start reading?",
                  answer:
                    "Once listening feels easy at Level 4–5, reading accelerates vocabulary growth without harming pronunciation.",
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
