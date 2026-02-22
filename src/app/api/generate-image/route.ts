import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

export async function POST(req: Request) {
    try {
        const { imagePrompt, referenceImage } = await req.json();

        if (!imagePrompt || !referenceImage) {
            return NextResponse.json({ error: "Missing imagePrompt or referenceImage" }, { status: 400 });
        }

        // Call fal.ai face swap model (flux-pulid)
        // Documentation: https://fal.ai/models/fal-ai/flux-pulid
        const result: any = await fal.subscribe("fal-ai/flux-pulid", {
            input: {
                prompt: imagePrompt + " Wholesome high quality children's book illustration style.",
                reference_image_url: referenceImage,
            },
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                    update.logs.map((log) => log.message).forEach(console.log);
                }
            },
        });

        const imageUrl = result?.data?.images?.[0]?.url || result?.data?.image?.url;

        if (imageUrl) {
            return NextResponse.json({ imageUrl });
        } else {
            console.error("Unexpected fal.ai output format:", result.data);
            throw new Error("Invalid response format from fal.ai");
        }

    } catch (error: any) {
        console.error("FAL AI ERROR: ", error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
