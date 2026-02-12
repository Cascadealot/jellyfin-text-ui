import { describe, it, expect } from 'vitest';
import { parseMovie, formatSize, ratingClass, thumbnailUrl, rtLabel } from '../../src/jtx-core.js';
import mockData from '../../mocks/jellyfin-response.json';

describe('parseMovie', () => {
  const movie = parseMovie(mockData.Items[0]); // 12 Angry Men

  it('extracts title', () => {
    expect(movie.title).toBe('12 Angry Men');
  });

  it('extracts year', () => {
    expect(movie.year).toBe(1957);
  });

  it('extracts director from People', () => {
    expect(movie.director).toBe('Sidney Lumet');
  });

  it('extracts genres', () => {
    expect(movie.genres).toEqual(['Drama']);
    expect(movie.genre).toBe('Drama');
  });

  it('extracts rating', () => {
    expect(movie.rating).toBe(9.0);
  });

  it('calculates runtime in minutes', () => {
    // 57600000000 ticks / 600000000 = 96 min
    expect(movie.runtime).toBe(96);
  });

  it('detects resolution from video stream', () => {
    expect(movie.resolution).toBe('1080p');
    expect(movie.resHeight).toBe(1080);
  });

  it('detects audio channels', () => {
    expect(movie.audio).toBe('Stereo');
    expect(movie.audioChannels).toBe(2);
  });

  it('extracts codec', () => {
    expect(movie.codec).toBe('H264');
  });

  it('extracts studios', () => {
    expect(movie.studios).toEqual(['Orion-Nova Productions']);
  });

  it('extracts cast (actors only, max 8)', () => {
    expect(movie.cast).toContain('Henry Fonda');
    expect(movie.cast).toContain('Lee J. Cobb');
    expect(movie.cast.length).toBeLessThanOrEqual(8);
  });

  it('extracts overview', () => {
    expect(movie.overview).toContain('jury holdout');
  });
});

describe('parseMovie — 4K movie', () => {
  const movie = parseMovie(mockData.Items[2]); // Blade Runner 2049

  it('detects 4K resolution', () => {
    expect(movie.resolution).toBe('4K');
  });

  it('detects 7.1 audio', () => {
    expect(movie.audio).toBe('7.1');
  });

  it('detects HEVC codec', () => {
    expect(movie.codec).toBe('HEVC');
  });
});

describe('parseMovie — 5.1 audio', () => {
  const movie = parseMovie(mockData.Items[1]); // A Bronx Tale

  it('detects 5.1 audio', () => {
    expect(movie.audio).toBe('5.1');
  });
});

describe('parseMovie — SD movie', () => {
  const movie = parseMovie(mockData.Items[3]); // The Room

  it('detects SD resolution', () => {
    expect(movie.resolution).toBe('SD');
  });
});

describe('parseMovie — missing metadata', () => {
  const movie = parseMovie(mockData.Items[4]); // No Metadata Movie

  it('handles null year', () => {
    expect(movie.year).toBe(0);
  });

  it('handles null rating', () => {
    expect(movie.rating).toBe(0);
  });

  it('handles empty genres', () => {
    expect(movie.genres).toEqual([]);
    expect(movie.genre).toBe('—');
  });

  it('handles no people', () => {
    expect(movie.director).toBe('—');
    expect(movie.cast).toEqual([]);
  });

  it('handles no media streams', () => {
    expect(movie.resolution).toBe('SD');
    expect(movie.audio).toBe('Unknown');
    expect(movie.codec).toBe('?');
  });

  it('handles null overview', () => {
    expect(movie.overview).toBe('No overview available.');
  });

  it('handles null runtime', () => {
    expect(movie.runtime).toBe(0);
  });
});

describe('formatSize', () => {
  it('formats GB', () => {
    expect(formatSize(2147483648)).toBe('2.0 GB');
  });

  it('formats MB', () => {
    expect(formatSize(52428800)).toBe('50 MB');
  });

  it('formats KB', () => {
    expect(formatSize(51200)).toBe('50 KB');
  });

  it('returns dash for zero', () => {
    expect(formatSize(0)).toBe('—');
  });

  it('returns dash for null', () => {
    expect(formatSize(null)).toBe('—');
  });

  it('returns dash for negative', () => {
    expect(formatSize(-100)).toBe('—');
  });
});

describe('ratingClass', () => {
  it('returns high for 7.5+', () => {
    expect(ratingClass(9.0)).toBe('rating-high');
    expect(ratingClass(7.5)).toBe('rating-high');
  });

  it('returns mid for 5.5-7.4', () => {
    expect(ratingClass(6.0)).toBe('rating-mid');
    expect(ratingClass(5.5)).toBe('rating-mid');
  });

  it('returns low for below 5.5', () => {
    expect(ratingClass(3.6)).toBe('rating-low');
    expect(ratingClass(0)).toBe('rating-low');
  });
});

describe('thumbnailUrl', () => {
  it('generates a valid Jellyfin image URL', () => {
    const url = thumbnailUrl('abc123', 60, 'http://example.com:8096', 'mykey');
    expect(url).toBe('http://example.com:8096/Items/abc123/Images/Primary?maxHeight=60&quality=80&api_key=mykey');
  });

  it('uses default height of 40', () => {
    const url = thumbnailUrl('abc123', undefined, 'http://example.com:8096', 'mykey');
    expect(url).toContain('maxHeight=40');
  });

  it('returns empty string for null id', () => {
    expect(thumbnailUrl(null)).toBe('');
    expect(thumbnailUrl('')).toBe('');
    expect(thumbnailUrl(undefined)).toBe('');
  });
});

describe('rtLabel', () => {
  it('returns Fresh for 60+', () => {
    expect(rtLabel(100)).toBe('100% Fresh');
    expect(rtLabel(60)).toBe('60% Fresh');
    expect(rtLabel(88)).toBe('88% Fresh');
  });

  it('returns Rotten for below 60', () => {
    expect(rtLabel(25)).toBe('25% Rotten');
    expect(rtLabel(59)).toBe('59% Rotten');
  });

  it('returns empty string for null/0', () => {
    expect(rtLabel(null)).toBe('');
    expect(rtLabel(0)).toBe('');
    expect(rtLabel(undefined)).toBe('');
  });

  it('rounds to nearest integer', () => {
    expect(rtLabel(88.7)).toBe('89% Fresh');
    expect(rtLabel(24.3)).toBe('24% Rotten');
  });
});

describe('parseMovie — criticRating', () => {
  it('extracts CriticRating as criticRating', () => {
    const movie = parseMovie(mockData.Items[0]); // 12 Angry Men, CriticRating: 100
    expect(movie.criticRating).toBe(100);
  });

  it('extracts CriticRating for Rotten movie', () => {
    const movie = parseMovie(mockData.Items[3]); // The Room, CriticRating: 25
    expect(movie.criticRating).toBe(25);
  });

  it('defaults to 0 when CriticRating is missing', () => {
    const movie = parseMovie(mockData.Items[4]); // No Metadata Movie
    expect(movie.criticRating).toBe(0);
  });
});
