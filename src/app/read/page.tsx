"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StoryBook } from "@/components/StoryBook";
import type { GenerateStoryResponse } from "@/lib/types";

function ReadPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const subject = searchParams.get("subject") || "";
  const random = searchParams.get("random") === "true";
  const pagesParam = parseInt(searchParams.get("pages") || "5", 10);
  const ageRange = searchParams.get("ageRange") || "4-7";

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverTitle, setCoverTitle] = useState<string | null>(null);
  const [story, setStory] = useState<GenerateStoryResponse | null>(null);
  const [showReader, setShowReader] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [countdownTimer, setCountdownTimer] = useState<number | null>(null);
  const pagesRef = useRef<GenerateStoryResponse["pages"]>([]);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Check if there's a stored image just to trigger any side effects early if needed,
    // though the actual fetch uses it directly from sessionStorage later.
    const storedImage = sessionStorage.getItem('faceSwapReferenceImage');
    if (storedImage) {
      console.debug("Face swap image loaded in session");
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdownTimer !== null && countdownTimer > 0) {
      interval = setInterval(() => {
        setCountdownTimer((prev) => {
          if (prev && prev > 1) return prev - 1;
          clearInterval(interval);
          return 0; // 0 means ready
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdownTimer]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function run() {
      setIsLoading(true);
      setError(null);
      setCoverTitle(null);
      pagesRef.current = Array.from({ length: pagesParam }).map((_, i) => ({
        pageNumber: i + 1,
        text: "",
        imagePrompt: "",
      }));
      setStory(null);
      setCountdownTimer(null);

      const currentRefImage = sessionStorage.getItem("faceSwapReferenceImage");
      let title = "";

      const publish = () => {
        setStory({ title, pages: pagesRef.current.map((page) => ({ ...page })) });
      };

      const drawPage = async (pageNumber: number, imagePrompt: string) => {
        const idx = pagesRef.current.findIndex((page) => page.pageNumber === pageNumber);
        if (!imagePrompt || idx < 0) return;
        try {
          const imgRes = await fetch("/api/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imagePrompt,
              referenceImage: currentRefImage || undefined,
            }),
          });
          const imgData = await imgRes.json().catch(() => ({}));
          if (imgRes.ok && imgData.imageUrl) {
            pagesRef.current[idx] = { ...pagesRef.current[idx], imageUrl: imgData.imageUrl };
          } else {
            console.error("Image generation failed for page", pageNumber, imgRes.status);
            pagesRef.current[idx] = { ...pagesRef.current[idx], imagePrompt: "" };
          }
        } catch (err) {
          console.error("Image generation failed for page", pageNumber, err);
          pagesRef.current[idx] = { ...pagesRef.current[idx], imagePrompt: "" };
        }
        publish();
      };

      try {
        for (let start = 1; start <= pagesParam; start += 2) {
          const batchSize = Math.min(2, pagesParam - start + 1);
          const soFar = pagesRef.current
            .filter((page) => page.text)
            .map((page) => page.text)
            .join(" ");

          const res = await fetch("/api/story/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subject: random ? undefined : subject,
              random,
              pages: pagesParam,
              ageRange,
              startPage: start,
              batchSize,
              title: title || undefined,
              soFar: soFar || undefined,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || "Failed to generate story");

          title = data.title || title;
          setCoverTitle(title);
          for (const page of data.pages ?? []) {
            const idx = page.pageNumber - 1;
            if (idx < 0 || idx >= pagesRef.current.length) continue;
            pagesRef.current[idx] = {
              ...pagesRef.current[idx],
              pageNumber: page.pageNumber,
              text: page.text,
              imagePrompt: page.imagePrompt,
            };
          }
          publish();
          if (start === 1) {
            setIsLoading(false);
            setShowReader(true);
          }

          const ready = pagesRef.current.slice(start - 1, start - 1 + batchSize);
          setProgress({ done: start - 1, total: pagesParam });
          await Promise.all(ready.map((page) => drawPage(page.pageNumber, page.imagePrompt)));
          setProgress({ done: start - 1 + batchSize, total: pagesParam });
        }
      } catch (e: unknown) {
        console.debug("Stream ended or failed:", e);
        const msg = e instanceof Error ? e.message : "Something went wrong";

        // Extract wait time if it's a Gemini 429 quota error
        const match = msg.match(/Please retry in ([\d.]+)s/);
        if (match && match[1]) {
          const seconds = Math.ceil(parseFloat(match[1]));
          setCountdownTimer(seconds);
        }

        setError(msg);
        setIsLoading(false);
      }
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <div className="w-full max-w-xl mx-auto mt-6 bg-red-50 p-6 rounded-2xl shadow-sm border border-red-200">
            {countdownTimer !== null ? (
              countdownTimer > 0 ? (
                <div className="text-center font-medium">
                  <div className="text-red-600 mb-2">Google API Rate Limit Reached</div>
                  <div className="text-red-800 flex flex-col items-center">
                    <span className="text-4xl font-black mb-1 tabular-nums animate-pulse">{countdownTimer}</span>
                    <span className="text-sm">seconds remaining before you can generate again</span>
                  </div>
                </div>
              ) : (
                <div className="text-center font-bold text-green-600 text-lg">
                  ✅ Ready to generate!
                </div>
              )
            ) : (
              <div className="text-center text-red-600 font-medium">{error}</div>
            )}
          </div>
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

export default function ReadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-sky-50"><p>Loading...</p></div>}>
      <ReadPageContent />
    </Suspense>
  );
}


