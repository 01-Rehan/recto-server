# Purchase Links & Affiliate Integration

## Overview

The purchase links feature generates affiliate links for book purchases across 15+ major platforms. Users can click "Buy Book" to see all available purchase options organized by category.

## Supported Platforms

### **Affiliate Programs** (Generate Commission)

1. **Amazon** - Largest selection, fast shipping
   - Setup: https://affiliate-program.amazon.com
   - Env: `AMAZON_AFFILIATE_ID`
2. **Audible** - Audiobooks
   - Uses Amazon Associates program
   - Env: `AMAZON_AFFILIATE_ID`
3. **Apple Books** - Ebooks
   - Setup: https://books.apple.com/us/about/affiliate
   - Env: `APPLE_BOOKS_AFFILIATE_ID`
4. **Kobo** - Ebooks & DRM-free
   - Setup: https://www.kobo.com/us/en/p/affiliates
   - Env: `KOBO_AFFILIATE_ID`
5. **Barnes & Noble** - Physical & Ebooks
   - Setup: https://www.barnesandnoble.com
   - Env: `BN_AFFILIATE_ID`
6. **Google Play Books** - Ebooks
   - Commission structure varies
   - Env: Not yet configured
7. **Bookshop.org** - Support independent bookstores
   - Setup: https://bookshop.org/pages/publishers
   - Env: `BOOKSHOP_AFFILIATE_ID`

### **Free/Non-Affiliate Platforms**

- Open Library - Free borrowing
- Project Gutenberg - Free public domain
- Standard Ebooks - Free public domain (formatted)
- Libby - Free through library system

### **Discount Platforms**

- ThriftBooks - Used books
- Better World Books - Used & new books
- Scribd - Digital library subscription
- Smashwords - Independent ebook publishing

## API Usage

### Get Purchase Links for a Book

```
GET /api/v1/book/purchase-links/:bookId
```

**Response:**

```json
{
  "success": true,
  "data": {
    "all": {
      "amazon": {
        "name": "Amazon",
        "platform": "amazon",
        "url": "https://www.amazon.com/s?k=...",
        "icon": "📕"
      },
      "audible": { ... },
      "applebooks": { ... },
      // ... more platforms
    },
    "grouped": {
      "affiliate": {
        "amazon": { ... },
        "audible": { ... }
        // Other affiliate links
      },
      "free": {
        "openlibrary": { ... },
        "gutenberg": { ... }
        // Other free sources
      },
      "discount": {
        "thriftbooks": { ... },
        "betterworldbooks": { ... }
        // Discount/used book sources
      }
    }
  },
  "message": "Purchase links fetched successfully"
}
```

## Frontend Integration Example

```typescript
// When user clicks "Buy Book" button
const handleBuyClick = async (bookId: string) => {
  try {
    const response = await fetch(`/api/v1/book/purchase-links/${bookId}`);
    const { data } = await response.json();

    // Show modal with grouped links
    showPurchaseModal({
      affiliate: data.grouped.affiliate,
      free: data.grouped.free,
      discount: data.grouped.discount,
    });
  } catch (error) {
    console.error('Failed to load purchase links', error);
  }
};

// Example: Display links by category
function renderPurchaseLinks(grouped) {
  return (
    <>
      <section>
        <h3>📙 Affiliate Links (Support us via commission)</h3>
        {Object.entries(grouped.affiliate).map(([key, link]) => (
          <a href={link.url} target="_blank">
            {link.icon} {link.name}
          </a>
        ))}
      </section>

      <section>
        <h3>🆓 Free Options (Library, Public Domain)</h3>
        {Object.entries(grouped.free).map(([key, link]) => (
          <a href={link.url} target="_blank">
            {link.icon} {link.name}
          </a>
        ))}
      </section>

      <section>
        <h3>💰 Used & Discount Books</h3>
        {Object.entries(grouped.discount).map(([key, link]) => (
          <a href={link.url} target="_blank">
            {link.icon} {link.name}
          </a>
        ))}
      </section>
    </>
  );
}
```

## Setup Instructions

### 1. Get Affiliate IDs from Programs

**Amazon Associates:**

- Go to: https://affiliate-program.amazon.com
- Sign up and create campaign
- Get your associate tag (e.g., `yoursite-20`)
- Minimum commission: 4-10% depending on category

**Apple Books:**

- Go to: https://books.apple.com/us/about/affiliate
- Sign up for Apple Affiliate Program
- Get your affiliate token

**Kobo:**

- Go to: https://www.kobo.com/us/en/p/affiliates
- Register your website
- Get your affiliate ID

**Bookshop.org:**

- Go to: https://bookshop.org/pages/publishers
- Register and get affiliate link

**Barnes & Noble:**

- Contact B&N directly for partnership opportunities
- Or use through other affiliate networks

### 2. Add to Environment Variables

Update `.env` file:

```env
AMAZON_AFFILIATE_ID=yoursite-20
APPLE_BOOKS_AFFILIATE_ID=your-apple-token
KOBO_AFFILIATE_ID=your-kobo-id
BOOKSHOP_AFFILIATE_ID=your-bookshop-id
BN_AFFILIATE_ID=your-bn-id
```

### 3. Test the Endpoint

```bash
curl "http://localhost:8080/api/v1/book/purchase-links/[bookId]"
```

## Features

✅ **15+ Platforms** - Cover most book retailers  
✅ **Organized by Category** - Affiliate, Free, Discount  
✅ **Dynamic URL Building** - Uses book title and ISBN  
✅ **Environment-based** - Easy configuration  
✅ **Non-blocking** - Lazy-loaded on demand  
✅ **Cacheable** - 1-hour cache header  
✅ **Transparent** - Shows all options to users

## Revenue Potential

**Estimated Commission Rates:**

- **Amazon** - 4-5% for books
- **Audible** - 5-10% for new members
- **Apple Books** - Up to 15-20%
- **Bookshop.org** - 10% affiliate commission
- **Kobo** - 20% affiliate commission
- **Smashwords** - 50% for referrals

**Example:** If 1,000 users/month purchase through your links:

- Average book price: $15
- Average conversion: 2-3%
- 20-30 purchases/month
- At 5% commission: $15-22.50/month

## Best Practices

1. **Be Transparent** - Clearly show this is an affiliate link
2. **Offer Alternatives** - Include free and discount options
3. **Add Disclaimers** - Inform users about affiliate relationships
4. **Track Performance** - Monitor which platforms drive sales
5. **Optimize for Mobile** - Users browse books on phones
6. **Test Links Regularly** - Ensure all URLs work

## Future Enhancements

- [ ] Track click analytics per platform
- [ ] A/B test link presentation
- [ ] Regional variations (Amazon.com vs Amazon.co.uk)
- [ ] Price comparison across platforms
- [ ] User preference for preferred retailer
- [ ] Integration with price tracking APIs
- [ ] SMS/Email notifications for price drops

## Troubleshooting

**Links not generating:**

- Check affiliate IDs are set in `.env`
- Verify book has `title` field
- Check browser console for CORS issues

**No commission tracking:**

- Each platform has its own tracking
- Log into affiliate dashboard to see stats
- May take 24-48 hours to appear

**Link errors:**

- Test URL directly in browser
- Ensure book title is URL-encoded properly
- Check affiliate ID format is correct

## Code Structure

```
src/
├── services/
│   └── affiliate.service.ts          # Link generation logic
├── controller/
│   └── book.controller.ts            # getPurchaseLinksController
└── routes/
    └── book.route.ts                 # /purchase-links/:bookId route
```

## Performance

- **Endpoint Response Time**: < 50ms (no external API calls)
- **Cache Duration**: 1 hour
- **Database Query**: Single book lookup by ID
- **Zero Blocking Operations**: Responds immediately
