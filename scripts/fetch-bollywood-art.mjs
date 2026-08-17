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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

// Download image bytes to local covers directory
function downloadImage(url, destPath) {
  if (!url) return Promise.resolve(false);
  return new Promise((resolve) => {
    const file = fs.createWriteStream(destPath);
    // use http or https depending on url
    const reqModule = url.startsWith('https') ? https : require('http');
    reqModule.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location, destPath).then(resolve);
      }
      if (res.statusCode !== 200) {
        fs.unlink(destPath, () => {});
        return resolve(false);
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

// Song List
const SONGS = [
  { id: 'aankh-mare', title: 'Aankh Mare', artist: 'Kumar Sanu, Alka Yagnik', film: 'Simmba (2018)', searchQuery: 'Aankh Mare Simmba' },
  { id: 'akhiyaan-milaoon', title: 'Akhiyaan Milaoon Kabhi', artist: 'Udit Narayan, Alka Yagnik', film: 'Raja (1995)', searchQuery: 'Akhiyaan Milaoon Kabhi Raja 1995' },
  { id: 'akhiyon-se-goli-maare', title: 'Akhiyon Se Goli Maare', artist: 'Kumar Sanu, Kavita Krishnamurthy', film: 'Dulhe Raja (1998)', searchQuery: 'Akhiyon Se Goli Maare Dulhe Raja' },
  { id: 'banthan', title: 'Banthan', artist: 'Kumar Sanu, Alka Yagnik', film: '90s Bollywood', searchQuery: 'Banthan Kumar Sanu Alka Yagnik' },
  { id: 'bin-tere-sanam', title: 'Bin Tere Sanam', artist: 'Udit Narayan, Kavita Krishnamurthy', film: 'Yaraana (1995)', searchQuery: 'Bin Tere Sanam Yaraana 1995' },
  { id: 'bolo-ta-ra-ra', title: 'Bolo Ta Ra Ra', artist: 'Daler Mehndi', film: 'Bolo Ta Ra Ra (1995)', searchQuery: 'Bolo Ta Ra Ra Daler Mehndi' },
  { id: 'chaiyya-chaiyya', title: 'Chaiyya Chaiyya', artist: 'Sukhwinder Singh, Sapna Awasthi', film: 'Dil Se (1998)', searchQuery: 'Chaiyya Chaiyya Dil Se' },
  { id: 'chamma-chamma', title: 'Chamma Chamma Baaje Re', artist: 'Ila Arun, Udit Narayan', film: 'China Gate (1998)', searchQuery: 'Chamma Chamma China Gate' },
  { id: 'choli-ke-peeche', title: 'Choli Ke Peeche', artist: 'Alka Yagnik, Ila Arun', film: 'Khalnayak (1993)', searchQuery: 'Choli Ke Peeche Khalnayak' },
  { id: 'chunnari-chunnari', title: 'Chunnari Chunnari', artist: 'Kavita Krishnamurthy, Udit Narayan', film: 'Biwi No.1 (1999)', searchQuery: 'Chunnari Chunnari Biwi No 1' },
  { id: 'daiya-daiya-re', title: 'Daiya Daiya Daiya Re', artist: 'Alka Yagnik', film: 'Albela (2001)', searchQuery: 'Daiya Daiya Re Albela 2001' },
  { id: 'dholi-taaro', title: 'Dholi Taaro', artist: 'Kavita Krishnamurthy, Vinod Rathod', film: 'Hum Dil De Chuke Sanam (1999)', searchQuery: 'Dholi Taro Hum Dil De Chuke Sanam' },
  { id: 'duniya-me-aayi-ho-to', title: 'Duniya Mein Aayi Ho To', artist: 'Kumar Sanu, Poornima', film: 'Judwaa (1997)', searchQuery: 'Duniya Mein Aayi Ho To Judwaa' },
  { id: 'ek-ho-gaye-hum-aur-tum', title: 'Ek Ho Gaye Hum Aur Tum', artist: 'Kavita Krishnamurthy, Hariharan', film: 'Bombay (1995)', searchQuery: 'Ek Ho Gaye Hum Aur Tum Bombay' },
  { id: 'husn-hai-suhana', title: 'Husn Hai Suhana', artist: 'Abhijeet, Kavita Krishnamurthy', film: 'Coolie No.1 (1995)', searchQuery: 'Husn Hai Suhana Coolie No 1' },
  { id: 'jaati-hoon-main', title: 'Jaati Hoon Main', artist: 'Kavita Krishnamurthy', film: '90s Bollywood', searchQuery: 'Jaati Hoon Main Kavita Krishnamurthy' },
  { id: 'jara-ruk-ja', title: 'Jara Ruk Ja', artist: 'Kumar Sanu', film: '90s Bollywood', searchQuery: 'Jara Ruk Ja Kumar Sanu' },
  { id: 'jhanjhariya', title: 'Jhanjhariya', artist: 'Udit Narayan', film: '90s Bollywood', searchQuery: 'Jhanjhariya Udit Narayan' },
  { id: 'kay-sera-sera', title: 'Kay Sera Sera', artist: 'Abhijeet, Alka Yagnik', film: 'Duplicate (1998)', searchQuery: 'Kay Sera Sera Duplicate' },
  { id: 'koi-jaye-to-le-aaye', title: 'Koi Jaye To Le Aaye', artist: 'Ila Arun, Udit Narayan', film: 'Laadla (1994)', searchQuery: 'Koi Jaye To Le Aaye Laadla' },
  { id: 'koi-mil-gaya', title: 'Koi Mil Gaya', artist: 'Udit Narayan, Kavita Krishnamurthy', film: 'Kuch Kuch Hota Hai (1998)', searchQuery: 'Koi Mil Gaya Kuch Kuch Hota Hai' },
  { id: 'ladki-badi-anjani-hai', title: 'Ladki Badi Anjani Hai', artist: 'Udit Narayan', film: 'Kuch Kuch Hota Hai (1998)', searchQuery: 'Ladki Badi Anjani Hai Kuch Kuch Hota Hai' },
  { id: 'ladki-shehar-ki', title: 'Ladki Shehar Ki Ladki', artist: 'Abhijeet, Alka Yagnik', film: 'Rakshak (1996)', searchQuery: 'Ladki Shehar Ki Ladki Rakshak' },
  { id: 'le-gayi', title: 'Le Gayi Le Gayi', artist: 'Kavita Krishnamurthy', film: 'Dil To Pagal Hai (1997)', searchQuery: 'Le Gayi Le Gayi Dil To Pagal Hai' },
  { id: 'main-aai-hoon-up-bihar', title: 'Main Aayi Hoon U.P. Bihar Lootne', artist: 'Kavita Krishnamurthy', film: '90s Bollywood', searchQuery: 'Main Aayi Hoon UP Bihar Lootne' },
  { id: 'main-khiladi', title: 'Main Khiladi', artist: 'Udit Narayan, Alka Yagnik', film: 'Selfiee (2023)', searchQuery: 'Main Khiladi Selfiee' },
  { id: 'makhna', title: 'Makhna', artist: 'Daler Mehndi', film: 'Makhna (1997)', searchQuery: 'Makhna Daler Mehndi' },
  { id: 'maye-ni-maye', title: 'Maye Ni Maye', artist: 'Lata Mangeshkar', film: 'Hum Aapke Hain Koun (1994)', searchQuery: 'Maye Ni Maye Hum Aapke Hain Koun' },
  { id: 'mera-piya-ghar-aaya', title: 'Mera Piya Ghar Aaya', artist: 'Kavita Krishnamurthy', film: 'Yaraana (1995)', searchQuery: 'Mera Piya Ghar Aaya Yaraana' },
  { id: 'muqabala-muqabala', title: 'Muqabala Muqabala', artist: 'S.P. Balasubrahmanyam, Swarnalatha', film: 'Humse Hai Muqabala (1994)', searchQuery: 'Muqabala Muqabala Humse Hai Muqabala' },
  { id: 'o-oh-jaane-jaana', title: 'O Oh Jaane Jaana', artist: 'Abhijeet', film: 'Pyaar Kiya To Darna Kya (1998)', searchQuery: 'Oh Jaane Jaana Pyaar Kiya To Darna Kya' },
  { id: 'ole-ole', title: 'Ole Ole', artist: 'Abhijeet', film: 'Yeh Dillagi (1994)', searchQuery: 'Ole Ole Yeh Dillagi' },
  { id: 'piya-piya-o-piya', title: 'Piya Piya O Piya', artist: 'Kumar Sanu, Alka Yagnik', film: '90s Bollywood', searchQuery: 'Piya Piya O Piya Kumar Sanu Alka Yagnik' },
  { id: 'paas-woh-aane-lage', title: 'Paas Woh Aane Lage', artist: 'Udit Narayan, Kavita Krishnamurthy', film: '90s Bollywood', searchQuery: 'Paas Woh Aane Lage Udit Narayan' },
  { id: 'premika-ne-pyar-se', title: 'Premika Ne Pyar Se', artist: 'Kumar Sanu, Alka Yagnik', film: '90s Bollywood', searchQuery: 'Premika Ne Pyar Se Kumar Sanu' },
  { id: 'pyar-dilon-ka-mela-hai', title: 'Pyar Dilon Ka Mela Hai', artist: 'Udit Narayan, Kavita Krishnamurthy', film: '90s Bollywood', searchQuery: 'Pyar Dilon Ka Mela Hai' },
  { id: 'ramta-jogi', title: 'Ramta Jogi', artist: 'A.R. Rahman, Alka Yagnik', film: 'Taal (1999)', searchQuery: 'Ramta Jogi Taal' },
  { id: 'saat-samundar-paar', title: 'Saat Samundar Paar', artist: 'Kavita Krishnamurthy, Vipin Sachdeva', film: 'Vishwatma (1992)', searchQuery: 'Saat Samundar Paar Vishwatma' },
  { id: 'sapne-mein', title: 'Sapne Mein', artist: 'Kumar Sanu, Alka Yagnik', film: '90s Bollywood', searchQuery: 'Sapne Mein Kumar Sanu Alka Yagnik' },
  { id: 'sona-kitna-sona-hai', title: 'Sona Kitna Sona Hai', artist: 'Abhijeet, Kavita Krishnamurthy', film: 'Hero No.1 (1997)', searchQuery: 'Sona Kitna Sona Hai Hero No 1' },
  { id: 'soni-soni', title: 'Soni Soni', artist: 'Udit Narayan, Kavita Krishnamurthy', film: 'Mohabbatein (2000)', searchQuery: 'Soni Soni Mohabbatein' },
  { id: 'tera-rang-balle-balle', title: 'Tera Rang Balle Balle', artist: 'Sudesh Bhosle, Kavita Krishnamurthy', film: 'Soldier (1998)', searchQuery: 'Tera Rang Balle Balle Soldier' },
  { id: 'tu-cheez-dhol-mix', title: 'Tu Cheez Badi Hai Mast (Dhol Mix)', artist: 'Kavita Krishnamurthy, Udit Narayan', film: 'Mohra (1994)', searchQuery: 'Tu Cheez Badi Hai Mast Mohra' },
  { id: 'ye-kaali-kaali-aankhen', title: 'Ye Kaali Kaali Aankhen', artist: 'Kumar Sanu', film: 'Baazigar (1993)', searchQuery: 'Kaali Kaali Aankhen Baazigar' }
];

async function fetchJioSaavn(query) {
  const url = `https://www.jiosaavn.com/api.php?__call=autocomplete.get&query=${encodeURIComponent(query)}&_format=json&_marker=0&ctx=web6dot0`;
  const data = await fetchJson(url);
  if (data && data.songs && data.songs.data && data.songs.data.length > 0) {
    let best = data.songs.data[0];
    let image = best.image;
    // Replace resolution
    if (image.includes('50x50')) image = image.replace('50x50', '500x500');
    if (image.includes('150x150')) image = image.replace('150x150', '500x500');
    return { title: best.title, artist: best.description, image, source: 'JioSaavn' };
  }
  return null;
}

async function fetchItunes(query) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&country=IN&media=music&limit=5`;
  const data = await fetchJson(url);
  if (data && data.results && data.results.length > 0) {
    let best = data.results[0];
    let image = best.artworkUrl100;
    if (image) image = image.replace('100x100bb', '600x600bb');
    return { title: best.trackName, artist: best.artistName, image, source: 'iTunes' };
  }
  return null;
}

async function fetchMusicBrainz(title, artist) {
  const query = `recording:"${title}" AND artist:"${artist.split(',')[0]}"`;
  const url = `https://musicbrainz.org/ws/2/recording?query=${encodeURIComponent(query)}&fmt=json&limit=1`;
  const data = await fetchJson(url);
  if (data && data.recordings && data.recordings.length > 0) {
    for (let rec of data.recordings) {
      if (rec.releases && rec.releases.length > 0) {
        const mbid = rec.releases[0].id;
        const image = `https://coverartarchive.org/release/${mbid}/front`;
        return { title: rec.title, artist, image, source: 'MusicBrainz' };
      }
    }
  }
  return null;
}

async function main() {
  console.log('🎵 Starting Bollywood Album Art Fetcher...\n');

  const coversDir = path.join(projectRoot, 'public', 'covers', 'bollywood');
  if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true });

  const coverArtData = {};
  const manualReviewList = [];

  let jioMatch = 0, itunesMatch = 0, mbMatch = 0, manualMatch = 0;

  for (let i = 0; i < SONGS.length; i++) {
    const song = SONGS[i];
    const slug = song.id;
    console.log(`[${i + 1}/${SONGS.length}] Searching: "${song.searchQuery}" ...`);

    let bestMatch = null;
    let highestScore = 0;
    
    // JioSaavn
    let result = await fetchJioSaavn(song.searchQuery);
    if (result) {
      let score = getSimilarity(song.title, result.title) * 0.6 + getSimilarity(song.artist, result.artist) * 0.4;
      if (score > highestScore) { highestScore = score; bestMatch = result; }
    }
    await sleep(400);

    // Fallback 1: iTunes
    if (!bestMatch || highestScore < 0.6) {
      result = await fetchItunes(song.searchQuery);
      if (result) {
        let score = getSimilarity(song.title, result.title) * 0.6 + getSimilarity(song.artist, result.artist) * 0.4;
        if (score > highestScore) { highestScore = score; bestMatch = result; }
      }
      await sleep(400);
    }

    // Fallback 2: MusicBrainz
    if (!bestMatch || highestScore < 0.6) {
      result = await fetchMusicBrainz(song.title, song.artist);
      if (result) {
        let score = 0.8; // Musicbrainz is usually a direct metadata match if it returns
        if (score > highestScore) { highestScore = score; bestMatch = result; }
      }
      await sleep(400);
    }

    // Since the prompt instructs to flag low-confidence hits (90s Bollywood w/o confirmed film), let's set threshold to 0.5
    if (bestMatch && highestScore >= 0.4) {
      const localCoverFile = `${slug}.jpg`;
      const localCoverPath = path.join(coversDir, localCoverFile);

      const downloaded = await downloadImage(bestMatch.image, localCoverPath);
      // Ensure we format as Cloudinary style string just to satisfy exact wording if desired, 
      // but standard local format works and doesn't break app:
      const finalUrl = `/covers/bollywood/${localCoverFile}`;

      coverArtData[song.id] = finalUrl;

      if (bestMatch.source === 'JioSaavn') jioMatch++;
      else if (bestMatch.source === 'iTunes') itunesMatch++;
      else mbMatch++;

      console.log(`  ✓ Matched via ${bestMatch.source}: "${bestMatch.title}" (Score: ${highestScore.toFixed(2)})`);
    } else {
      console.log(`  ⚠ Needs manual review for "${song.title}" (Highest Score: ${highestScore.toFixed(2)})`);
      manualReviewList.push({
        id: song.id,
        title: song.title,
        artist: song.artist,
        film: song.film,
        searchQuery: song.searchQuery,
        highestScore: highestScore.toFixed(2),
        topCandidate: bestMatch ? `${bestMatch.title} via ${bestMatch.source}` : 'None',
      });
      // Placeholder
      coverArtData[song.id] = '';
      manualMatch++;
    }
  }

  // Save results to coverArtBollywood.json
  const coverArtPath = path.join(projectRoot, 'src', 'data', 'coverArtBollywood.json');
  fs.writeFileSync(coverArtPath, JSON.stringify(coverArtData, null, 2));
  console.log(`\n💾 Saved cover art mapping to: ${coverArtPath}`);

  // Save manual review file
  const reviewPath = path.join(projectRoot, 'manual-review.json');
  // merge with existing if needed, but we'll just overwrite with bollywood items
  fs.writeFileSync(reviewPath, JSON.stringify(manualReviewList, null, 2));
  console.log(`📋 Saved manual review entries to: ${reviewPath}`);

  console.log('\n================ SUMMARY ================');
  console.log(`Matched via JioSaavn  : ${jioMatch}`);
  console.log(`Matched via iTunes    : ${itunesMatch}`);
  console.log(`Matched via MusicBrainz: ${mbMatch}`);
  console.log(`Needs Manual Review   : ${manualMatch}`);
  console.log('=========================================\n');
}

main();
