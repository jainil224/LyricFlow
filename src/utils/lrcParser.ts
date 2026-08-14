export interface ParsedLyricLine {
  time: number;
  text: string;
}

/**
 * Lightweight LRC format parser
 * Converts LRC formatted strings like "[01:23.45] Lyric text line"
 * into an array of { time: number, text: string } sorted by timestamp.
 */
export function parseLRC(lrcContent: string): ParsedLyricLine[] {
  if (!lrcContent) return [];

  const lines = lrcContent.split('\n');
  const result: ParsedLyricLine[] = [];
  const lrcRegex = /\[(\d+):(\d+(?:\.\d+)?)\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let match: RegExpExecArray | null;
    lrcRegex.lastIndex = 0;

    const matches: number[] = [];
    let text = trimmed;

    while ((match = lrcRegex.exec(trimmed)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseFloat(match[2]);
      const time = minutes * 60 + seconds;
      matches.push(time);
      text = text.replace(match[0], '');
    }

    text = text.trim();
    if (text && matches.length > 0) {
      for (const time of matches) {
        result.push({ time, text });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}
