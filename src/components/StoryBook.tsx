"use client";

import dynamic from "next/dynamic";
import React from "react";
import type { StoryPage } from "@/lib/types";

// react-pageflip uses window, so we disable SSR
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
            <div key={p.pageNumber} className="p-4 flex flex-col items-center justify-start bg-white">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={`Page ${p.pageNumber}`} className="w-full h-72 object-cover rounded-md mb-4 border border-sky-100" />
              ) : (
                <div className="w-full h-72 bg-sky-50 rounded-md mb-4 border border-sky-100 flex items-center justify-center text-sky-400">Illustration</div>
              )}
              <p className="text-blue-900 text-base leading-relaxed whitespace-pre-wrap">{p.text}</p>
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
