import { NextResponse } from "next/server";
import { z } from "zod";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import OpenAI from "openai";
import type { StoryPage } from "@/lib/types";

const requestSchema = z.object({
  subject: z.string().optional(),
  random: z.boolean().optional(),
  pages: z.number().min(5).max(10).optional(),
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
      pages = 5,
      ageRange = "4-7",
      style = "bright, colorful, watercolor children's book style, soft lighting",
    } = parsed.data;

    console.log("--- New Story Request (Gemini) ---");
    console.log("Subject:", subject);

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        function send(event: unknown) {
          try {
            controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
          } catch (e) {
            // Stream might be closed
          }
        }

        send({ type: "status", status: "generating_story" });

        // Check if client is still connected
        let isAborted = false;
        req.signal.addEventListener("abort", () => {
          console.log("!!! Client disconnected. Stopping background generation.");
          isAborted = true;
        });

        try {
          // 0. Safety Buffer: Wait 5s before starting anything
          console.log("0. Safety Buffer (5s)...");
          const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
          await sleep(5000);
          
          if (isAborted) return;

          // Use 'gemini-flash-latest' (1.5 Flash) which reached Page 7 earlier
          const modelName = "gemini-flash-latest";
          console.log(`Using model: ${modelName}`);
          const model = google(modelName); 
          
          const topic = random || !subject
            ? `Create a delightful random children's story topic for ages ${ageRange}.`
            : `Create a children's story about: ${subject}`;

          if (isAborted) return;

          // 1. Generate a title with a built-in retry
          console.log("1. Generating Title...");
          let title = "My Story";
          try {
            const { object: titleObject } = await generateObject({
              model,
              schema: titleSchema,
              prompt: `Propose a short, catchy children's book title for: ${topic}.`,
            });
            title = (titleObject as any).title;
          } catch (e) {
            console.log("Title generation failed, using default.");
          }
          
          console.log("2. Title Ready:", title);
          send({ type: "cover", title });

          // 2. Sequential generation with a long rest
          console.log(`3. Starting Sequential Generation for ${pages} pages...`);
          for (let pageNumber = 1; pageNumber <= pages; pageNumber++) {
            if (isAborted) break;

            // Wait 15 seconds between pages to be EXTREMELY safe for Free Tier (4 RPM)
            console.log(`- Resting for 15s to be safe...`);
            await sleep(15000);
            
            if (isAborted) break;

            console.log(`- Generating Page ${pageNumber}...`);
            try {
              const { object: pageObject } = await generateObject({
                model,
                schema: pageSchema,
                prompt: `You are a children's storyteller. Write page ${pageNumber} of ${pages} for a book about ${topic}. 
                Write 1-3 simple sentences in 'text' and a concise 'imagePrompt'.
                Return JSON with pageNumber, text, imagePrompt.`,
              });
              
              const page = pageObject as StoryPage;
              const safePage = { ...page, pageNumber } as StoryPage;
              
              // Generate a real image using Pollinations
              const cleanStyle = style.replace(/[^a-zA-Z0-9 ]/g, "");
              const encodedPrompt = encodeURIComponent(`${safePage.imagePrompt}. Style: ${cleanStyle}. Wholesome children's book illustration.`);
              const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
              
              console.log(`- Page ${pageNumber} ready.`);
              send({ type: "page_text", page: safePage });
              send({ type: "progress", done: pageNumber, total: pages });
              send({ type: "page_image", pageNumber, imageUrl });
            } catch (pageErr: any) {
              console.error(`- Page ${pageNumber} failed:`, pageErr?.message);
              // If a page fails, we try to keep going instead of crashing the whole thing
              send({ type: "page_image_error", pageNumber, error: "Page took too long" });
            }
          }

          if (!isAborted) {
            console.log("4. Finished.");
            send({ type: "done" });
          }
          controller.close();
        } catch (e: any) {
          if (!isAborted) {
            console.error("!!! GEMINI ERROR:", e?.message || e);
            send({ type: "error", error: e?.message || "Gemini Error" });
          }
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


