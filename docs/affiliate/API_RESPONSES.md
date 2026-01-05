# Purchase Links API - Response Examples

## Endpoint
```
GET /api/v1/book/purchase-links/:bookId
```

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "all": {
      "amazon": {
        "name": "Amazon",
        "platform": "amazon",
        "url": "https://www.amazon.com/s?k=The%20Great%20Gatsby&tag=yoursite-20",
        "icon": "📕"
      },
      "audible": {
        "name": "Audible",
        "platform": "audible",
        "url": "https://www.audible.com/search?keywords=The%20Great%20Gatsby&tag=yoursite-20",
        "icon": "🎧"
      },
      "applebooks": {
        "name": "Apple Books",
        "platform": "applebooks",
        "url": "https://books.apple.com/search?term=The%20Great%20Gatsby&at=your-token",
        "icon": "📙"
      },
      "googleplay": {
        "name": "Google Play Books",
        "platform": "googleplay",
        "url": "https://play.google.com/store/search?q=The%20Great%20Gatsby&c=books",
        "icon": "📕"
      },
      "kobo": {
        "name": "Kobo",
        "platform": "kobo",
        "url": "https://www.kobo.com/us/en/search?query=The%20Great%20Gatsby&affid=your-id",
        "icon": "📔"
      },
      "barnesandnoble": {
        "name": "Barnes & Noble",
        "platform": "barnesandnoble",
        "url": "https://www.barnesandnoble.com/s/The%20Great%20Gatsby",
        "icon": "📗"
      },
      "bookshoporg": {
        "name": "Bookshop.org",
        "platform": "bookshoporg",
        "url": "https://bookshop.org/search?q=The%20Great%20Gatsby&aff=your-id",
        "icon": "🏪"
      },
      "scribd": {
        "name": "Scribd",
        "platform": "scribd",
        "url": "https://www.scribd.com/search?query=The%20Great%20Gatsby",
        "icon": "📋"
      },
      "libby": {
        "name": "Libby (Free Library)",
        "platform": "libby",
        "url": "https://libbydevices.com/search/The%20Great%20Gatsby",
        "icon": "🏛️"
      },
      "standardebooks": {
        "name": "Standard Ebooks",
        "platform": "standardebooks",
        "url": "https://standardebooks.org/search?query=The%20Great%20Gatsby",
        "icon": "📚"
      },
      "gutenberg": {
        "name": "Project Gutenberg",
        "platform": "gutenberg",
        "url": "https://www.gutenberg.org/ebooks/search/?query=The%20Great%20Gatsby",
        "icon": "📖"
      },
      "openlibrary": {
        "name": "Open Library",
        "platform": "openlibrary",
        "url": "https://openlibrary.org/works/OL45883W",
        "icon": "🔓"
      },
      "smashwords": {
        "name": "Smashwords",
        "platform": "smashwords",
        "url": "https://www.smashwords.com/books/search?query=The%20Great%20Gatsby",
        "icon": "✍️"
      },
      "thriftbooks": {
        "name": "ThriftBooks",
        "platform": "thriftbooks",
        "url": "https://www.thriftbooks.com/search/?q=The%20Great%20Gatsby",
        "icon": "♻️"
      },
      "betterworldbooks": {
        "name": "Better World Books",
        "platform": "betterworldbooks",
        "url": "https://www.betterworldbooks.com/search/results?q=The%20Great%20Gatsby",
        "icon": "🌍"
      }
    },
    "grouped": {
      "affiliate": {
        "amazon": {
          "name": "Amazon",
          "platform": "amazon",
          "url": "https://www.amazon.com/s?k=The%20Great%20Gatsby&tag=yoursite-20",
          "icon": "📕"
        },
        "audible": {
          "name": "Audible",
          "platform": "audible",
          "url": "https://www.audible.com/search?keywords=The%20Great%20Gatsby&tag=yoursite-20",
          "icon": "🎧"
        },
        "applebooks": {
          "name": "Apple Books",
          "platform": "applebooks",
          "url": "https://books.apple.com/search?term=The%20Great%20Gatsby&at=your-token",
          "icon": "📙"
        },
        "kobo": {
          "name": "Kobo",
          "platform": "kobo",
          "url": "https://www.kobo.com/us/en/search?query=The%20Great%20Gatsby&affid=your-id",
          "icon": "📔"
        },
        "barnesandnoble": {
          "name": "Barnes & Noble",
          "platform": "barnesandnoble",
          "url": "https://www.barnesandnoble.com/s/The%20Great%20Gatsby",
          "icon": "📗"
        },
        "bookshoporg": {
          "name": "Bookshop.org",
          "platform": "bookshoporg",
          "url": "https://bookshop.org/search?q=The%20Great%20Gatsby&aff=your-id",
          "icon": "🏪"
        },
        "googleplay": {
          "name": "Google Play Books",
          "platform": "googleplay",
          "url": "https://play.google.com/store/search?q=The%20Great%20Gatsby&c=books",
          "icon": "📕"
        }
      },
      "free": {
        "openlibrary": {
          "name": "Open Library",
          "platform": "openlibrary",
          "url": "https://openlibrary.org/works/OL45883W",
          "icon": "🔓"
        },
        "gutenberg": {
          "name": "Project Gutenberg",
          "platform": "gutenberg",
          "url": "https://www.gutenberg.org/ebooks/search/?query=The%20Great%20Gatsby",
          "icon": "📖"
        },
        "standardebooks": {
          "name": "Standard Ebooks",
          "platform": "standardebooks",
          "url": "https://standardebooks.org/search?query=The%20Great%20Gatsby",
          "icon": "📚"
        },
        "libby": {
          "name": "Libby (Free Library)",
          "platform": "libby",
          "url": "https://libbydevices.com/search/The%20Great%20Gatsby",
          "icon": "🏛️"
        }
      },
      "discount": {
        "thriftbooks": {
          "name": "ThriftBooks",
          "platform": "thriftbooks",
          "url": "https://www.thriftbooks.com/search/?q=The%20Great%20Gatsby",
          "icon": "♻️"
        },
        "betterworldbooks": {
          "name": "Better World Books",
          "platform": "betterworldbooks",
          "url": "https://www.betterworldbooks.com/search/results?q=The%20Great%20Gatsby",
          "icon": "🌍"
        },
        "scribd": {
          "name": "Scribd",
          "platform": "scribd",
          "url": "https://www.scribd.com/search?query=The%20Great%20Gatsby",
          "icon": "📋"
        },
        "smashwords": {
          "name": "Smashwords",
          "platform": "smashwords",
          "url": "https://www.smashwords.com/books/search?query=The%20Great%20Gatsby",
          "icon": "✍️"
        }
      }
    }
  },
  "message": "Purchase links fetched successfully"
}
```

## Error Responses

### Book Not Found (404)
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Book not found",
  "data": null
}
```

### Invalid Book ID (400)
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid book ID format",
  "data": null
}
```

## Response Headers
```
Cache-Control: public, max-age=3600
Content-Type: application/json
```

## Usage Examples

### JavaScript/Fetch
```javascript
async function getPurchaseLinks(bookId) {
  const response = await fetch(`/api/v1/book/purchase-links/${bookId}`);
  const { data } = await response.json();
  
  return {
    all: data.all,
    byCategory: data.grouped
  };
}

// Use in component
const links = await getPurchaseLinks('507f1f77bcf86cd799439011');

// Display affiliate links
links.byCategory.affiliate.forEach(link => {
  console.log(`${link.icon} ${link.name}: ${link.url}`);
});
```

### React Example
```jsx
function PurchaseLinksModal({ bookId }) {
  const [links, setLinks] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/book/purchase-links/${bookId}`)
      .then(res => res.json())
      .then(json => {
        setLinks(json.data.grouped);
        setLoading(false);
      });
  }, [bookId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="purchase-modal">
      <section>
        <h3>💰 Best Prices (with commission)</h3>
        {Object.entries(links.affiliate).map(([key, link]) => (
          <a key={key} href={link.url} target="_blank" rel="noopener">
            {link.icon} {link.name}
          </a>
        ))}
      </section>

      <section>
        <h3>🆓 Free Options</h3>
        {Object.entries(links.free).map(([key, link]) => (
          <a key={key} href={link.url} target="_blank" rel="noopener">
            {link.icon} {link.name}
          </a>
        ))}
      </section>

      <section>
        <h3>💚 Save Money (Used Books)</h3>
        {Object.entries(links.discount).map(([key, link]) => (
          <a key={key} href={link.url} target="_blank" rel="noopener">
            {link.icon} {link.name}
          </a>
        ))}
      </section>
    </div>
  );
}
```

### cURL
```bash
# Get purchase links for a book
curl -X GET "http://localhost:8080/api/v1/book/purchase-links/507f1f77bcf86cd799439011" \
  -H "Accept: application/json"

# Pretty print with jq
curl -s "http://localhost:8080/api/v1/book/purchase-links/507f1f77bcf86cd799439011" | jq '.data.grouped'
```

### Postman Collection
```json
{
  "info": {
    "name": "Recto API - Purchase Links",
    "description": "Get all available purchase links for a book"
  },
  "item": [
    {
      "name": "Get Purchase Links",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{BASE_URL}}/book/purchase-links/:bookId",
          "host": ["{{BASE_URL}}"],
          "path": ["book", "purchase-links", ":bookId"]
        }
      },
      "response": []
    }
  ]
}
```

## Performance Notes

- **Response Time**: < 50ms (single DB lookup)
- **Cache Duration**: 1 hour (can increase to 24h)
- **No External APIs**: All URLs built locally
- **Database Indexed**: Book ID is indexed

## Link Format Examples

### Amazon
```
https://www.amazon.com/s?k=BOOK_TITLE&tag=AFFILIATE_ID
```

### Apple Books
```
https://books.apple.com/search?term=BOOK_TITLE&at=AFFILIATE_ID
```

### Kobo
```
https://www.kobo.com/us/en/search?query=BOOK_TITLE&affid=AFFILIATE_ID
```

### Bookshop.org
```
https://bookshop.org/search?q=BOOK_TITLE&aff=AFFILIATE_ID
```

