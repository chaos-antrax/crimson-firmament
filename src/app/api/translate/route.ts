export async function POST(request: Request) {
  try {
    const { text, contexts } = await request.json()

    const ollamaModel = process.env.OLLAMA_MODEL || "llama3.2"

    const contextPrompt =
      Object.keys(contexts || {}).length > 0
        ? `\n\nPlease use these consistent translations:\n${Object.entries(contexts)
            .map(([chinese, english]) => `${chinese} = ${english}`)
            .join("\n")}\n`
        : ""

    const prompt = `Translate the following Chinese text to English. Maintain the original formatting and paragraph structure.${contextPrompt}\n\nText to translate:\n${text}`

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: prompt,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }

    const data = await response.json()

    return Response.json({
      translation: data.response || "Translation failed",
    })
  } catch (error) {
    console.error("Translation error:", error)
    return Response.json({ error: "Translation failed" }, { status: 500 })
  }
}
