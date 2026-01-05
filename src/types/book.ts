import { Types } from "mongoose";
import { Document } from "mongoose";

export interface IBook extends Document {
  _id: Types.ObjectId;
  externalId: string;
  alternativeIds?: string[] | [string];        // ID from the external API (e.g., Google Books/OpenLibrary ID)
  title: string;
  subtitle?: string;        // Optional: Not all books have subtitles
  authors: string[];
  genres: string[];
  releaseDate?: Date;       // Optional: Sometimes exact dates aren't available
  description?: string;
  averageRating?: number;   // Optional: New books might not have ratings yet
  ratingsCount?: number;
  languages: string[];
  coverImage?: string;      // URL to the cover image
  cover_i?: number;         // Specific to OpenLibrary covers
  isbn13?: string;
  isStale? : boolean; // to check if the data is being updated in the last 7 days
  links?: { title: string; url: string; }[];
  createdAt: Date;
  updatedAt: Date;
}