# Google Search Console — verify + submit sitemap

You have ~15 minutes of clicks ahead. After this, Google actively monitors your site's indexing, rankings, and crawl errors.

## Step 1 — Add the property

1. Go to **https://search.google.com/search-console**
2. Click the property selector (top-left) → **Add property**
3. Pick **URL prefix** (the right-hand box)
4. Enter exactly: `https://mjrifat.com/`
5. Click **Continue**

Google shows a verification dialog with several methods. Use **either** of these:

## Option A — HTML tag (fastest, recommended)

This uses the meta tag already in the code. You just need to drop your unique value in.

1. In the verification dialog → expand **HTML tag**
2. Copy the content value from the snippet Google shows you. It looks like:
   ```
   google-site-verification=abc123DEF456...
   ```
   You only need the part after `content="` — a ~50-char random-looking string.
3. Open **`C:/Users/Mj/portfolio/index.html`**
4. Find this line:
   ```html
   <meta name="google-site-verification" content="REPLACE_ME" />
   ```
5. Replace `REPLACE_ME` with your value. Keep the quotes.
6. Do the same find-and-replace on these files:
   ```
   _build_subpages.py
   work/proworkspace/index.html
   ```
7. Regenerate subpages:
   ```powershell
   cd C:\Users\Mj\portfolio
   python _build_subpages.py
   ```
8. Commit and push via `sync.bat`
9. Wait ~1 min for GitHub Pages to deploy
10. Back in Search Console → click **Verify**

✓ Should say "Ownership verified". You're in.

## Option B — DNS TXT record (verifies whole domain, including future subdomains)

1. In the verification dialog → expand **Domain name provider** or use the **Domain** property type
2. Google shows a TXT record, e.g.
   ```
   google-site-verification=abc123DEF456...
   ```
3. Log into your domain registrar (the same one where you set up `mjrifat.com`)
4. Go to the DNS records panel for `mjrifat.com`
5. Add a new record:
   ```
   Type:   TXT
   Host:   @    (or leave blank / root)
   Value:  google-site-verification=abc123DEF456...
   TTL:    default
   ```
6. Save
7. Wait 5–30 min for DNS propagation
8. Click **Verify** in Search Console

Option B is better long-term because it automatically covers subdomains (`crm.mjrifat.com` etc).

## Step 2 — Submit your sitemap

Once verified:

1. Search Console → your property → **Sitemaps** (left sidebar)
2. In the "Add a new sitemap" field, enter: `sitemap.xml`
3. Click **Submit**

Google should show **Success** within a minute. It'll start crawling your 22 URLs.

## Step 3 — Force-crawl your top pages

Don't wait the usual 3–7 days for natural crawling. Speed it up manually:

1. Search Console → **URL Inspection** (top search bar)
2. Paste: `https://mjrifat.com/`
3. Click **Request Indexing**
4. Wait ~1 min, you'll get "URL added to priority crawl queue"
5. Repeat for:
   - `https://mjrifat.com/about/`
   - `https://mjrifat.com/work/`
   - `https://mjrifat.com/services/`
   - `https://mjrifat.com/contact/`
   - `https://mjrifat.com/work/brandivibe/`
   - `https://mjrifat.com/work/proworkspace/`

You're rate-limited to ~10 manual requests per day. That's enough to cover the key pages in one session.

## Step 4 — Check back in 3–7 days

- **Coverage** → see which pages Google indexed (or why any were skipped)
- **Performance** → first impressions/clicks data
- **Enhancements → Breadcrumbs** → verify the BreadcrumbList schema we added renders properly
- **Enhancements → Person** → verify the Person schema from `index.html` renders

If any page shows "Not indexed: Discovered — currently not indexed" after a week, the usual fix is backlinks (share the URL on Upwork/LinkedIn/Twitter to signal to Google that the page matters).

## Pro tips

- **Also add `https://mjrifat.com/` as a Property in Bing Webmaster Tools** (bing.com/webmasters). Free, same verification flow, ~15% of your global traffic will come from Bing/DuckDuckGo/Yahoo.
- **Link Google Analytics** (if you add GA4 later) — Search Console shows "queries that led to clicks", GA4 shows what those visitors did next. Together = full funnel.
- **Request indexing again after every content change** to your top pages — don't wait for Google to rediscover.
