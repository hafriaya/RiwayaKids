"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StoryBook } from "@/components/StoryBook";
import type { GenerateStoryResponse } from "@/lib/types";

export default function ReadPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const subject = searchParams.get("subject") || "";
  const random = searchParams.get("random") === "true";
  const pagesParam = parseInt(searchParams.get("pages") || "10", 10);
  const ageRange = searchParams.get("ageRange") || "4-7";

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverTitle, setCoverTitle] = useState<string | null>(null);
  const [story, setStory] = useState<GenerateStoryResponse | null>(null);
  const [showReader, setShowReader] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const pagesRef = useRef<GenerateStoryResponse["pages"]>([]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    async function run() {
      setIsLoading(true);
      setError(null);
      setCoverTitle(null);
      pagesRef.current = [];
      setStory(null);
      try {
        const res = await fetch("/api/story/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject: random ? undefined : subject, random, pages: pagesParam, ageRange }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const j = await res.json().catch(() => ({}));
          throw new Error((j as any).error || "Failed to start stream");
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;
          buffer += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 1);
            if (!line) continue;
            try {
              const evt = JSON.parse(line);
              if (evt.type === "cover") {
                setCoverTitle(evt.title);
                setIsLoading(false);
              } else if (evt.type === "page_text") {
                // Add/merge text page
                const incoming = evt.page;
                const existingIndex = pagesRef.current.findIndex((p) => p.pageNumber === incoming.pageNumber);
                if (existingIndex >= 0) {
                  pagesRef.current[existingIndex] = { ...pagesRef.current[existingIndex], ...incoming };
                } else {
                  pagesRef.current = [...pagesRef.current, incoming];
                }
                pagesRef.current.sort((a, b) => a.pageNumber - b.pageNumber);
                setStory({ title: coverTitle || "Story", pages: pagesRef.current.slice() });
              } else if (evt.type === "page_image") {
                // Merge image into the correct page
                const idxPg = pagesRef.current.findIndex((p) => p.pageNumber === evt.pageNumber);
                if (idxPg >= 0) {
                  pagesRef.current[idxPg] = { ...pagesRef.current[idxPg], imageUrl: evt.imageUrl };
                  setStory({ title: coverTitle || "Story", pages: pagesRef.current.slice() });
                }
              } else if (evt.type === "progress") {
                setProgress({ done: evt.done, total: evt.total });
              } else if (evt.type === "done") {
                setStory((prev) => (prev ? prev : { title: coverTitle || "Story", pages: pagesRef.current }));
              } else if (evt.type === "error") {
                throw new Error(evt.error || "Stream error");
              }
            } catch (e) {
              // ignore malformed line
            }
          }
        }
      } catch (e: unknown) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Something went wrong";
        setError(msg);
        setIsLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [subject, random, pagesParam, ageRange]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-sky-50 px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-800">Reading Room</h1>
          <Button variant="outline" className="text-blue-700 border-blue-300 hover:bg-blue-50" onClick={() => router.push("/")}>Back Home</Button>
        </div>

        {isLoading && (
          <div className="w-full max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-sky-100">
            <div className="h-56 rounded-xl bg-gradient-to-br from-sky-200 to-purple-200 flex items-center justify-center">
              <div className="h-10 w-10 rounded-full border-4 border-white border-t-transparent animate-spin" />
            </div>
            <p className="mt-4 text-center text-blue-700">Creating your story...</p>
          </div>
        )}

        {!isLoading && (coverTitle || story) && (
          <div className="w-full max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-6 border border-sky-100">
            <div className="h-56 rounded-xl bg-gradient-to-br from-sky-200 to-purple-200 flex items-center justify-center text-blue-800 text-2xl font-bold mb-4">
              {coverTitle || story?.title || "Your Story"}
            </div>
            <div className="text-center text-blue-700 mb-4">
              {progress ? `Pages ready: ${progress.done}/${progress.total}` : "Preparing pages..."}
            </div>
            <div className="flex justify-center gap-3">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowReader(true)} disabled={!story?.pages?.length}>Open Reader</Button>
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50" onClick={() => router.push("/")}>New Story</Button>
            </div>
          </div>
        )}

        {error && (
          <div className="w-full max-w-xl mx-auto mt-6 text-center text-red-600">{error}</div>
        )}

        {showReader && story && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowReader(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-sky-200 p-4 sm:p-6 max-w-5xl w-[95%]">
              <button className="absolute right-3 top-3 text-blue-700 hover:text-blue-900" onClick={() => setShowReader(false)}>
                Close
              </button>
              <StoryBook key={story.pages.length} title={story.title} pages={story.pages} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


