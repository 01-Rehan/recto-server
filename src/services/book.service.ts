import axios from "axios";
import https from "https";
import Book from "../models/books.model";
import { OpenLibraryFactory } from "../utils/OpenLibraryDataCleaner";
import ApiError from "../utils/ApiError";

const openLibClient = axios.create({
  baseURL: "https://openlibrary.org",
  httpAgent: new https.Agent({ keepAlive: true }),
  headers: {
    "User-Agent": "Recto 1.0 (recto.help@gmail.com)",
    "Accept-Encoding": "gzip, deflate,compress",
  },
  timeout: 5000,
});

class BookServices {
  getBook = async (
    externalId: string,
    title: string,
    authors: string,
    otherInfo: Object,
  ) => {
    let targetBook = await Book.findOne({
      $or: [{ externalId }, { alternativeIds: externalId }],
    });

    // (Prevents duplicates if OpenLibrary changes IDs for the same book)
    if (!targetBook && title && authors) {
      const titleRegex = new RegExp(`^${title}$`, "i");
      targetBook = await Book.findOne({
        title: { $regex: titleRegex },
        authors: { $regex: authors, $options: "i" },
      });
    }

    let shouldFetch = true;
    if (targetBook) {
      const isStale =
        targetBook.updatedAt.getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (!isStale) {
        return targetBook;
      }
      shouldFetch = true;
    }

    let apiData;
    if (shouldFetch) {
      try {
        const apiResponse = await openLibClient.get(
          `/works/${externalId}.json`,
        );
        apiData = apiResponse.data;
      } catch (error: any) {
        if (targetBook) return targetBook;
        if (error.response.status === 404)
          throw new ApiError(404, "Book not found in external source");
        throw error;
      }
    }

    const newBook = OpenLibraryFactory.normalizeWorkData(apiData, otherInfo);

    if (targetBook) {
      let isUpdated = false;

      const newBookDesc = newBook.description || "";
      const currentBookDesc = targetBook.description || "";

      if (newBookDesc && newBookDesc.length > currentBookDesc.length) {
        targetBook.description = newBookDesc;
        isUpdated = true;
      }
      // B. Enrich Cover
      if (!targetBook.coverImage && newBook.coverImage) {
        targetBook.coverImage = newBook.coverImage;
        targetBook.cover_i = newBook.cover_i;
        isUpdated = true;
      }

      // C. Enrich Subtitle
      if (!targetBook.subtitle && newBook.subtitle) {
        targetBook.subtitle = newBook.subtitle;
        isUpdated = true;
      }

      // D. Enrich Release Date
      if (!targetBook.releaseDate && newBook.releaseDate) {
        targetBook.releaseDate = newBook.releaseDate;
        isUpdated = true;
      }

      // Always link the IDs so we find it faster next time
      // Check if externalId is already the main ID or in alternatives
      const isIdLinked =
        targetBook.externalId === externalId ||
        targetBook.alternativeIds?.includes(externalId);

      if (!isIdLinked) {
        targetBook.alternativeIds = targetBook.alternativeIds || [];
        targetBook.alternativeIds.push(externalId);
        isUpdated = true;
      }

      if (isUpdated) {
        await targetBook.save();
      }else{
        await Book.findByIdAndUpdate(targetBook._id, {updatedAt: new Date()})
      }

      return targetBook;
    }

    if (newBook.externalId !== externalId) {
      newBook.alternativeIds = [externalId];
    }
    const createdBook = await Book.create(newBook);
    return createdBook;
  };
}

export const bookServices = new BookServices();
