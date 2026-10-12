import { NextResponse } from "next/server";
import { z } from "zod";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

const requestSchema = z.object({
  subject: z.string().optional(),
  random: z.boolean().optional(),
  pages: z.number().min(5).max(10).optional(),
  ageRange: z.string().optional(),
  style: z.string().optional(),
  startPage: z.number().min(1).max(10).optional(),
  batchSize: z.number().min(1).max(2).optional(),
  title: z.string().optional(),
  soFar: z.string().optional(),
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
      startPage = 1,
      batchSize,
      title,
      soFar,
    } = parsed.data;

    const count = batchSize ?? pages;
    const endPage = Math.min(pages, startPage + count - 1);

    console.log(`--- Story pages ${startPage}-${endPage} of ${pages} ---`);
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
      prompt: `You are a children's storyteller for ages ${ageRange}.
      ${topic}
      The finished book has ${pages} pages. Write only pages ${startPage} to ${endPage}.
      ${title ? `Keep this title: ${title}.` : "Invent one warm, short title."}
      ${soFar ? `Story so far: ${soFar}` : "This is the beginning."}
      Each page needs 1-2 simple, happy sentences in 'text'.
      imagePrompt must describe a bright, cute, sunny picture-book scene: pastel colors, smiles, soft shapes, daytime. No darkness, monsters, or scary faces.
      Number the pages strictly from ${startPage} to ${endPage}.`,
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


