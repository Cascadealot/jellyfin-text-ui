import { describe, it, expect } from 'vitest';
import { sortMovies, parseMovie } from '../../src/jtx-core.js';
import mockData from '../../mocks/jellyfin-response.json';

const movies = mockData.Items.map(parseMovie);

describe('sortMovies', () => {
  it('sorts by title ascending (A-Z)', () => {
    const sorted = sortMovies(movies, 'title', 'asc');
    expect(sorted[0].title).toBe('12 Angry Men');
    expect(sorted[1].title).toBe('A Bronx Tale');
    expect(sorted[sorted.length - 1].title).toBe('The Room');
  });

  it('sorts by title descending (Z-A)', () => {
    const sorted = sortMovies(movies, 'title', 'desc');
    expect(sorted[0].title).toBe('The Room');
    expect(sorted[sorted.length - 1].title).toBe('12 Angry Men');
  });

  it('sorts by year ascending', () => {
    const sorted = sortMovies(movies, 'year', 'asc');
    // Year 0 (null) comes first
    expect(sorted[0].year).toBe(0);
    expect(sorted[1].year).toBe(1957);
    expect(sorted[sorted.length - 1].year).toBe(2017);
  });

  it('sorts by year descending', () => {
    const sorted = sortMovies(movies, 'year', 'desc');
    expect(sorted[0].year).toBe(2017);
  });

  it('sorts by rating ascending', () => {
    const sorted = sortMovies(movies, 'rating', 'asc');
    expect(sorted[0].rating).toBe(0); // No Metadata Movie
    expect(sorted[1].rating).toBe(3.6); // The Room
  });

  it('sorts by rating descending', () => {
    const sorted = sortMovies(movies, 'rating', 'desc');
    expect(sorted[0].rating).toBe(9.0); // 12 Angry Men
  });

  it('sorts by runtime', () => {
    const sorted = sortMovies(movies, 'runtime', 'desc');
    expect(sorted[0].title).toBe('Blade Runner 2049'); // longest
  });

  it('sorts by resolution (resHeight)', () => {
    const sorted = sortMovies(movies, 'res', 'desc');
    expect(sorted[0].resolution).toBe('4K');
  });

  it('sorts by audio channels', () => {
    const sorted = sortMovies(movies, 'audio', 'desc');
    expect(sorted[0].audio).toBe('7.1');
  });

  it('sorts by codec alphabetically', () => {
    const sorted = sortMovies(movies, 'codec', 'asc');
    const codecs = sorted.map(m => m.codec);
    expect(codecs).toEqual([...codecs].sort());
  });

  it('sorts by size descending', () => {
    const sorted = sortMovies(movies, 'size', 'desc');
    expect(sorted[0].title).toBe('Blade Runner 2049'); // 4K = biggest
  });

  it('does not mutate the original array', () => {
    const original = [...movies];
    sortMovies(movies, 'rating', 'desc');
    expect(movies.map(m => m.id)).toEqual(original.map(m => m.id));
  });

  it('handles empty array', () => {
    const sorted = sortMovies([], 'title', 'asc');
    expect(sorted).toEqual([]);
  });
});
