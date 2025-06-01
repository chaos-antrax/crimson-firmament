export async function POST(request: Request) {
  try {
    const { text, contexts } = await request.json()

    const ollamaModel = process.env.OLLAMA_MODEL || "deepseek-r1:8b"

    // Create a single, comprehensive prompt
    const contextSection =
      Object.keys(contexts || {}).length > 0
        ? `Follow this Context/Glossary for consistent translation:
${Object.entries(contexts)
  .map(([chinese, english]) => `${chinese} → ${english}`)
  .join("\n")}`
        : ""

    const fullPrompt = `${contextSection}Translate the following Chinese text to English. 

IMPORTANT: Reply with ONLY the translated english text. Do not include any explanations, confirmations, or conversational elements. Maintain the original paragraph structure and formatting.

Text to translate:
${text}`

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }

    const data = await response.json()

    // Clean up the response to ensure it's just the translation
    let translation = data.response || "Translation failed"

    // Remove any <Thinking></Thinking> tags and their content (case insensitive)
    translation = translation.replace(/<Thinking>[\s\S]*?<\/thinking>/gi, "")

    // Remove any <Thinking></Thinking> tags and their content (case insensitive)
    translation = translation.replace(/<Thinking>[\s\S]*?<\/think>/gi, "")
    translation = translation.replace(/<Thinking>[\s\S]*?<\/thinking>/gi, "")

    // Remove any <Thinking></Thinking> tags and their content (case insensitive)
    translation = translation.replace(/<think>[\s\S]*?<\/think>/gi, "")
    translation = translation.replace(/<think>[\s\S]*?<\/think>/gi, "")

    // Remove any conversational elements that might appear
    translation = translation
      .replace(/^.*?(?:I will|I'll).*?(?:translate|use|context).*?\n*/gi, "")
      .replace(/^.*?(?:Here is|Here's).*?translation.*?\n*/gi, "")
      .replace(/^.*?(?:Using|Based on).*?context.*?\n*/gi, "")
      .replace(/^.*?(?:The translation is|Translation:).*?\n*/gi, "")
      .replace(/^.*?(?:Below is|Following is).*?translation.*?\n*/gi, "")
      .trim()

    return Response.json({
      translation: translation,
    })
  } catch (error) {
    console.error("Translation error:", error)
    return Response.json({ error: "Translation failed" }, { status: 500 })
  }
}
