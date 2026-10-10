import { NextResponse } from "next/server";
import { z } from "zod";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import type { StoryPage } from "@/lib/types";

const requestSchema = z.object({
  subject: z.string().optional(),
  random: z.boolean().optional(),
  pages: z.number().min(5).max(10).optional(),
  ageRange: z.string().optional(),
  style: z.string().optional(),
});

const storySchema = z.object({
  title: z.string(),
  pages: z.array(z.object({
    pageNumber: z.number(),
    text: z.string(),
    imagePrompt: z.string(),
  }))
});

export async function POST(req: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json({ error: "Missing GOOGLE_GENERATIVE_AI_API_KEY" }, { status: 500 });
  }

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
    } = parsed.data;

    console.log(`--- New Batch Story Request (${pages} pages) ---`);
    console.log("Subject:", subject);

    const modelName = "gemini-2.5-flash";
    const model = google(modelName);

    const topic = random || !subject
      ? `Create a delightful random children's story topic for ages ${ageRange}.`
      : `Create a children's story about: ${subject}`;

    console.log("Generating Title and Pages...");

    const { object: storyObject } = await generateObject({
      model,
      schema: storySchema,
      maxRetries: 0,
      prompt: `You are a children's storyteller. Write a ${pages}-page book about ${topic}. 
      For each page, write 1-3 simple sentences in 'text' and a concise descriptive 'imagePrompt'.
      Return a catchy title and an array of pages numbered strictly 1 to ${pages}.`,
    });
    console.log("Generation Complete!");

    return NextResponse.json(storyObject);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("!!! GEMINI ERROR:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


