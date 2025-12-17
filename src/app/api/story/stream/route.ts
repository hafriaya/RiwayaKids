import { NextResponse } from "next/server";
import { z } from "zod";
import { generateObject } from "ai";
import { openai as openaiProvider } from "@ai-sdk/openai";
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
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
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

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        function send(event: unknown) {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        }

        send({ type: "status", status: "generating_story" });

        try {
          const model = openaiProvider("gpt-4o-mini");
          const topic = random
            ? `Create a random delightful children's story topic suitable for ages ${ageRange}.`
            : `Create a children's story about: ${subject}`;

          // Generate a title immediately for the cover
          const { object: titleObject } = await generateObject({
            model,
            schema: titleSchema,
            prompt:
              `Propose a short, catchy children's book title (max 8 words) for this topic: ${topic}. ` +
              `Return only JSON with a 'title' field.`,
            temperature: 0.7,
          });
          const { title } = titleObject as { title: string };
          send({ type: "cover", title });

          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

          // Generate each page sequentially so text streams quickly
          let completedTexts = 0;
          let pendingImages = 0;
          for (let pageNumber = 1; pageNumber <= pages; pageNumber++) {
            const { object: pageObject } = await generateObject({
              model,
              schema: pageSchema,
              prompt:
                `You are writing page ${pageNumber} of ${pages} for a children's book (ages ${ageRange}). ` +
                `Topic: ${topic}. Style for illustrations: ${style}. ` +
                `Write 1-3 simple sentences in 'text' that advances the story and a concise 'imagePrompt'. ` +
                `Return JSON with pageNumber, text, imagePrompt.`,
              temperature: 0.7,
            });
            const page = pageObject as StoryPage;
            // Ensure pageNumber matches loop
            const safePage = { ...page, pageNumber } as StoryPage;
            send({ type: "page_text", page: safePage });
            completedTexts += 1;
            send({ type: "progress", done: completedTexts, total: pages });

            // Image generation in background
            pendingImages += 1;
            (async () => {
              try {
                const imagePrompt = `${safePage.imagePrompt}. Style: ${style}. Friendly, age-appropriate.`;
                console.log(`Generating image for page ${pageNumber}...`);
                const img = await openai.images.generate({
                  model: "gpt-image-1",
                  prompt: imagePrompt,
                  size: "1024x1024",
                  response_format: "b64_json",
                });
                const b64 = img.data?.[0]?.b64_json;
                const imageUrl = b64 ? `data:image/png;base64,${b64}` : undefined;
                send({ type: "page_image", pageNumber, imageUrl });
              } catch (e: any) {
                console.error(`Image Error (Page ${pageNumber}):`, e?.message || e);
                send({ type: "page_image_error", pageNumber, error: e?.message || "Image error" });
              } finally {
                pendingImages -= 1;
                if (pendingImages === 0 && completedTexts === pages) {
                  send({ type: "done" });
                  controller.close();
                }
              }
            })();
          }

          // If there are no images pending (unlikely), finish
          if (pendingImages === 0 && completedTexts === pages) {
            send({ type: "done" });
            controller.close();
          }
        } catch (e: any) {
          send({ type: "error", error: e?.message || "Unknown error" });
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


