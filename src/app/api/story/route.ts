import { z } from "zod";
import OpenAI from "openai";
import { generateObject } from "ai";
import { openai as openaiProvider } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";

import { GenerateStoryRequest, GenerateStoryResponse, StoryPage } from "@/lib/types";

const requestSchema = z.object({
  subject: z.string().optional(),
  random: z.boolean().optional(),
  pages: z.number().min(10).max(16).optional(),
  ageRange: z.string().optional(),
  style: z.string().optional(),
});

const storySchema = z.object({
  title: z.string(),
  pages: z
    .array(
      z.object({
        pageNumber: z.number(),
        text: z.string(),
        imagePrompt: z.string(),
      })
    )
    .min(10)
    .max(16),
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const json = await req.json();
    const parsed = requestSchema.safeParse(json as GenerateStoryRequest);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      subject,
      random = false,
      pages = 10,
      ageRange = "4-7",
      style = "bright, colorful, watercolor children's book style, soft lighting",
    } = parsed.data;

    let effectiveSubject = subject;
    if (random || !subject) {
      const chat = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.9 });
      const ai = await chat.invoke([
        {
          role: "system",
          content:
            "You suggest concise, wholesome children's story subjects suitable for ages " +
            ageRange +
            ". Respond with 5-10 words and no punctuation except spaces.",
        },
        { role: "user", content: "Give me a random subject." },
      ] as any);
      effectiveSubject = String((ai as any).content ?? "A joyful forest picnic with animal friends").trim();
    }

    const storyTopic = `Create a children's story about: ${effectiveSubject}`;

    const model = openaiProvider("gpt-4o-mini");

    const { object } = await generateObject({
      model,
      schema: storySchema,
      prompt:
        `You are a caring children's storyteller. Write a short illustrated story split into ${pages} pages for ages ${ageRange}. ` +
        `Each page should advance the plot with 1-3 simple sentences. ` +
        `Return only JSON matching the given schema. ` +
        `For each page include an imagePrompt describing an illustration in ${style}. ` +
        `Topic: ${storyTopic}`,
      temperature: 0.7,
    });

    const story = object as unknown as GenerateStoryResponse;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const pagesWithImages: StoryPage[] = await Promise.all(
      story.pages.map(async (p) => {
        const imagePrompt = `${p.imagePrompt}. Style: ${style}. Friendly, age-appropriate.`;
        const img = await openai.images.generate({
          model: "gpt-image-1",
          prompt: imagePrompt,
          size: "1024x1024",
        });
        const b64 = img.data?.[0]?.b64_json;
        const imageUrl = b64 ? `data:image/png;base64,${b64}` : undefined;
        return { ...p, imageUrl };
      })
    );

    const response: GenerateStoryResponse = {
      title: story.title,
      pages: pagesWithImages,
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const runtime = "nodejs";


