import { IBook } from "../../types/book";

interface AffiliateLink {
  name: string;
  url: string;
  platform: string;
}

interface PurchaseLinks {
  [key: string]: AffiliateLink;
}

type CountryCode = "US" | "UK" | "IN" | "CA" | "AU" | "DE" | "FR";

interface CountryConfig {
  amazonDomain: string;
  amazonRegion: string;
  koboRegion: string;
  appleBooksCountry: string;
}

const COUNTRY_CONFIGS: Record<CountryCode, CountryConfig> = {
  US: {
    amazonDomain: "amazon.com",
    amazonRegion: "us",
    koboRegion: "us/en",
    appleBooksCountry: "us",
  },
  UK: {
    amazonDomain: "amazon.co.uk",
    amazonRegion: "uk",
    koboRegion: "gb/en",
    appleBooksCountry: "gb",
  },
  IN: {
    amazonDomain: "amazon.in",
    amazonRegion: "in",
    koboRegion: "in/en",
    appleBooksCountry: "in",
  },
  CA: {
    amazonDomain: "amazon.ca",
    amazonRegion: "ca",
    koboRegion: "ca/en",
    appleBooksCountry: "ca",
  },
  AU: {
    amazonDomain: "amazon.com.au",
    amazonRegion: "au",
    koboRegion: "au/en",
    appleBooksCountry: "au",
  },
  DE: {
    amazonDomain: "amazon.de",
    amazonRegion: "de",
    koboRegion: "de/de",
    appleBooksCountry: "de",
  },
  FR: {
    amazonDomain: "amazon.fr",
    amazonRegion: "fr",
    koboRegion: "fr/fr",
    appleBooksCountry: "fr",
  },
};

class AffiliateService {
  /**
   * Get country-specific affiliate ID from environment variables
   * Falls back to default country (US) if specific country ID not found
   */
  private getAffiliateId = (
    platform: string,
    country: CountryCode = "US",
  ): string | undefined => {
    const envKey = `${platform.toUpperCase()}_AFFILIATE_ID_${country}`;
    const defaultEnvKey = `${platform.toUpperCase()}_AFFILIATE_ID`;

    return process.env[envKey] || process.env[defaultEnvKey];
  };

  /**
   * Generate purchase links for book retailers
   * Supports: Amazon, Kobo, Bookshop.org (US only), Project Gutenberg, Open Library
   * Country-aware: Generates country-specific URLs based on provided country code
   */
  generatePurchaseLinks = (
    book: IBook,
    country: CountryCode = "US",
  ): PurchaseLinks => {
    const links: PurchaseLinks = {};
    const config = COUNTRY_CONFIGS[country];
    const searchQuery = encodeURIComponent(book.title);

    // 1. AMAZON (Amazon Associates - country-specific)
    const amazonAffiliateId = this.getAffiliateId("amazon", country);
    if (amazonAffiliateId) {
      links.amazon = {
        name: "Amazon",
        platform: "amazon",
        url: `https://www.${config.amazonDomain}/s?k=${searchQuery}&tag=${amazonAffiliateId}`,
      };
    } else {
      // Fallback without affiliate tag
      links.amazon = {
        name: "Amazon",
        platform: "amazon",
        url: `https://www.${config.amazonDomain}/s?k=${searchQuery}`,
      };
    }

    // 2. KOBO (Affiliate: Kobo Affiliate Program - country-specific)
    const koboAffiliateId = this.getAffiliateId("kobo", country);
    if (koboAffiliateId) {
      links.kobo = {
        name: "Kobo",
        platform: "kobo",
        url: `https://www.kobo.com/${config.koboRegion}/search?query=${searchQuery}&affid=${koboAffiliateId}`,
      };
    } else {
      links.kobo = {
        name: "Kobo",
        platform: "kobo",
        url: `https://www.kobo.com/${config.koboRegion}/search?query=${searchQuery}`,
      };
    }

    // 3. BOOKSHOP.ORG (Support Independent Bookstores - US only)
    if (country === "US") {
      const bookshopAffiliateId = this.getAffiliateId("bookshop", country);
      if (bookshopAffiliateId) {
        links.bookshoporg = {
          name: "Bookshop.org",
          platform: "bookshoporg",
          url: `https://bookshop.org/search?q=${searchQuery}&aff=${bookshopAffiliateId}`,
        };
      } else {
        links.bookshoporg = {
          name: "Bookshop.org",
          platform: "bookshoporg",
          url: `https://bookshop.org/search?q=${searchQuery}`,
        };
      }
    }

    // 4. PROJECT GUTENBERG (Free Public Domain)
    links.gutenberg = {
      name: "Project Gutenberg",
      platform: "gutenberg",
      url: `https://www.gutenberg.org/ebooks/search/?query=${searchQuery}`,
    };

    // 5. OPEN LIBRARY (Free)
    if (book.externalId) {
      links.openlibrary = {
        name: "Open Library",
        platform: "openlibrary",
        url: `https://openlibrary.org/works/${book.externalId}`,
      };
    }

    return links;
  };

  /**
   * Get country code from user request or default to US
   * Can be called with user's country preference from request object
   */
  getCountryCode = (userCountry?: string): CountryCode => {
    const countryMap: Record<string, CountryCode> = {
      US: "US",
      UK: "UK",
      IN: "IN",
      CA: "CA",
      AU: "AU",
      DE: "DE",
      FR: "FR",
      // Add more mappings as needed
    };

    return countryMap[userCountry?.toUpperCase() || "US"] || "US";
  };

  /**
   * Get links grouped by category (Affiliate and Free)
   * Country-aware: Groups based on country availability
   */
  groupPurchaseLinksByCategory = (
    book: IBook,
    country: CountryCode = "US",
  ): { affiliate: PurchaseLinks; free: PurchaseLinks } => {
    const allLinks = this.generatePurchaseLinks(book, country);

    const affiliate: PurchaseLinks = {
      amazon: allLinks.amazon!,
      kobo: allLinks.kobo!,
    };

    // Add country-specific retailers to affiliate category
    if (country === "US" && allLinks.bookshoporg) {
      affiliate.bookshoporg = allLinks.bookshoporg;
    }

    return {
      affiliate,
      free: {
        openlibrary: allLinks.openlibrary!,
        gutenberg: allLinks.gutenberg!,
      },
    };
  };
}

export const affiliateService = new AffiliateService();
