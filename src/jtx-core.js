// JTX Core — Extracted logic for testing
// These functions are used by both index.html and the test suite

export function parseMovie(item) {
  const videoStream = (item.MediaStreams || []).find(s => s.Type === 'Video') || {};
  const audioStream = (item.MediaStreams || []).find(s => s.Type === 'Audio') || {};
  const directors = (item.People || []).filter(p => p.Type === 'Director').map(p => p.Name);
  const actors = (item.People || []).filter(p => p.Type === 'Actor').map(p => p.Name);
  const height = videoStream.Height || 0;
  const width = videoStream.Width || 0;

  let resolution = 'SD';
  if (height >= 2160 || width >= 3840) resolution = '4K';
  else if (height >= 1080 || width >= 1920) resolution = '1080p';
  else if (height >= 720 || width >= 1280) resolution = '720p';

  const audioChannels = audioStream.Channels || 0;
  let audioLabel = 'Unknown';
  if (audioChannels >= 8) audioLabel = '7.1';
  else if (audioChannels >= 6) audioLabel = '5.1';
  else if (audioChannels >= 2) audioLabel = 'Stereo';
  else if (audioChannels === 1) audioLabel = 'Mono';

  const runtimeMin = item.RunTimeTicks ? Math.round(item.RunTimeTicks / 600000000) : 0;

  const totalBitrate = (videoStream.BitRate || 0) + (audioStream.BitRate || 0);
  const durationSec = item.RunTimeTicks ? item.RunTimeTicks / 10000000 : 0;
  const sizeBytes = (totalBitrate * durationSec) / 8;

  return {
    id: item.Id,
    title: item.Name || 'Unknown',
    year: item.ProductionYear || 0,
    director: directors.join(', ') || '—',
    genres: (item.Genres || []),
    genre: (item.Genres || []).join(', ') || '—',
    rating: item.CommunityRating || 0,
    officialRating: item.OfficialRating || '—',
    runtime: runtimeMin,
    resolution: resolution,
    resHeight: height,
    audio: audioLabel,
    audioCodec: (audioStream.Codec || '?').toUpperCase(),
    audioChannels: audioChannels,
    codec: (videoStream.Codec || '?').toUpperCase(),
    sizeBytes: sizeBytes,
    size: formatSize(sizeBytes),
    overview: item.Overview || 'No overview available.',
    cast: actors.slice(0, 8),
    studios: (item.Studios || []).map(s => s.Name),
    path: item.Path || '',
    container: item.Container || '',
  };
}

export function formatSize(bytes) {
  if (!bytes || bytes <= 0) return '—';
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(0) + ' MB';
  return (bytes / 1024).toFixed(0) + ' KB';
}

export function sortMovies(movies, col, dir) {
  const mult = dir === 'asc' ? 1 : -1;
  return [...movies].sort((a, b) => {
    let va, vb;
    switch (col) {
      case 'title':    va = a.title.toLowerCase(); vb = b.title.toLowerCase(); break;
      case 'year':     va = a.year; vb = b.year; break;
      case 'director': va = a.director.toLowerCase(); vb = b.director.toLowerCase(); break;
      case 'genre':    va = a.genre.toLowerCase(); vb = b.genre.toLowerCase(); break;
      case 'rating':   va = a.rating; vb = b.rating; break;
      case 'runtime':  va = a.runtime; vb = b.runtime; break;
      case 'res':      va = a.resHeight; vb = b.resHeight; break;
      case 'audio':    va = a.audioChannels; vb = b.audioChannels; break;
      case 'codec':    va = a.codec; vb = b.codec; break;
      case 'size':     va = a.sizeBytes; vb = b.sizeBytes; break;
      default:         va = a.title.toLowerCase(); vb = b.title.toLowerCase();
    }
    if (va < vb) return -1 * mult;
    if (va > vb) return 1 * mult;
    return 0;
  });
}

export function filterMovies(movies, filters) {
  const { search = '', genre = '', yearMin = 0, yearMax = 9999, ratingMin = 0, res = '' } = filters;
  const searchLower = search.toLowerCase().trim();

  return movies.filter(m => {
    if (searchLower) {
      const haystack = (m.title + ' ' + m.director + ' ' + m.cast.join(' ')).toLowerCase();
      if (!haystack.includes(searchLower)) return false;
    }
    if (genre && !m.genres.includes(genre)) return false;
    if (m.year && (m.year < yearMin || m.year > yearMax)) return false;
    if (m.rating < ratingMin) return false;
    if (res) {
      if (res === '4k' && m.resolution !== '4K') return false;
      if (res === '1080' && m.resolution !== '1080p') return false;
      if (res === '720' && m.resolution !== '720p') return false;
      if (res === 'sd' && m.resolution !== 'SD') return false;
    }
    return true;
  });
}

export function ratingClass(r) {
  if (r >= 7.5) return 'rating-high';
  if (r >= 5.5) return 'rating-mid';
  return 'rating-low';
}
