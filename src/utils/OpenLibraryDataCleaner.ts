import { IBook } from "../types/book";

/**
 * OPEN LIBRARY RAW TYPES
 * Defines the structure of the response from https://openlibrary.org/works/{ID}.json
 */
export interface IOpenLibraryWork {
  key: string;
  title: string;
  subtitle?: string;
  description?: string | { type: string; value: string };
  subjects?: string[]; // These become your genres
  covers?: number[];
  first_publish_date?: string;
  authors?: Array<{ author: { key: string } }>;
  links?: Array<{ title: string; url: string }>;
}

/**
 * THE FACTORY UTILITY
 * Cleans and normalizes Open Library Work Data into your Database Schema format.
 */
export const OpenLibraryFactory = {
  /**
   * HELPER: Builds the cover image URL
   */
  getCoverUrl: (
    coverId: number | undefined,
    size: "S" | "M" | "L" = "L",
  ): string => {
    return coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`
      : "";
  },

  /**
   * HELPER: Parses Open Library's messy date strings
   * Ex: "2004", "May 2004", "2004-05-01" -> Date Object
   */
  parseDate: (dateString?: string): Date | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  },

  /**
   * HELPER: Extracts description which can be a string or an object
   */
  getDescription: (desc?: string | { value: string }): string => {
    if (!desc) return "";
    return typeof desc === "string" ? desc : desc.value || "";
  },

  normalizeWorkData: (
    workData: IOpenLibraryWork,
    fallbackData?: Partial<IBook>,
  ): Partial<IBook> => {
    // Logic: The Works API returns Author IDs (e.g. "/authors/OL123A"), not names.
    // If you passed fallback data (from a search result), use those names.
    // Otherwise, default to "Unknown" or you would need a separate API call to fetch author details.
    const normalizeAuthors = (input: string | string[] | undefined | null) => {
      if (!input) return ["Unknown Author"];
      // If it's a string, return it in an array (unless it's empty/whitespace)
      if (typeof input === "string")
        return input.trim() ? [input.trim()] : ["Unknown Author"];
      // If it's an array, return it if it has something
      if (Array.isArray(input))
        return input.length > 0 ? input : ["Unknown Author"];
      // Worst-case fallback
      return ["Unknown Author"];
    };

    const authors = normalizeAuthors(fallbackData?.authors);

    const coverId = workData.covers?.[0] || fallbackData?.cover_i;

    return {
      externalId: workData.key.replace("/works/", ""),
      title: fallbackData?.title?.trim() || workData.title,
      subtitle: workData.subtitle || "",
      authors: authors,
      description: OpenLibraryFactory.getDescription(workData.description),
      releaseDate:
        OpenLibraryFactory.parseDate(workData.first_publish_date) ||
        fallbackData?.releaseDate,
      genres: workData.subjects
        ? workData.subjects
        : fallbackData?.genres || [],
      cover_i: coverId,
      coverImage: OpenLibraryFactory.getCoverUrl(coverId),
      links: workData.links
        ? workData.links.map((link) => ({
            title: link.title,
            url: link.url,
          }))
        : fallbackData?.links || [],
    };
  },
};
