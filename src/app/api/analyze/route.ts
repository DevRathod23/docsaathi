import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, language } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${process.env.LLAMA_API_KEY}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
  model: "llama-3.3-70b-versatile",

  messages: [
    {
      role: "system",

      content: `
You are DocSaathi AI.

Analyze the document and return response ONLY in this format:

SUMMARY:
- point
- point

IMPORTANT POINTS:
- point
- point

KEY DETAILS:
- point
- point

Use simple English language.
`,
    },

    {
      role: "user",
      content: text,
    },
  ],

  temperature: 0.3,
}),
      }
    );

    const data = await response.json();

    console.log("GROQ RESPONSE:", data);

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "Groq API request failed",
        },
        { status: 500 }
      );
    }

    const result =
      data?.choices?.[0]?.message?.content;

    if (!result) {
      return NextResponse.json(
        {
          error: "No result returned from AI",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      result,
    });
  } catch (error) {
    console.error("API ERROR:", error);

    return NextResponse.json(
      {
        error: "Unable to analyze the document.",
      },
      { status: 500 }
    );
  }
}