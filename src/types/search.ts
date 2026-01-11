/**
 * Search API Types and Interfaces
 * Centralized types for book search operations across the application
 */

/**
 * OpenLibrary API Response - Raw search document from OpenLibrary API
 * Represents a single book entry in search results
 */
export interface IOpenLibrarySearchDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  isbn?: string[];
  number_of_pages_median?: number;
  subject?: string[];
}

/**
 * OpenLibrary API Response - Search response structure from OpenLibrary API
 * Contains pagination and results for search queries
 */
export interface IOpenLibrarySearchResponse {
  numFound: number;
  start: number;
  docs: IOpenLibrarySearchDoc[];
}

/**
 * Application Search Result - Normalized book data for API responses
 * Cleaned and filtered version of OpenLibrary data
 */
export interface ISearchResult {
  openLibraryId: string;
  title: string;
  author: string[];
  coverImage: string;
  publishedYear?: number;
  isbn?: string[];
}

/**
 * Application Search Response - Complete response returned to client
 * Includes books, pagination metadata, and filtering statistics
 */
export interface ISearchResponse {
  books: ISearchResult[];
  pagination: {
    currentPage: number;
    totalPages: number;
    limit: number;
    totalResults: number;
  };
  metadata: {
    query: string;
    totalFound: number;
    totalReturned: number;
    filtered: number;
  };
}

/**
 * Search Query Parameters - Validated query parameters from request
 * Used for both title and author searches
 */
export interface ISearchQueryParams {
  query: string; // Search term (title or author name)
  page: number;
  limit: number;
}

/**
 * Search Options - Configuration for search operations
 * Used internally by search service
 */
export interface ISearchOptions {
  maxRetries?: number;
  timeout?: number;
  fields?: string;
}
