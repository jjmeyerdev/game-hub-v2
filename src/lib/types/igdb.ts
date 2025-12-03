export interface IGDBGame {
  id: string;
  igdbId: number;
  name: string;
  cover: string | null;
  releaseDate: string | null;
  summary: string | null;
  genres: string[];
  platform: string;
  platforms: string[];
  developer: string | null;
}
