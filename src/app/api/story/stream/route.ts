import { NextResponse } from "next/server";
import { z } from "zod";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import OpenAI from "openai";
import type { StoryPage } from "@/lib/types";

const requestSchema = z.object({
  subject: z.string().optional(),
  random: z.boolean().optional(),
  pages: z.number().min(10).max(16).optional(),
  ageRange: z.string().optional(),
  style: z.string().optional(),
});

const titleSchema = z.object({ title: z.string() });
const pageSchema = z.object({
  pageNumber: z.number(),
  text: z.string(),
  imagePrompt: z.string(),
});

export async function POST(req: Request) {
  // Check for Gemini Key
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json({ error: "Missing GOOGLE_GENERATIVE_AI_API_KEY" }, { status: 500 });
  }

  const encoder = new TextEncoder();
  const headers = new Headers({
    "Content-Type": "application/x-ndjson; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const {
      subject,
      random = false,
      pages = 10,
      ageRange = "4-7",
      style = "bright, colorful, watercolor children's book style, soft lighting",
    } = parsed.data;

    console.log("--- New Story Request (Gemini) ---");
    console.log("Subject:", subject);

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        function send(event: unknown) {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        }

        send({ type: "status", status: "generating_story" });

        try {
          // Switch to the 'Lite' model which usually has higher free tier limits
          const modelName = "gemini-flash-lite-latest";
          console.log(`Using model: ${modelName}`);
          const model = google(modelName); 
          
          const topic = random || !subject
            ? `Create a delightful random children's story topic for ages ${ageRange}.`
            : `Create a children's story about: ${subject}`;

          console.log("Topic used:", topic);

          // 1. Generate a title
          console.log("1. Generating Title...");
          const { object: titleObject } = await generateObject({
            model,
            schema: titleSchema,
            prompt: `Propose a short children's book title for: ${topic}.`,
          });
          const { title } = titleObject as { title: string };
          console.log("2. Title Generated:", title);
          send({ type: "cover", title });

          // Helper to wait between requests
          const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

          // 2. Sequential generation with a longer rest for the 5 RPM limit
          console.log(`3. Starting Sequential Generation for ${pages} pages...`);
          for (let pageNumber = 1; pageNumber <= pages; pageNumber++) {
            // Wait 12 seconds to perfectly stay under a 5 requests per minute limit
            // (60 seconds / 5 = 12 seconds per request)
            console.log(`- Resting for 12s to respect API limits...`);
            await sleep(12000);
            
            console.log(`- Generating Page ${pageNumber}...`);
            const { object: pageObject } = await generateObject({
              model,
              schema: pageSchema,
              prompt: `You are a children's storyteller. Write page ${pageNumber} of ${pages} for a book about ${topic}. 
              Write 1-3 simple sentences in 'text' and a concise 'imagePrompt'.
              Return JSON with pageNumber, text, imagePrompt.`,
            });
            const page = pageObject as StoryPage;
            const safePage = { ...page, pageNumber } as StoryPage;
            send({ type: "page_text", page: safePage });
            send({ type: "progress", done: pageNumber, total: pages });
            
            // Placeholder image
            send({ type: "page_image", pageNumber, imageUrl: `https://placehold.co/1024x1024/sky/white?text=Page+${pageNumber}` });
          }

          console.log("4. All pages finished.");
            send({ type: "done" });
            controller.close();
        } catch (e: any) {
          console.error("!!! GEMINI ERROR:", e?.message || e);
          send({ type: "error", error: e?.message || "Gemini Error" });
          controller.close();
        }
      },
    });

    return new Response(stream, { headers });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


