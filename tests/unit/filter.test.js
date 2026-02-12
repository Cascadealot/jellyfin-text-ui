import { describe, it, expect } from 'vitest';
import { filterMovies, parseMovie } from '../../src/jtx-core.js';
import mockData from '../../mocks/jellyfin-response.json';

const movies = mockData.Items.map(parseMovie);

describe('filterMovies', () => {
  it('returns all movies with empty filters', () => {
    const result = filterMovies(movies, {});
    expect(result.length).toBe(movies.length);
  });

  it('filters by text search (title)', () => {
    const result = filterMovies(movies, { search: 'bronx' });
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('A Bronx Tale');
  });

  it('filters by text search (director)', () => {
    const result = filterMovies(movies, { search: 'de niro' });
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('A Bronx Tale');
  });

  it('filters by text search (cast)', () => {
    const result = filterMovies(movies, { search: 'harrison ford' });
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Blade Runner 2049');
  });

  it('text search is case-insensitive', () => {
    const result = filterMovies(movies, { search: 'ANGRY' });
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('12 Angry Men');
  });

  it('filters by genre', () => {
    const result = filterMovies(movies, { genre: 'Crime' });
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('A Bronx Tale');
  });

  it('filters by genre (Drama returns multiple)', () => {
    const result = filterMovies(movies, { genre: 'Drama' });
    expect(result.length).toBe(4); // All except No Metadata
  });

  it('filters by year range', () => {
    const result = filterMovies(movies, { yearMin: 1990, yearMax: 2010 });
    // A Bronx Tale (1993), The Room (2003), and No Metadata (year=0, not excluded)
    expect(result.length).toBe(3);
  });

  it('filters by minimum rating', () => {
    const result = filterMovies(movies, { ratingMin: 8.0 });
    expect(result.length).toBe(2); // 12 Angry Men (9.0) and Blade Runner 2049 (8.0)
  });

  it('filters by resolution (4K)', () => {
    const result = filterMovies(movies, { res: '4k' });
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Blade Runner 2049');
  });

  it('filters by resolution (1080p)', () => {
    const result = filterMovies(movies, { res: '1080' });
    expect(result.length).toBe(2); // 12 Angry Men and A Bronx Tale
  });

  it('filters by resolution (SD)', () => {
    const result = filterMovies(movies, { res: 'sd' });
    expect(result.length).toBe(2); // The Room and No Metadata (both < 720)
  });

  it('combines multiple filters (AND logic)', () => {
    const result = filterMovies(movies, {
      genre: 'Drama',
      yearMin: 1990,
      ratingMin: 7.0,
    });
    expect(result.length).toBe(2); // A Bronx Tale and Blade Runner 2049
  });

  it('returns empty when no movies match', () => {
    const result = filterMovies(movies, { ratingMin: 9.5 });
    expect(result.length).toBe(0);
  });

  it('handles empty movie array', () => {
    const result = filterMovies([], { search: 'anything' });
    expect(result).toEqual([]);
  });
});
