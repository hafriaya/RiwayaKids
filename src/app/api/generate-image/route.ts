import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import Replicate from "replicate";

let skipFalUntil = 0;
let skipReplicateUntil = 0;

const CLIENT_ERROR = "Couldn't draw this picture.";

function falBillingLocked(error: { status?: number; body?: unknown; message?: string }) {
    const detail = JSON.stringify(error?.body ?? error?.message ?? "");
    return error?.status === 403 && /Exhausted balance|User is locked/i.test(detail);
}

function firstUrl(output: unknown): string | undefined {
    if (typeof output === "string" && output.startsWith("http")) return output;
    if (Array.isArray(output)) return firstUrl(output[0]);
    if (output && typeof output === "object" && "url" in output) {
        const url = (output as { url: unknown }).url;
        if (typeof url === "function") return String(url());
        if (typeof url === "string") return url;
    }
    return undefined;
}

async function generateWithReplicate(prompt: string, referenceImage?: string) {
    if (!process.env.REPLICATE_API_TOKEN) {
        throw new Error("Missing REPLICATE_API_TOKEN");
    }

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    const scene = `${prompt}. Wholesome children's book illustration, soft painted style, no text.`;

    const output = referenceImage
        ? await replicate.run("bytedance/flux-pulid", {
            input: {
                main_face_image: referenceImage,
                prompt: scene,
                negative_prompt: "text, letters, watermark, signature, scary, extra limbs",
                width: 1024,
                height: 1024,
                num_steps: 12,
                start_step: 2,
                num_outputs: 1,
                output_format: "webp",
            },
        })
        : await replicate.run("black-forest-labs/flux-schnell", {
            input: {
                prompt: scene,
                num_outputs: 1,
                aspect_ratio: "1:1",
                output_format: "webp",
                go_fast: true,
            },
        });

    const imageUrl = firstUrl(output);
    if (!imageUrl) throw new Error("Replicate returned no image");
    return imageUrl;
}

function kidsPrompt(scene: string) {
    const cleaned = scene
        .replace(/\b(dark|scary|horror|creepy|nightmare|blood|monster|skull|gothic|shadowy|gloomy|terrifying|scream|weapon|demon|ghost|frightening)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();

    return [
        "cute pastel children's picture book for a little kid,",
        "soft rounded shapes, warm sunlight, bright happy colors,",
        "gentle smile, cozy and safe, simple storybook watercolor.",
        `Scene: ${cleaned.slice(0, 450)}`,
        "### scary, horror, creepy, dark, nightmare, blood, monster, skull, sharp teeth, realistic, photorealistic, gloomy, gothic, angry, weapon, violence, text, letters, watermark, deformed",
    ].join(" ");
}

async function generateWithHorde(prompt: string) {
    const submit = await fetch("https://stablehorde.net/api/v2/generate/async", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            apikey: "0000000000",
            "Client-Agent": "riwaya-kids:0.1:local",
        },
        body: JSON.stringify({
            prompt: kidsPrompt(prompt),
            params: {
                width: 512,
                height: 512,
                steps: 12,
                n: 1,
                sampler_name: "k_euler",
            },
            nsfw: false,
            censor_nsfw: true,
            r2: true,
        }),
    });

    if (!submit.ok) throw new Error(`Horde submit failed (${submit.status})`);
    const { id } = await submit.json();
    if (!id) throw new Error("Horde did not return a job id");

    const started = Date.now();
    while (Date.now() - started < 90_000) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const statusRes = await fetch(`https://stablehorde.net/api/v2/generate/status/${id}`, {
            headers: { "Client-Agent": "riwaya-kids:0.1:local" },
        });
        if (!statusRes.ok) continue;

        const status = await statusRes.json();
        if (status.faulted) throw new Error("Horde job faulted");
        if (!status.done) continue;

        const generation = status.generations?.[0];
        if (!generation?.img || generation.censored) throw new Error("Horde returned no image");
        return generation.img as string;
    }

    throw new Error("Horde timed out");
}

export async function POST(req: Request) {
    try {
        const { imagePrompt, referenceImage } = await req.json();

        if (!imagePrompt || typeof imagePrompt !== "string") {
            return NextResponse.json({ error: "Missing a picture description." }, { status: 400 });
        }

        const photo = typeof referenceImage === "string" && referenceImage.length > 0 ? referenceImage : undefined;

        if (photo && Date.now() > skipFalUntil && process.env.FAL_KEY) {
            try {
                fal.config({ credentials: process.env.FAL_KEY });
                const result = await fal.subscribe("fal-ai/flux-pulid", {
                    input: {
                        prompt: `${imagePrompt} Wholesome high quality children's book illustration style.`,
                        reference_image_url: photo,
                    },
                });
                const imageUrl = result?.data?.images?.[0]?.url || result?.data?.image?.url;
                if (imageUrl) return NextResponse.json({ imageUrl, provider: "fal" });
            } catch (error: unknown) {
                const falError = error as { status?: number; body?: unknown; message?: string };
                if (falBillingLocked(falError)) skipFalUntil = Date.now() + 10 * 60 * 1000;
                console.error("FAL AI ERROR:", falError.status, falError.body ?? falError.message);
            }
        }

        if (Date.now() > skipReplicateUntil && process.env.REPLICATE_API_TOKEN) {
            try {
                const imageUrl = await generateWithReplicate(imagePrompt, photo);
                return NextResponse.json({ imageUrl, provider: "replicate" });
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Replicate failed";
                if (/insufficient credit|payment required|too many requests|throttled/i.test(message)) {
                    skipReplicateUntil = Date.now() + 10 * 60 * 1000;
                }
                console.error("REPLICATE ERROR:", message);
            }
        }

        const imageUrl = await generateWithHorde(imagePrompt);
        return NextResponse.json({ imageUrl, provider: "horde" });
    } catch (error: unknown) {
        console.error("IMAGE ERROR:", error instanceof Error ? error.message : error);
        return NextResponse.json({ error: CLIENT_ERROR }, { status: 500 });
    }
}
