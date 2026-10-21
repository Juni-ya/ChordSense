const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const NOTE_TO_INDEX: Record<string, number> = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11,
};

export function transposeChord(chord: string, semitones: number): string {
  if (!chord || chord === 'N.C.' || chord === 'NC') return chord;
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;
  const root = match[1];
  const quality = match[2] || '';
  const idx = NOTE_TO_INDEX[root];
  if (idx === undefined) return chord;
  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  const standardQuality = quality.toLowerCase().startsWith('m') && !quality.toLowerCase().startsWith('maj') ? 'm' : '';
  return NOTES_SHARP[newIdx] + standardQuality;
}

export function standardizeChord(chord: string): string {
  return transposeChord(chord, 0);
}

export interface TabGrounding {
  artist: string;
  song: string;
  key?: string;
  capo?: number;
  tuning?: string;
  leadSheet?: string;
  verifiedChords?: string[];
}

/**
 * Cleans track titles from YouTube by removing video markers,
 * audio markers, and extraneous tags.
 */
function cleanSongTitle(rawTitle: string): string {
  return rawTitle
    .replace(/\(Official\s+(?:Music\s+)?Video\)/gi, '')
    .replace(/\[Official\s+(?:Music\s+)?Video\]/gi, '')
    .replace(/\(Official\s+Audio\)/gi, '')
    .replace(/\[Official\s+Audio\]/gi, '')
    .replace(/\(Official\s+Lyric\s+Video\)/gi, '')
    .replace(/\[Official\s+Lyric\s+Video\]/gi, '')
    .replace(/\(Lyric\s+Video\)/gi, '')
    .replace(/\[Lyric\s+Video\]/gi, '')
    .replace(/\(Audio\)/gi, '')
    .replace(/\[Audio\]/gi, '')
    .replace(/\(Visualizer\)/gi, '')
    .replace(/\[Visualizer\]/gi, '')
    .replace(/\(HD\)/gi, '')
    .replace(/\[HD\]/gi, '')
    .replace(/\(4K\)/gi, '')
    .replace(/\[4K\]/gi, '')
    .replace(/ft\..*?$/gi, '')
    .replace(/feat\..*?$/gi, '')
    .trim();
}

/**
 * Searches Ultimate-Guitar for verified crowdsourced chords and tabs.
 * Returns null if not found or if the track is an original/backing track.
 */
export async function searchTabChords(title: string, artist?: string): Promise<TabGrounding | null> {
  try {
    const clean = cleanSongTitle(title);
    
    // Build query avoiding duplicate artist names
    let query = clean;
    if (artist && !clean.toLowerCase().includes(artist.toLowerCase())) {
      query = `${artist} ${clean}`;
    }
    // Remove " - " hyphens for cleaner search
    query = query.replace(/\s+-\s+/g, ' ').replace(/\s+/g, ' ').trim();

    console.log(`[tabRetriever] Searching verified chord score for: "${query}"...`);

    const ugUrl = 'https://www.ultimate-guitar.com/search.php?search_type=title&value=' + encodeURIComponent(query);
    const res = await fetch(ugUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      console.log(`[tabRetriever] Search returned HTTP ${res.status}`);
      return null;
    }

    const html = await res.text();
    const match = html.match(/class="js-store" data-content="([^"]+)"/);
    if (!match) {
      console.log(`[tabRetriever] No store data found for "${query}"`);
      return null;
    }

    const raw = match[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    const data = JSON.parse(raw);
    const results = data.store?.page?.data?.results;
    if (!Array.isArray(results) || results.length === 0) {
      console.log(`[tabRetriever] No search results for "${query}"`);
      return null;
    }

    // Filter to Chords tabs (prefer official or top community chords)
    const chordTab = results.find((r: any) => r.type === 'Chords') || results[0];
    if (!chordTab?.tab_url) {
      return null;
    }

    console.log(`[tabRetriever] Found match: ${chordTab.artist_name} - ${chordTab.song_name} (${chordTab.tab_url})`);

    // Fetch tab details from the tab URL
    const tabRes = await fetch(chordTab.tab_url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!tabRes.ok) {
      return {
        artist: chordTab.artist_name,
        song: chordTab.song_name,
        key: chordTab.tonality_name || undefined,
        capo: chordTab.capo || 0,
      };
    }

    const tabHtml = await tabRes.text();
    const tabMatch = tabHtml.match(/class="js-store" data-content="([^"]+)"/);
    if (!tabMatch) {
      return {
        artist: chordTab.artist_name,
        song: chordTab.song_name,
        key: chordTab.tonality_name || undefined,
        capo: chordTab.capo || 0,
      };
    }

    const tabRaw = tabMatch[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    const tabData = JSON.parse(tabRaw);
    const tabView = tabData.store?.page?.data?.tab_view;
    const content = tabView?.wiki_tab?.content;

    // Clean tab text: remove [ch][/ch] and [tab][/tab] tags
    const cleanContent = content
      ? content.replace(/\[\/?(ch|tab)\]/g, '').slice(0, 2500)
      : undefined;

    const detectedKey = tabView?.meta?.tonality || chordTab.tonality_name || undefined;
    const detectedCapo = tabView?.meta?.capo || chordTab.capo || 0;

    // Extract verified unique chords from chord tags if present
    let verifiedChords: string[] | undefined;
    if (content) {
      const chordMatches = content.match(/\[ch\]([^\[]+)\[\/ch\]/gi);
      if (chordMatches) {
        const set = new Set<string>();
        for (const m of chordMatches) {
          const raw = m.replace(/\[\/?ch\]/gi, '').trim();
          if (/^[A-G][#b]?(m|min|maj|7|5)?$/i.test(raw)) {
            // Transpose to sounding pitch if capo is specified in tab
            const soundingChord = detectedCapo > 0 ? transposeChord(raw, detectedCapo) : standardizeChord(raw);
            set.add(soundingChord);
            // If rock power chord (root + 5th), also register root triad
            const match = soundingChord.match(/^([A-G][#b]?)(.*)$/);
            if (match) {
              set.add(match[1]); // Major/power form
            }
          }
        }
        if (set.size > 0) {
          verifiedChords = Array.from(set);
          console.log(`[tabRetriever] Extracted ${verifiedChords.length} verified sounding ground chords (capo ${detectedCapo}): ${verifiedChords.join(', ')}`);
        }
      }
    }

    console.log(`[tabRetriever] Verified Key: ${detectedKey || 'N/A'}, Capo: ${detectedCapo}`);

    return {
      artist: chordTab.artist_name,
      song: chordTab.song_name,
      key: detectedKey,
      capo: detectedCapo,
      tuning: tabView?.meta?.tuning?.name || 'Standard',
      leadSheet: cleanContent,
      verifiedChords,
    };
  } catch (err) {
    console.warn('[tabRetriever] Error retrieving tab:', err instanceof Error ? err.message : err);
    return null;
  }
}
