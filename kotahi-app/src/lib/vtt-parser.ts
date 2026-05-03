import type { TranscriptItem } from "./types";

interface VTTCue {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

// Convert VTT timestamp to seconds
function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseFloat(parts[2].replace(",", "."));

  return hours * 3600 + minutes * 60 + seconds;
}

// Parse VTT file content to transcript items
export function parseVTT(vttContent: string): TranscriptItem[] {
  const lines = vttContent.split("\n");
  const cues: VTTCue[] = [];
  let currentCue: Partial<VTTCue> = {};
  let textLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip WEBVTT header and empty lines
    if (!line || line === "WEBVTT") {
      continue;
    }

    // Check if line is a timestamp
    if (line.includes("-->")) {
      // Save previous cue if exists
      if (currentCue.id && textLines.length > 0) {
        cues.push({
          ...currentCue,
          text: textLines.join(" ").trim(),
        } as VTTCue);
      }

      // Parse timestamp line
      const [startStr, endStr] = line.split("-->").map((s) => s.trim());
      currentCue = {
        startTime: parseTimestamp(startStr),
        endTime: parseTimestamp(endStr),
      };
      textLines = [];
    }
    // Check if line is a cue ID (number)
    else if (/^\d+$/.test(line) && !currentCue.id) {
      currentCue.id = line;
    }
    // Otherwise, it's text content
    else if (line && currentCue.startTime !== undefined) {
      textLines.push(line);
    }
  }

  // Add the last cue
  if (currentCue.id && textLines.length > 0) {
    cues.push({
      ...currentCue,
      text: textLines.join(" ").trim(),
    } as VTTCue);
  }

  // Convert to TranscriptItem format
  return cues.map((cue) => ({
    id: cue.id,
    startTime: cue.startTime,
    endTime: cue.endTime,
    text: cue.text,
  }));
}

// Fetch and parse VTT file
export async function loadVTTTranscript(
  vttUrl: string,
  apiBaseUrl: string,
): Promise<TranscriptItem[]> {
  try {
    const response = await fetch(apiBaseUrl + vttUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch VTT file: ${response.statusText}`);
    }

    const vttContent = await response.text();
    return parseVTT(vttContent);
  } catch (error) {
    console.error("Error loading VTT transcript:", error);
    return [];
  }
}
