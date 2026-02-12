import { describe, it, expect } from 'vitest';
import { parseSeries, sortSeries, filterSeries, visibleRange } from '../../src/jtx-core.js';
import mockData from '../../mocks/jellyfin-series-response.json';

const series = mockData.Items.map(parseSeries);

describe('parseSeries', () => {
  const s = parseSeries(mockData.Items[0]); // Foundation

  it('extracts title', () => {
    expect(s.title).toBe('Foundation');
  });

  it('extracts year', () => {
    expect(s.year).toBe(2021);
  });

  it('extracts genres', () => {
    expect(s.genres).toEqual(['Science Fiction', 'Drama']);
    expect(s.genre).toBe('Science Fiction, Drama');
  });

  it('extracts rating', () => {
    expect(s.rating).toBe(7.4);
  });

  it('extracts criticRating', () => {
    expect(s.criticRating).toBe(72);
  });

  it('extracts seasons (ChildCount)', () => {
    expect(s.seasons).toBe(2);
  });

  it('extracts episodes (RecursiveItemCount)', () => {
    expect(s.episodes).toBe(20);
  });

  it('extracts status', () => {
    expect(s.status).toBe('Continuing');
  });

  it('extracts studio', () => {
    expect(s.studio).toBe('Apple TV+');
  });

  it('extracts cast', () => {
    expect(s.cast).toContain('Jared Harris');
    expect(s.cast).toContain('Lee Pace');
  });

  it('extracts overview', () => {
    expect(s.overview).toContain('Galactic Empire');
  });
});

describe('parseSeries — Ended series', () => {
  const s = parseSeries(mockData.Items[1]); // Chernobyl

  it('detects Ended status', () => {
    expect(s.status).toBe('Ended');
  });

  it('has 1 season', () => {
    expect(s.seasons).toBe(1);
  });

  it('has 5 episodes', () => {
    expect(s.episodes).toBe(5);
  });
});

describe('parseSeries — missing metadata', () => {
  const s = parseSeries(mockData.Items[2]); // No Metadata Series

  it('handles null year', () => {
    expect(s.year).toBe(0);
  });

  it('handles null rating', () => {
    expect(s.rating).toBe(0);
  });

  it('handles null seasons', () => {
    expect(s.seasons).toBe(0);
  });

  it('handles null episodes', () => {
    expect(s.episodes).toBe(0);
  });

  it('handles null status', () => {
    expect(s.status).toBe('—');
  });

  it('handles empty studios', () => {
    expect(s.studio).toBe('—');
  });
});

describe('sortSeries', () => {
  it('sorts by title ascending', () => {
    const sorted = sortSeries(series, 'title', 'asc');
    expect(sorted[0].title).toBe('Chernobyl');
    expect(sorted[1].title).toBe('Foundation');
  });

  it('sorts by rating descending', () => {
    const sorted = sortSeries(series, 'rating', 'desc');
    expect(sorted[0].title).toBe('Chernobyl'); // 9.4
  });

  it('sorts by seasons', () => {
    const sorted = sortSeries(series, 'seasons', 'desc');
    expect(sorted[0].title).toBe('Foundation'); // 2 seasons
  });

  it('sorts by episodes', () => {
    const sorted = sortSeries(series, 'episodes', 'desc');
    expect(sorted[0].title).toBe('Foundation'); // 20 episodes
  });

  it('sorts by status', () => {
    const sorted = sortSeries(series, 'status', 'asc');
    // 'Continuing' < 'Ended' < '—' (em dash U+2014 sorts after ASCII)
    expect(sorted[0].status).toBe('Continuing');
    expect(sorted[sorted.length - 1].status).toBe('\u2014');
  });

  it('does not mutate the original array', () => {
    const original = [...series];
    sortSeries(series, 'rating', 'desc');
    expect(series.map(s => s.id)).toEqual(original.map(s => s.id));
  });
});

describe('filterSeries', () => {
  it('returns all series with empty filters', () => {
    const result = filterSeries(series, {});
    expect(result.length).toBe(series.length);
  });

  it('filters by text search (title)', () => {
    const result = filterSeries(series, { search: 'foundation' });
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Foundation');
  });

  it('filters by text search (cast)', () => {
    const result = filterSeries(series, { search: 'jared harris' });
    expect(result.length).toBe(2); // Both Foundation and Chernobyl
  });

  it('filters by genre', () => {
    const result = filterSeries(series, { genre: 'History' });
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Chernobyl');
  });

  it('filters by minimum rating', () => {
    const result = filterSeries(series, { ratingMin: 9.0 });
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Chernobyl');
  });

  it('combines multiple filters', () => {
    const result = filterSeries(series, { genre: 'Drama', ratingMin: 8.0 });
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Chernobyl');
  });
});

describe('visibleRange', () => {
  it('calculates visible range at top of list', () => {
    const { start, end } = visibleRange(0, 600, 30, 5000, 10);
    expect(start).toBe(0);
    expect(end).toBeLessThanOrEqual(40); // ~20 visible + 10 buffer * 2
  });

  it('calculates visible range in middle of list', () => {
    const { start, end } = visibleRange(3000, 600, 30, 5000, 10);
    // scrollTop 3000 / rowHeight 30 = row 100, minus buffer 10 = 90
    expect(start).toBe(90);
    expect(end).toBeLessThanOrEqual(130);
  });

  it('clamps start to 0', () => {
    const { start } = visibleRange(50, 600, 30, 5000, 10);
    expect(start).toBe(0); // floor(50/30) - 10 = -9, clamped to 0
  });

  it('clamps end to totalRows', () => {
    const { end } = visibleRange(14700, 600, 30, 500, 10);
    expect(end).toBe(500);
  });

  it('handles empty list', () => {
    const { start, end } = visibleRange(0, 600, 30, 0, 10);
    expect(start).toBe(0);
    expect(end).toBe(0);
  });
});
