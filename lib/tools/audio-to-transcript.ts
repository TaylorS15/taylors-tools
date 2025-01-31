import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateTranscript(
  audio: File,
  language: string,
): Promise<{ buffer: Buffer; type: string }> {
  try {
    const response = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      prompt: "Separate the audio into full sentences, separarted by \n\n",
      response_format: "srt",
      language: language,
    });

    return {
      buffer: Buffer.from(response),
      type: "text/plain",
    };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to generate transcript");
  }
}
