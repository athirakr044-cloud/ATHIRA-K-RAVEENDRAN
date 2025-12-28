
import { GoogleGenAI } from "@google/genai";

const CINEMATOGRAPHY_RULES = `
You are a senior aerial cinematographer and commercial drone director.
Analyze the provided image and generate a professional, ultra-realistic drone-shot video description.

VIDEO FORMAT: Aspect Ratio 9:16 (vertical), Duration 6-8s, Real-world commercial drone footage.
CAMERA BEHAVIOR: Mounted on professional drone gimbal, smooth stabilized motion, realistic physics (acceleration/deceleration), natural yaw/tilt/roll, accurate parallax.
DRONE SEQUENCE:
1. Begin with wide aerial establishing shot matching reference.
2. Slowly move forward while gently descending.
3. Perform a smooth cinematic orbit or lateral pass.
4. Finish with a controlled push-in or upward pull-away.
ENVIRONMENT LOCK: Use ONLY visible elements. Do NOT hallucinate. Exact spatial layout, scale, perspective, weather, and shadows.
LIGHTING: Match reference exactly. Natural cinematic contrast.
LENS: 24-28mm aerial equivalent.

OUTPUT: Return ONLY a clean, detailed, single cohesive cinematic description suitable for Google Veo.
`;

export async function generateDirectorPrompt(imageBuffer: string, mimeType: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Refactor: use systemInstruction in config as per guidelines for complex prompt rules.
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: imageBuffer, mimeType } }
      ]
    },
    config: {
      systemInstruction: CINEMATOGRAPHY_RULES,
      temperature: 0.7,
      topP: 0.95,
      topK: 40
    }
  });

  // Correct extraction: use .text property as per guidelines.
  return response.text?.trim() || "A professional cinematic drone shot of the scene.";
}

export async function generateVeoVideo(prompt: string, imageBuffer: string, mimeType: string, onUpdate: (msg: string) => void): Promise<string> {
  // Always create a new instance to ensure latest API key before making the call.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  onUpdate("Initializing cinematic sequence...");
  
  let operation;
  try {
    operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: {
        imageBytes: imageBuffer,
        mimeType: mimeType,
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16'
      }
    });
  } catch (error: any) {
    // Graceful error handling for expired or invalid API keys.
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_EXPIRED");
    }
    throw error;
  }

  onUpdate("Aerial drone in flight... framing the shot.");
  
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 8000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
    
    // Rotation of immersive messages to improve UX during long waits.
    const messages = [
      "Stabilizing gimbal trajectory...",
      "Adjusting aperture for natural lighting...",
      "Calculating parallax between layers...",
      "Rendering cinematic motion blur...",
      "Ensuring fluid drone physics...",
      "Finalizing commercial-grade output..."
    ];
    onUpdate(messages[Math.floor(Math.random() * messages.length)]);
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed to return a URI.");

  // Append API key when fetching from the download link as per Veo requirements.
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
