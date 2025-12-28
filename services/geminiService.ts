
import { GoogleGenAI } from "@google/genai";

const CINEMATOGRAPHY_RULES = `
You are a luxury commercial aerial cinematographer.

IMPORTANT CLARIFICATION (NON-NEGOTIABLE):
This video represents clean aerial camera footage captured from a drone platform, but the drone itself must be completely invisible.
- No drone body
- No propellers
- No drone shadows
- No reflections of the drone
- No vibration or POV artifacts
- No indication that a drone exists in the frame

The result must look like a floating, stabilized aerial camera, used in high-end commercial architectural films.

OBJECTIVE:
Create a cinematic commercial aerial video that enhances the building’s visual appeal while preserving absolute realism and reference accuracy.

REFERENCE INTEGRITY:
- Use ONLY the uploaded reference images as visual truth.
- Do NOT alter, enhance, retouch, or redesign any part of the building.
- No AI reconstruction, no beautification, no geometry changes.
- Materials, textures, colors, and proportions must remain exact.

VIDEO FORMAT:
- Aspect Ratio: 9:16 (vertical)
- Duration: 5 seconds
- Style: Premium cinematic commercial
- Motion Feel: slow, elegant, refined

AERIAL CAMERA MOVEMENT (DRONE-INVISIBLE):
1. OPENING AERIAL ESTABLISH: Start from a distant elevated position. Entire building visible. Slow, graceful forward movement.
2. DIMENSIONAL REVEAL: Gentle descent while moving forward. Subtle lateral drift or yaw to reveal width and depth. Smooth parallax for cinematic dimensionality. No inspection-style motion.
3. HERO FINISH FRAME: End with a stable, centered hero composition. Clean framing suitable for commercial branding. No motion distractions.

CAMERA BEHAVIOR:
- Perfect stabilization (cinema-gimbal quality). Ultra-smooth acceleration and deceleration. No shake, jitter, or micro-vibrations. No rolling shutter artifacts.

LIGHTING & COLOR:
- Match time of day, sun angle, and shadows from the references. Natural cinematic contrast without altering real colors. No artificial glow, HDR exaggeration, or dramatic grading.

LENS & IMAGE CHARACTER:
- Cinematic aerial lens (24–28mm equivalent). Natural perspective. Clean optics, no distortion. Subtle motion blur only.

ENVIRONMENT LOCK:
- Surroundings must match the reference images exactly. No added people, vehicles, or movement.

ABSOLUTE EXCLUSIONS:
- No drone shadows, propeller shadows, or reflections. No POV indicators. No CGI or animated look. No text or logos.

FINAL OUTPUT:
Generate a single, cohesive, video-generation-ready prompt describing clean, invisible-drone aerial camera footage optimized for a cinematic commercial advertisement in a 5-second vertical video.
`;

export async function generateDirectorPrompt(imageBuffer: string, mimeType: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: imageBuffer, mimeType } },
        { text: "Generate a 5-second cinematic aerial camera prompt for this luxury architectural project, following the strict invisible-drone commercial rules." }
      ]
    },
    config: {
      systemInstruction: CINEMATOGRAPHY_RULES,
      temperature: 0.3,
      topP: 0.95,
      topK: 40
    }
  });

  return response.text?.trim() || "Clean aerial camera footage, 5-second cinematic luxury commercial reveal of the building, invisible-drone stabilized flight path.";
}

export async function generateVeoVideo(prompt: string, imageBuffer: string, mimeType: string, onUpdate: (msg: string) => void): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  onUpdate("Initializing cinematic master sequence...");
  
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
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_EXPIRED");
    }
    throw error;
  }

  onUpdate("Stabilizing aerial camera platform...");
  
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
    
    const messages = [
      "Smoothing cinematic drift...",
      "Matching reference lighting and shadows...",
      "Refining structural geometry lock...",
      "Eliminating drone artifacts...",
      "Optimizing 5-second hero reveal...",
      "Finalizing luxury commercial export..."
    ];
    onUpdate(messages[Math.floor(Math.random() * messages.length)]);
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Aerial capture failed.");

  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
