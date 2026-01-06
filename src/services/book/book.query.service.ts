import axios from "axios";
import https from "https";
import Book from "../../models/books.model";
import { OpenLibraryFactory } from "../../utils/OpenLibraryDataCleaner";
import ApiError from "../../utils/ApiError";
import { IBook } from "../../types/book";

// Optimized HTTP client with connection pooling
const openLibClient = axios.create({
  baseURL: "https://openlibrary.org",
  httpsAgent: new https.Agent({
    keepAlive: true,
    maxSockets: 50,        // Increased connection pool
    maxFreeSockets: 10,
    timeout: 60000,
    keepAliveMsecs: 30000,
  }),
  headers: {
    "User-Agent": "Recto 1.0 (recto.help@gmail.com)",
  },
  timeout: 3000,           // Reduced timeout for faster failures
});

class BookQueryService {
  /**
   * PRIMARY METHOD: Fast Book Resolution with Smart Enrichment (OPTIMIZED)
   *
   * FLOW:
   * 1. Find book by externalId or alternativeIds (single efficient query)
   * 2. If not found, try title+authors fallback
   * 3. If found: Check staleness (7 days), enrich if needed, update timestamp
   * 4. If not found: Fetch from API, create new document
   *
   * IMPROVEMENTS OVER ORIGINAL:
   * - Uses $or query for ID lookups (single DB call instead of 2)
   * - Parallel title+author lookup only if needed
   * - Staleness check prevents unnecessary API calls
   * - Single save operation for updates
   * - Efficient enrichment (only fetch if stale or missing critical data)
   *
   * TARGET: <50ms cache hits, <300ms for API fetch
   */
  resolveBook = async (
    externalId: string,
    title?: string,
    authors?: string[],
  ): Promise<IBook> => {
    const STALE_THRESHOLD = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    // --- STEP 1: Efficient ID Lookup (Single $or query) ---
    let targetBook = await Book.findOne({
      $or: [{ externalId }, { alternativeIds: externalId }],
    }).exec();
    let bookFoundByIdLookup = !!targetBook;

    // --- STEP 2: Fallback to Title+Authors (Only if ID lookup fails) ---
    if (!targetBook && title && authors) {
      targetBook = await this.findByTitleAndAuthors(title, authors);
    }

    // --- STEP 3: Staleness Check & Alternative WorkId Detection ---
    let shouldFetch = true;
    if (targetBook) {
      // Check if this is an alternative workId (different from primary)
      // Only treat as alternative if found via ID lookup, not title+authors
      const isAlternativeWorkId = 
        bookFoundByIdLookup &&
        targetBook.externalId !== externalId &&
        !targetBook.alternativeIds?.includes(externalId);
      
      const isStale =
        targetBook.updatedAt.getTime() < Date.now() - STALE_THRESHOLD;
      
      // If not stale AND not an alternative workId, return immediately
      if (!isStale && !isAlternativeWorkId) {
        return targetBook;
      }
      
      // If stale OR alternative workId, fetch and enrich
      shouldFetch = true;
    }

    // --- STEP 4: Fetch from API (if needed) ---
    let apiData;
    let enrichmentNeeded = false;

    if (shouldFetch) {
      try {
        const response = await openLibClient.get(`/works/${externalId}.json`);
        apiData = response.data;
        enrichmentNeeded = true;
      } catch (error: any) {
        // API call failed - return existing book if available
        if (targetBook) {
          return targetBook;
        }
        if (error.response?.status === 404) {
          throw new ApiError(404, "Book not found in Open Library");
        }
        throw new ApiError(500, "Failed to fetch from Open Library");
      }
    }

    // --- STEP 5: Normalize API Data ---
    if (!apiData) {
      throw new ApiError(500, "Failed to fetch book data from OpenLibrary");
    }
    const newBook = OpenLibraryFactory.normalizeWorkData(apiData, {
      title,
      authors,
    });

    // --- STEP 6: Enrichment & ID Linking ---
    if (targetBook && enrichmentNeeded) {
      // Enrich existing document with new data
      let isUpdated = false;

      // A. Description enrichment (prefer longer, skip if identical)
      const newDesc = newBook.description || "";
      const currentDesc = targetBook.description || "";
      if (newDesc && newDesc !== currentDesc && newDesc.length > currentDesc.length) {
        targetBook.description = newDesc;
        isUpdated = true;
      }

      // B. Cover enrichment (fill if missing)
      if (!targetBook.coverImage && newBook.coverImage) {
        targetBook.coverImage = newBook.coverImage;
        targetBook.cover_i = newBook.cover_i;
        isUpdated = true;
      }

      // C. Subtitle enrichment (fill if missing)
      if (!targetBook.subtitle && newBook.subtitle) {
        targetBook.subtitle = newBook.subtitle;
        isUpdated = true;
      }

      // D. Release date enrichment (fill if missing)
      if (!targetBook.releaseDate && newBook.releaseDate) {
        targetBook.releaseDate = newBook.releaseDate;
        isUpdated = true;
      }

      // E. Author enrichment (merge if new data has additional authors)
      if (newBook.authors && newBook.authors.length > 0) {
        const mergedAuthors = this.mergeAuthors(targetBook.authors || [], newBook.authors);
        if (mergedAuthors.length > (targetBook.authors?.length || 0)) {
          targetBook.authors = mergedAuthors;
          isUpdated = true;
        }
      }

      // F. Genre enrichment (merge if new data has additional genres)
      if (newBook.genres && newBook.genres.length > 0) {
        const mergedGenres = this.mergeGenres(targetBook.genres || [], newBook.genres);
        if (mergedGenres.length > (targetBook.genres?.length || 0)) {
          targetBook.genres = mergedGenres;
          isUpdated = true;
        }
      }

      // G. Track alternative IDs for faster future lookups
      const isIdLinked =
        targetBook.externalId === externalId ||
        targetBook.alternativeIds?.includes(externalId);

      if (!isIdLinked) {
        if (!targetBook.alternativeIds) {
          targetBook.alternativeIds = [];
        }
        targetBook.alternativeIds.push(externalId);
        isUpdated = true;
      }

      // Save if enriched, otherwise just update timestamp
      if (isUpdated) {
        await targetBook.save();
      } else {
        // Update only timestamp without full save
        await Book.findByIdAndUpdate(targetBook._id, { 
          updatedAt: new Date() 
        });
      }

      return targetBook;
    }

    // --- STEP 7: Create New Document (if book not found) ---
    if (newBook.externalId !== externalId) {
      newBook.alternativeIds = [externalId];
    }

    const createdBook = await Book.create(newBook);

    // Fire-and-forget: backfill ISBN-13 from editions API (non-blocking) only if missing
    if (!createdBook.isbn13) {
      void this.backfillIsbn13(createdBook._id.toString(), createdBook.externalId || externalId);
    }
    return createdBook;
  };

  /**
   * Smart Title+Authors Matching
   * Tries multiple strategies to find same book with different title variations
   */
  private findByTitleAndAuthors = async (
    title: string,
    authors: string[],
  ) => {
    // Strategy 1: Exact title + exact authors match (case-insensitive)
    const exactRegex = new RegExp(`^${this.escapeRegex(title)}$`, "i");
    let book = await Book.findOne({
      title: { $regex: exactRegex },
      authors: { $all: authors },
    }).exec();

    if (book) return book;

    // Strategy 2: Exact title + partial author match
    // (Handles cases where one edition has additional editors/translators)
    if (authors && authors.length > 0) {
      book = await Book.findOne({
        title: { $regex: exactRegex },
        authors: { $in: authors }, // At least one author matches
      }).exec();

      // Verify it's a reasonable match (at least one primary author matches)
      if (book && this.hasCommonAuthors(book.authors, authors)) {
        return book;
      }
    }

    // Strategy 3: Normalized title match (remove common separators and extras)
    // Skip if no authors (would scan entire collection)
    if (!authors || authors.length === 0) {
      return null;
    }

    const normalizedTitle = this.normalizeTitle(title);
    
    // Find books with at least one matching author
    const candidateBooks = await Book.find(
      { authors: { $in: authors } }
    )
      .select("title authors externalId alternativeIds")
      .lean<IBook[]>()
      .exec();

    // Check if any candidate has a matching normalized title AND common authors
    for (const candidate of candidateBooks) {
      const candidateNormalized = this.normalizeTitle(candidate.title);
      
      // Check for substring match (handles bundled editions)
      const titleMatches = 
        candidateNormalized.includes(normalizedTitle) ||
        normalizedTitle.includes(candidateNormalized);

      const hasCommonAuthors = this.hasCommonAuthors(candidate.authors, authors);

      if (titleMatches && hasCommonAuthors) {
        // Return full document
        return await Book.findById(candidate._id).exec();
      }
    }

    return null;
  };

  /**
   * Check if two author lists have significant overlap
   * Returns true if at least one author name matches (case-insensitive, normalized)
   */
  private hasCommonAuthors = (authors1: string[], authors2: string[]): boolean => {
    if (!authors1 || !authors2 || authors1.length === 0 || authors2.length === 0) {
      return false;
    }

    // Normalize author names for comparison
    const normalized1 = authors1.map(a => this.normalizeAuthorName(a));
    const normalized2 = authors2.map(a => this.normalizeAuthorName(a));

    // Check if any author appears in both lists
    return normalized1.some(a1 => 
      normalized2.some(a2 => 
        a1.includes(a2) || a2.includes(a1)
      )
    );
  };

  /**
   * Normalize author name for better matching
   * - Lowercase
   * - Remove extra spaces
   * - Remove common suffixes (Jr., Sr., etc.)
   */
  private normalizeAuthorName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/\s+(jr\.?|sr\.?|ii|iii|iv)$/i, "") // Remove suffixes
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  };

  /**
   * Merge two author lists, avoiding duplicates
   * Returns combined list with unique authors (case-insensitive comparison)
   */
  private mergeAuthors = (existing: string[], newAuthors: string[]): string[] => {
    const merged = [...existing];
    const normalizedExisting = existing.map(a => this.normalizeAuthorName(a));

    for (const newAuthor of newAuthors) {
      const normalizedNew = this.normalizeAuthorName(newAuthor);
      
      // Only add if not already present (case-insensitive check)
      const isDuplicate = normalizedExisting.some(existingNorm => 
        existingNorm === normalizedNew || 
        existingNorm.includes(normalizedNew) || 
        normalizedNew.includes(existingNorm)
      );

      if (!isDuplicate) {
        merged.push(newAuthor);
        normalizedExisting.push(normalizedNew);
      }
    }

    return merged;
  };

  /**
   * Merge two genre lists, avoiding duplicates
   * Returns combined list with unique genres (case-insensitive comparison)
   */
  private mergeGenres = (existing: string[], newGenres: string[]): string[] => {
    const merged = [...existing];
    const normalizedExisting = existing.map(g => g.toLowerCase().trim());

    for (const newGenre of newGenres) {
      const normalizedNew = newGenre.toLowerCase().trim();
      
      // Only add if not already present (case-insensitive check)
      if (!normalizedExisting.includes(normalizedNew)) {
        merged.push(newGenre);
        normalizedExisting.push(normalizedNew);
      }
    }

    return merged;
  };

  /**
   * Non-blocking backfill of ISBN-13 from editions endpoint
   * Runs only once after book creation; does not impact user response time
   */
  private backfillIsbn13 = async (bookId: string, workId: string) => {
    if (!workId) return;

    // Avoid work if already set
    const existing = await Book.findById(bookId).select("isbn13").lean<{ isbn13?: string }>();
    if (existing?.isbn13) return;

    const attemptFetch = async () => {
      const response = await openLibClient.get(`/works/${workId}/editions.json`, {
        params: { limit: 5 },
      });

      const entries = (response.data?.entries || response.data?.editions || []) as any[];
      let isbn13: string | null = null;

      for (const edition of entries) {
        const candidate = Array.isArray(edition?.isbn_13)
          ? edition.isbn_13.find((i: string) => typeof i === "string" && i.trim().length > 0)
          : null;
        if (candidate) {
          isbn13 = candidate.trim();
          break;
        }
      }

      if (isbn13) {
        // Only set if not already present to avoid repeated runs
        await Book.findOneAndUpdate(
          { _id: bookId, $or: [{ isbn13: { $exists: false } }, { isbn13: "" }, { isbn13: null }] },
          { $set: { isbn13 } },
          { new: false },
        ).exec();
      }
    };

    // Try once, and retry once on failure (non-blocking, no throw)
    try {
      await attemptFetch();
    } catch (_err) {
      try {
        // brief delay before retry to avoid immediate repeat failure
        await new Promise((resolve) => setTimeout(resolve, 200));
        await attemptFetch();
      } catch (_err2) {
        return; // swallow to keep non-blocking
      }
    }
  };

  /**
   * Normalize title for better matching
   * - Converts to lowercase
   * - Removes common separators (-, :, |)
   * - Removes extra whitespace
   * - Removes articles (the, a, an)
   */
  private normalizeTitle = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/^(the|a|an)\s+/i, "") // Remove leading articles
      .replace(/[:\-|–—]/g, " ") // Replace separators with space
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  };

  /**
   * Escape regex special characters
   */
  private escapeRegex = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

}

export const bookQueryService = new BookQueryService();
