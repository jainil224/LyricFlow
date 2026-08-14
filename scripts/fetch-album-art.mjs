import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Helper to normalize strings for similarity comparison
function normalizeStr(str = '') {
  return str
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Simple Levenshtein similarity (0 to 1)
function getSimilarity(a, b) {
  const normA = normalizeStr(a);
  const normB = normalizeStr(b);

  if (normA === normB) return 1.0;
  if (normA.includes(normB) || normB.includes(normA)) return 0.85;

  const lenA = normA.length;
  const lenB = normB.length;
  if (lenA === 0 || lenB === 0) return 0;

  const matrix = Array.from({ length: lenA + 1 }, () => Array(lenB + 1).fill(0));
  for (let i = 0; i <= lenA; i++) matrix[i][0] = i;
  for (let j = 0; j <= lenB; j++) matrix[0][j] = j;

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = normA[i - 1] === normB[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[lenA][lenB];
  const maxLen = Math.max(lenA, lenB);
  return 1 - distance / maxLen;
}

// Artist hints map from source of truth table
const ARTIST_HINTS = {
  'back to friends(MP3_320K).mp3': 'sombr',
  'Beanie(MP3_320K).mp3': 'Chezile',
  'blue (slowed down)(MP3_128K).mp3': 'yung kai',
  'Co2(MP3_320K).mp3': 'Prateek Kuhad',
  'Demons(MP3_320K).mp3': 'Imagine Dragons',
  'Ed Sheeran - Perfect (Lyrics)(MP3_320K).mp3': 'Ed Sheeran',
  'Gone_ Gone_ Gone(MP3_320K).mp3': 'Phillip Phillips',
  'Hall of Fame(MP3_320K).mp3': 'The Script',
  'Let Her Go (Anniversary Edition)(MP3_320K).mp3': 'Passenger',
  'Line Without a Hook(MP3_320K).mp3': 'Ricky Montgomery',
  'lovely(MP3_320K).mp3': 'Billie Eilish Khalid',
  'Ordinary(MP3_320K).mp3': 'Alex Warren',
  'RED(MP3_320K).mp3': 'Taylor Swift',
  'SNAP(MP3_320K).mp3': 'Rosa Linn',
  'Somewhere Only We Know(MP3_320K).mp3': 'Keane',
  'Sunflower(MP3_320K).mp3': 'Post Malone Swae Lee',
  'Until I Found You (Em Beihold Version)(MP3_320K).mp3': 'Stephen Sanchez Em Beihold',
  'Your Eyes(MP3_320K).mp3': 'Barney Sku Taqiya Zaman',
  'i_m your death bed - Powfu _ beabadoobee vs Jason Mraz (Mashup)(MP3_320K).mp3': 'Powfu death bed',
  'SPIDER-MAN_ INTO THE SPIDER VERSE 「 MMV 」 Falling(MP3_320K).mp3': 'Falling Trevor Daniel',
  'Taylor Swift - The Fate of Ophelia (Official Music Video)(MP3_320K).mp3': 'Taylor Swift Ophelia',
};

const SEARCH_OVERRIDE = {
  '4-Weezer-Take-on-Me-9U9H51 (1).mp3': 'Take on Me Weezer',
  'i_m your death bed - Powfu _ beabadoobee vs Jason Mraz (Mashup)(MP3_320K).mp3': 'death bed Powfu',
  'SPIDER-MAN_ INTO THE SPIDER VERSE 「 MMV 」 Falling(MP3_320K).mp3': 'Falling Trevor Daniel',
};

// Clean song query string
function cleanQuery(filename, title, artist) {
  if (SEARCH_OVERRIDE[filename]) return SEARCH_OVERRIDE[filename];

  let qTitle = title
    .replace(/\(MP3_\d+K\)/gi, '')
    .replace(/\(Lyrics\)/gi, '')
    .replace(/\(slowed down\)/gi, '')
    .replace(/\(Anniversary Edition\)/gi, '')
    .replace(/\(Em Beihold Version\)/gi, '')
    .replace(/\(Official Music Video\)/gi, '')
    .replace(/\(Mashup\)/gi, '')
    .replace(/i_m your /gi, '')
    .replace(/SPIDER-MAN_ INTO THE SPIDER VERSE/gi, '')
    .replace(/「 MMV 」/g, '')
    .replace(/vs Jason Mraz/gi, '')
    .replace(/_/g, ' ')
    .trim();

  let hintArtist = ARTIST_HINTS[filename] || (artist && artist !== 'unknown' ? artist : '');
  return `${qTitle} ${hintArtist}`.trim();
}

// Perform HTTP GET request to iTunes Search API
function fetchItunesResults(query) {
  return new Promise((resolve) => {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=5`;
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.results || []);
        } catch {
          resolve([]);
        }
      });
    });
    req.on('error', () => resolve([]));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve([]);
    });
  });
}

// Download image bytes to local covers directory
function downloadImage(url, destPath) {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location, destPath).then(resolve);
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    }).on('error', () => {
      fs.unlink(destPath, () => {});
      resolve(false);
    });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log('🎵 Starting iTunes Album Art Fetcher...\n');

  const coversDir = path.join(projectRoot, 'public', 'covers');
  if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true });

  const songsDir = path.join(projectRoot, 'public', 'songs');
  let files = [];
  if (fs.existsSync(songsDir)) {
    files = fs.readdirSync(songsDir).filter((f) => f.endsWith('.mp3'));
  }

  console.log(`Found ${files.length} MP3 files in public/songs/\n`);

  const coverArtData = {};
  const manualReviewList = [];

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const slug = filename.replace(/\.mp3$/i, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();

    // Raw best guess title & artist from filename
    let rawTitle = filename.replace(/\(MP3_\d+K\)/gi, '').replace(/\.mp3$/i, '').replace(/_/g, ' ').trim();
    let rawArtist = '';

    if (filename.includes('death bed')) {
      rawTitle = 'death bed (coffee for your head)';
      rawArtist = 'Powfu';
    } else if (filename.includes('Falling')) {
      rawTitle = 'Falling';
      rawArtist = 'Trevor Daniel';
    } else if (rawTitle.includes('-')) {
      const parts = rawTitle.split('-');
      rawArtist = parts[0].trim();
      rawTitle = parts.slice(1).join('-').trim();
    }

    const searchQuery = cleanQuery(filename, rawTitle, rawArtist);
    console.log(`[${i + 1}/${files.length}] Searching: "${searchQuery}" ...`);

    const results = await fetchItunesResults(searchQuery);
    await sleep(300); // 300ms rate limit delay

    let bestMatch = null;
    let highestScore = 0;

    for (const res of results) {
      const titleSim = getSimilarity(rawTitle, res.trackName || '');
      const artistSim = rawArtist ? getSimilarity(rawArtist, res.artistName || '') : 0.8;
      const totalScore = (titleSim * 0.6) + (artistSim * 0.4);

      if (totalScore > highestScore) {
        highestScore = totalScore;
        bestMatch = res;
      }
    }

    if (bestMatch && highestScore >= 0.45) {
      // Upscale 100x100 to 600x600
      const artwork600 = (bestMatch.artworkUrl100 || '').replace('100x100bb', '600x600bb');
      const localCoverFile = `${slug}.jpg`;
      const localCoverPath = path.join(coversDir, localCoverFile);

      const downloaded = await downloadImage(artwork600, localCoverPath);
      const secureUrl = `/covers/${localCoverFile}`;

      coverArtData[filename] = {
        title: bestMatch.trackName,
        artist: bestMatch.artistName,
        album: bestMatch.collectionName,
        coverUrl: secureUrl,
        upscalediTunesUrl: artwork600,
        score: highestScore.toFixed(2),
      };

      console.log(`  ✓ Matched: "${bestMatch.trackName}" by ${bestMatch.artistName} (Score: ${highestScore.toFixed(2)})`);
    } else {
      console.log(`  ⚠ Low confidence match for "${filename}" (Highest Score: ${highestScore.toFixed(2)})`);
      manualReviewList.push({
        filename,
        searchQuery,
        highestScore: highestScore.toFixed(2),
        topCandidate: bestMatch ? `${bestMatch.trackName} by ${bestMatch.artistName}` : 'None',
      });

      coverArtData[filename] = {
        title: rawTitle,
        artist: rawArtist || 'Unknown Artist',
        album: 'Single',
        coverUrl: `/covers/${slug}.jpg`,
        needsReview: true,
      };
    }
  }

  // Save results to coverArt.json
  const coverArtPath = path.join(projectRoot, 'src', 'data', 'coverArt.json');
  fs.writeFileSync(coverArtPath, JSON.stringify(coverArtData, null, 2));
  console.log(`\n💾 Saved cover art mapping to: ${coverArtPath}`);

  // Save manual review file
  const reviewPath = path.join(projectRoot, 'manual-review.json');
  fs.writeFileSync(reviewPath, JSON.stringify(manualReviewList, null, 2));
  console.log(`📋 Saved manual review entries to: ${reviewPath}`);

  console.log('\n================ SUMMARY ================');
  console.log(`Successfully Matched : ${Object.keys(coverArtData).length - manualReviewList.length}`);
  console.log(`Needs Manual Review  : ${manualReviewList.length}`);
  console.log('=========================================\n');
}

main();
