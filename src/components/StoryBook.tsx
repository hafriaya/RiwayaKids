"use client";

import dynamic from "next/dynamic";
import React from "react";
import type { StoryPage } from "@/lib/types";

// react-pageflip uses window, so we disable SSR
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HTMLFlipBook = dynamic(() => import("react-pageflip"), { ssr: false }) as unknown as React.ComponentType<any>;

type StoryBookProps = {
  title: string;
  pages: StoryPage[];
};

export function StoryBook({ title, pages }: StoryBookProps) {
  return (
    <div className="w-full flex flex-col items-center">
      <h3 className="text-2xl md:text-3xl font-bold text-blue-800 mb-4 text-center">{title}</h3>
      <div className="w-full flex justify-center">
        {/* Remount flipbook when page count changes to avoid internal DOM insertBefore errors */}
        <HTMLFlipBook key={pages.length} width={420} height={560} size="stretch" minWidth={300} maxWidth={800} minHeight={400} maxHeight={1000} className="shadow-2xl rounded-lg overflow-hidden bg-white">
          {pages.map((p) => (
            <div key={p.pageNumber} className="p-4 flex flex-col items-center justify-start bg-white h-full">
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt={`Page ${p.pageNumber}`} className="w-full h-72 object-cover rounded-md mb-4 border border-sky-100" />
              ) : p.imagePrompt ? (
                <div className="w-full h-72 bg-sky-50 rounded-md mb-4 border border-sky-100 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                  <div className="w-10 h-10 border-4 border-sky-300 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <span className="text-sky-600 font-medium">Drawing illustration...</span>
                </div>
              ) : (
                <div className="w-full h-72 bg-sky-50 rounded-md mb-4 border border-sky-100 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                  <span className="text-sky-400 font-medium">{p.text ? "Illustration unavailable" : "Waiting for story..."}</span>
                </div>
              )}
              {p.text ? (
                <p className="text-blue-900 text-base leading-relaxed whitespace-pre-wrap">{p.text}</p>
              ) : (
                <div className="w-full space-y-2 mt-4 mb-2 flex-grow">
                  <div className="h-4 bg-sky-100 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-sky-100 rounded w-5/6 animate-pulse"></div>
                  <div className="h-4 bg-sky-100 rounded w-4/6 animate-pulse"></div>
                </div>
              )}
              <div className="mt-auto pt-4 text-sm text-blue-400">Page {p.pageNumber}</div>
            </div>
          ))}
          {/* End page */}
          <div className="p-4 flex flex-col items-center justify-center bg-white">
            <div className="w-full h-72 bg-gradient-to-br from-sky-100 to-purple-100 rounded-md mb-6 border border-sky-100 flex items-center justify-center text-blue-500 font-semibold">
              The End
            </div>
            <p className="text-blue-900 text-base text-center">Thanks for reading!</p>
          </div>
        </HTMLFlipBook>
      </div>
    </div>
  );
}
