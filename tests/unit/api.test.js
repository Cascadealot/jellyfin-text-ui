import { describe, it, expect } from 'vitest';
import { parseMovie, formatSize, ratingClass } from '../../src/jtx-core.js';
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
