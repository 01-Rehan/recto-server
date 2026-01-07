# Purchase Links UI/UX Guide

## User Flow

```
Book Details Page
    ↓
[Buy Book] Button
    ↓
Modal Opens
    ↓
3 Categories Displayed:
├─ Affiliate Links (💰 Support us)
├─ Free Options (🆓 Library, Public Domain)
└─ Discount Options (💚 Save Money)
    ↓
User Clicks Link
    ↓
Opens Retailer in New Tab
    ↓
Affiliate tracking captures sale
```

## UI Component Structure

### Simple Version (All Links)

```html
<div class="purchase-links">
  <a href="amazon_link">📕 Amazon</a>
  <a href="audible_link">🎧 Audible</a>
  <a href="applebooks_link">📙 Apple Books</a>
  <a href="kobo_link">📔 Kobo</a>
  <a href="goodreads_link">👥 Goodreads</a>
  <a href="gutenberg_link">📖 Project Gutenberg (Free)</a>
</div>
```

### Categorized Version (Recommended)

```html
<div class="purchase-modal">
  <h2>Where to Buy</h2>

  <section class="affiliate-section">
    <h3>💰 Support Us (We Earn Commission)</h3>
    <p className="subtitle">Help support our platform</p>
    <div class="links-grid">
      <a href="amazon_link">
        <span class="icon">📕</span>
        <span class="name">Amazon</span>
        <span class="desc">Largest selection</span>
      </a>
      <a href="audible_link">
        <span class="icon">🎧</span>
        <span class="name">Audible</span>
        <span class="desc">Audiobook</span>
      </a>
      <a href="applebooks_link">
        <span class="icon">📙</span>
        <span class="name">Apple Books</span>
        <span class="desc">Ebook</span>
      </a>
      <a href="kobo_link">
        <span class="icon">📔</span>
        <span class="name">Kobo</span>
        <span class="desc">DRM-Free</span>
      </a>
    </div>
  </section>

  <section class="free-section">
    <h3>🆓 Free Options (Library, Public Domain)</h3>
    <div class="links-grid">
      <a href="libby_link">
        <span class="icon">🏛️</span>
        <span class="name">Libby</span>
        <span class="desc">Your Library</span>
      </a>
      <a href="openlibrary_link">
        <span class="icon">🔓</span>
        <span class="name">Open Library</span>
        <span class="desc">Borrow Free</span>
      </a>
      <a href="gutenberg_link">
        <span class="icon">📖</span>
        <span class="name">Project Gutenberg</span>
        <span class="desc">Public Domain</span>
      </a>
    </div>
  </section>

  <section class="discount-section">
    <h3>💚 Save Money (Used Books)</h3>
    <div class="links-grid">
      <a href="thriftbooks_link">
        <span class="icon">♻️</span>
        <span class="name">ThriftBooks</span>
        <span class="desc">Used Books</span>
      </a>
      <a href="bwb_link">
        <span class="icon">🌍</span>
        <span class="name">Better World Books</span>
        <span class="desc">Used & New</span>
      </a>
    </div>
  </section>
</div>
```

## React Implementation

### Minimal Hook

```jsx
function usePurchaseLinks(bookId) {
  const [links, setLinks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/v1/book/purchase-links/${bookId}`)
      .then((r) => r.json())
      .then((res) => {
        setLinks(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [bookId]);

  return { links, loading, error };
}
```

### Modal Component

```jsx
function PurchaseLinksModal({ bookId, isOpen, onClose }) {
  const { links, loading, error } = usePurchaseLinks(bookId);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <header>
          <h2>Where to Buy This Book</h2>
          <button onClick={onClose}>×</button>
        </header>

        {loading && <div>Loading purchase options...</div>}
        {error && <div className="error">Failed to load links</div>}

        {links && (
          <>
            <LinksSection
              title="💰 Support Us (Commission)"
              subtitle="Help us run this platform"
              links={links.grouped.affiliate}
            />
            <LinksSection
              title="🆓 Free Options"
              subtitle="Through your library or public domain"
              links={links.grouped.free}
            />
            <LinksSection
              title="💚 Save Money"
              subtitle="Used books and subscriptions"
              links={links.grouped.discount}
            />
          </>
        )}

        <footer>
          <small>
            We earn a small commission from affiliate links. This helps support
            Recto.
          </small>
        </footer>
      </div>
    </div>
  );
}

function LinksSection({ title, subtitle, links }) {
  return (
    <section className="links-section">
      <h3>{title}</h3>
      {subtitle && <p className="subtitle">{subtitle}</p>}
      <div className="links-grid">
        {Object.values(links).map((link) => (
          <LinkButton key={link.platform} link={link} />
        ))}
      </div>
    </section>
  );
}

function LinkButton({ link }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="link-button"
      onClick={() => {
        // Optional: Track analytics
        trackLinkClick(link.platform);
      }}
    >
      <span className="icon">{link.icon}</span>
      <span className="name">{link.name}</span>
    </a>
  );
}
```

### Trigger Button

```jsx
function BookDetailsPage() {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  return (
    <div className="book-details">
      {/* Book info */}
      <button
        className="btn-buy-book"
        onClick={() => setShowPurchaseModal(true)}
      >
        📖 Buy This Book
      </button>

      <PurchaseLinksModal
        bookId={book._id}
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
      />
    </div>
  );
}
```

## CSS Styling

```css
/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-content header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-content header h2 {
  margin: 0;
  font-size: 20px;
}

.modal-content header button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Sections */
.links-section {
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.links-section:last-of-type {
  border-bottom: none;
}

.links-section h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.links-section .subtitle {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #666;
}

/* Grid */
.links-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 480px) {
  .links-grid {
    grid-template-columns: 1fr;
  }
}

/* Links */
.link-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  text-align: center;
}

.link-button:hover {
  background: #efefef;
  border-color: #d0d0d0;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.link-button .icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.link-button .name {
  font-size: 13px;
  font-weight: 500;
}

/* Footer */
.modal-content footer {
  padding: 12px 20px;
  background: #fafafa;
  border-top: 1px solid #eee;
  text-align: center;
}

.modal-content footer small {
  color: #666;
  font-size: 12px;
}

/* Buy button */
.btn-buy-book {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-buy-book:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-buy-book:active {
  transform: translateY(0);
}
```

## Mobile Optimization

```css
@media (max-width: 640px) {
  .modal-content {
    max-width: 100%;
    border-radius: 12px 12px 0 0;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 80vh;
  }

  .links-grid {
    grid-template-columns: 1fr;
  }

  .link-button {
    flex-direction: row;
    justify-content: flex-start;
    padding: 12px;
  }

  .link-button .icon {
    font-size: 20px;
    margin: 0 12px 0 0;
  }
}
```

## Analytics Integration

```jsx
function trackLinkClick(platform) {
  // Google Analytics
  gtag("event", "purchase_link_click", {
    platform: platform,
    book_id: bookId,
    timestamp: new Date().toISOString(),
  });

  // Custom tracking
  fetch("/api/v1/analytics/link-click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      platform,
      bookId,
      timestamp: new Date(),
    }),
  });
}
```

## Accessibility

```jsx
<section className="links-section" role="region" aria-label="Purchase options">
  <a
    href={link.url}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={`Buy on ${link.name} (opens in new tab)`}
  >
    {link.icon} {link.name}
  </a>
</section>
```
