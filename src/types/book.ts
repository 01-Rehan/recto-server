import { Types } from "mongoose";
import { Document } from "mongoose";

export interface IBook extends Document {
  _id: Types.ObjectId;
  externalId: string;       // ID from the external API (e.g., Google Books/OpenLibrary ID)
  isbn?: string;
  title: string;
  subtitle?: string;        // Optional: Not all books have subtitles
  authors: string[];
  genres: string[];
  releaseDate?: Date;       // Optional: Sometimes exact dates aren't available
  description?: string;
  pageCount?: number;
  averageRating?: number;   // Optional: New books might not have ratings yet
  languages: string[];
  coverImage?: string;      // URL to the cover image
  cover_i?: number;         // Specific to OpenLibrary covers
}