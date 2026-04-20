"""
One-shot generator for the portfolio's sub-page tree.

Run:  python _build_subpages.py

Generates every sub-page referenced from the restructured nav / footer.
All pages share a single template (HEAD/NAV/FOOT constants) and pull
their body from PAGES below. Keeps ~20 pages in lockstep style-wise.
"""

import os, pathlib, html

ROOT = pathlib.Path(__file__).resolve().parent

# ──────────────────────────────────────────────────────────────────
# SHARED CHROME — same header, footer, scripts on every sub-page.
# Relative paths use {up} placeholder → ../ for one-level, ../../ for
# two-level pages.
# ──────────────────────────────────────────────────────────────────

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title} — Muraduzzaman</title>
<meta name="description" content="{description}" />
<meta name="author" content="Muraduzzaman" />
<meta name="robots" content="index,follow,max-image-preview:large" />
<link rel="canonical" href="https://mjrifat.com/{canonical_path}" />

<meta property="og:type" content="website" />
<meta property="og:site_name" content="Muraduzzaman" />
<meta property="og:url" content="https://mjrifat.com/{canonical_path}" />
<meta property="og:title" content="{title} — Muraduzzaman" />
<meta property="og:description" content="{description}" />
<meta property="og:image" content="https://mjrifat.com/og-card.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="en_US" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{title} — Muraduzzaman" />
<meta name="twitter:description" content="{description}" />
<meta name="twitter:image" content="https://mjrifat.com/og-card.png" />

<link rel="icon" type="image/svg+xml" href="{up}favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="{up}favicon.png">
<link rel="apple-touch-icon" sizes="180x180" href="{up}apple-touch-icon.png">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,600&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;700&display=swap">
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,600&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,600&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet"></noscript>

<link rel="stylesheet" href="{up}styles.css">

<script type="application/ld+json">
{breadcrumb_json}
</script>
<script type="application/ld+json">
{webpage_json}
</script>
</head>
<body data-loaded="true">

<a href="#main" class="skip-link">Skip to main content</a>
<div class="grain-overlay"></div>
<div class="scroll-progress" id="scrollProgress" aria-hidden="true"></div>

<nav class="nav" id="nav">
  <div class="nav-inner">
    <a href="{up}" class="nav-sig">
      <svg viewBox="0 0 40 40" width="22" height="22" class="nav-mark" aria-hidden="true">
        <circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" stroke-width="1"/>
        <circle cx="20" cy="20" r="2.5" fill="#A84D2A"/>
        <line x1="6"  y1="20" x2="16" y2="20" stroke="currentColor" stroke-width="1"/>
        <line x1="24" y1="20" x2="34" y2="20" stroke="currentColor" stroke-width="1"/>
        <line x1="20" y1="6"  x2="20" y2="16" stroke="currentColor" stroke-width="1"/>
        <line x1="20" y1="24" x2="20" y2="34" stroke="currentColor" stroke-width="1"/>
      </svg>
      <span>Muraduzzaman</span>
    </a>
    <ul class="nav-links">
      <li><a href="{up}about/"    data-n="01">About</a></li>
      <li><a href="{up}work/"     data-n="02">Work</a></li>
      <li><a href="{up}services/" data-n="03">Services</a></li>
      <li><a href="{up}praise/"   data-n="04">Praise</a></li>
      <li><a href="{up}contact/"  data-n="05">Contact</a></li>
    </ul>
    <div class="nav-right">
      <a href="{up}muraduzzaman-cv.pdf" class="nav-pdf" download="muraduzzaman-cv.pdf" aria-label="Download CV as PDF">
        <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M12 4v12m0 0l-5-5m5 5l5-5M4 20h16" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round"/></svg>
        <span>CV</span>
      </a>
      <a href="{up}contact/" class="nav-cta">
        <span>Contact</span>
        <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
      </a>
    </div>
    <button class="nav-burger" id="navBurger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="navMobile">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>

<div class="nav-mobile" id="navMobile" aria-hidden="true">
  <ul class="nav-mobile-links">
    <li><a href="{up}about/"    data-n="01">About</a></li>
    <li><a href="{up}work/"     data-n="02">Work</a></li>
    <li><a href="{up}services/" data-n="03">Services</a></li>
    <li><a href="{up}praise/"   data-n="04">Praise</a></li>
    <li><a href="{up}contact/"  data-n="05">Contact</a></li>
  </ul>
  <div class="nav-mobile-foot">
    <a href="{up}muraduzzaman-cv.pdf" download="muraduzzaman-cv.pdf">Download CV (PDF)</a>
    <a href="{up}contact/">Start a project</a>
  </div>
</div>
"""

FOOTER = """
<footer class="site-foot">
  <div class="wrap">
    <div class="sf-top">
      <div class="sf-col">
        <h5>Muraduzzaman</h5>
        <p>Growth engineer, Dhaka. SEO + software, delivered by one operator.</p>
      </div>
      <div class="sf-col">
        <h5>Navigate</h5>
        <ul>
          <li><a href="{up}about/">About</a></li>
          <li><a href="{up}work/">Work</a></li>
          <li><a href="{up}services/">Services</a></li>
          <li><a href="{up}praise/">Praise</a></li>
          <li><a href="{up}contact/">Contact</a></li>
        </ul>
      </div>
      <div class="sf-col">
        <h5>More</h5>
        <ul>
          <li><a href="{up}experience/">Experience</a></li>
          <li><a href="{up}credentials/">Credentials</a></li>
          <li><a href="{up}code/">Code</a></li>
          <li><a href="{up}recognition/">Recognition</a></li>
        </ul>
      </div>
      <div class="sf-col">
        <h5>Channels</h5>
        <ul>
          <li><a href="{up}contact/">Contact</a></li>
          <li><a href="https://github.com/MuraduzzamanRifat" target="_blank" rel="noopener">GitHub</a></li>
          <li><a href="https://www.upwork.com/freelancers/~018280ef5078222f43" target="_blank" rel="noopener">Upwork</a></li>
          <li><a href="https://www.linkedin.com/in/md-muraduzzaman-4a581410a/" target="_blank" rel="noopener">LinkedIn</a></li>
          <li><a href="{up}muraduzzaman-cv.pdf" download>Download CV</a></li>
        </ul>
      </div>
    </div>
    <div class="sf-bottom">
      <span>© 2026 Muraduzzaman <span class="copper">·</span> Dhaka, Bangladesh <span class="copper">·</span> Built by hand</span>
      <span><a href="https://github.com/MuraduzzamanRifat/mj" target="_blank" rel="noopener">Source on GitHub</a></span>
    </div>
  </div>
</footer>

<script type="importmap">
{{
  "imports": {{
    "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js"
  }}
}}
</script>
<script type="module" src="{up}app.js"></script>
</body>
</html>
"""

def page_hero(eyebrow, title, sub):
    return f"""
<section class="sub-hero">
  <div class="wrap">
    <div class="sub-meta">
      <span class="copper">{eyebrow}</span>
    </div>
    <h1 class="sub-title">{title}</h1>
    <p class="sub-sub">{sub}</p>
  </div>
</section>
"""

def back_link(up, label="All work"):
    return f"""
<a href="{up}" class="case-back">
  <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round"/></svg>
  <span>{label}</span>
</a>
"""

def cta_block():
    return """
<div class="case-cta" style="margin-top:60px;padding:44px 40px;border:1px solid rgba(238,231,216,0.25);background:rgba(17,17,20,0.82);display:flex;justify-content:space-between;align-items:center;gap:32px;flex-wrap:wrap;">
  <div>
    <h3 style="font-family:var(--f-display);font-weight:400;font-size:clamp(24px,3vw,32px);line-height:1.2;color:var(--paper);margin:0 0 6px;">Interested in work like this?</h3>
    <p style="font-family:var(--f-italic);font-style:italic;color:rgba(238,231,216,0.72);font-size:14px;margin:0;">I'm currently available for select engagements.</p>
  </div>
  <div style="display:flex;gap:12px;flex-wrap:wrap;">
    <a href="../../contact/" class="cta-btn primary">
      <span class="cta-label">Start a conversation</span>
      <span class="cta-arrow">→</span>
    </a>
  </div>
</div>
"""


# ──────────────────────────────────────────────────────────────────
# PAGES
# ──────────────────────────────────────────────────────────────────

def build_about(up="../"):
    body = page_hero("About", "I replace the three-vendor stack most companies assume they need.", "SEO agency, web developer, automation consultant — one hire handles all three. Delivered by a single operator, end-to-end, without handoffs.") + f"""
<main id="main" class="sub-body">
  <div class="wrap">
    <section class="prose reveal">
      <h2>The short version</h2>
      <p><strong>Seven years ranking commercial-intent keywords to USA #1.</strong> 20+ products shipped solo, including AI SaaS with Stripe billing, Python scrapers running in production, hand-coded Shopify themes at Lighthouse 95, and interactive WebGL brand experiences. Currently full-time at Innohedge; simultaneously retained by an international client since 2023 at a 5.0 rating.</p>

      <p class="big-quote">Most marketers buy tools. <em>I build them.</em></p>

      <h2>Why this combination is rare</h2>
      <p>A senior SEO specialist can diagnose why your organic traffic is flat. A senior engineer can ship the scraper that fixes it. <strong>Almost nobody can do both.</strong> The typical growth team either (a) hires three roles and coordinates them through JIRA, or (b) hires one specialist and outsources everything else to agencies — paying a 40% vendor tax and losing weeks in coordination loops.</p>

      <p>I compress that stack into one contract, one brain, one delivery timeline.</p>

      <h2>What's already shipped</h2>
      <ul>
        <li><strong>ProWorkSpace</strong> — Chrome extension SaaS with Stripe billing, marketing site, and admin panel. Live, paying users.</li>
        <li><strong>Forex Lead Finder</strong> — Python engine harvesting 5 platforms, 15-point classifier, SQLite warehouse, Flask UI, 6-hour loop.</li>
        <li><strong>AYVA</strong> — Shopify Dawn fork, zero third-party apps, Lighthouse 95 mobile, 50 products migrated.</li>
        <li><strong>BrandiVibe</strong> — Three.js brand front-end <em>plus</em> an autonomous AI Sales Brain (GPT-4o) that writes daily SEO articles, radar-scans four startup feeds for ICP-fit leads, deep-researches each one, and runs a warmup-curve cold-email sequence with self-learning A/B. Zero daily input.</li>
        <li>And <a href="../work/">16 more</a> in lead pipelines, automation, and Shopify theme work.</li>
      </ul>

      <h2>Signals worth knowing</h2>
      <ul>
        <li><strong>USA rank #1</strong> for a commercial-intent keyword (still live).</li>
        <li><strong>Top Performer of the Month</strong> — JK Lifestyle, July 2025.</li>
        <li><strong>5.0 Upwork rating</strong>; single client has retained me full-time for ~3 years without interruption.</li>
        <li><strong>Listed on Wikidata</strong> as an entity — uncommon for an independent operator.</li>
        <li>Organic reach across <strong>6 countries</strong> (GA4 verified, 30-day window).</li>
      </ul>

      <h2>Who I'm useful to</h2>
      <ul>
        <li><strong>Startups under ~$5M ARR</strong> who can't afford three specialists but need all three skill sets — hire me instead of forming a team.</li>
        <li><strong>Growth teams at mid-market</strong> who want a senior specialist but also need execution without the usual handoff delays.</li>
        <li><strong>Agencies</strong> sub-contracting specialist SEO + engineering work for enterprise clients.</li>
        <li><strong>Founders</strong> who need a growth engine rebuilt end-to-end in weeks, not quarters.</li>
      </ul>

      <h2>How to start working together</h2>
      <p>Send a one-paragraph brief through the <a href="../contact/">contact form</a>. I reply within 24 hours with either a scope-and-price proposal or an honest "not a fit." No long qualification calls before I understand what you actually need.</p>

      <div class="prose-tag">SEO · AEO · GEO · AUTOMATION · AI · CODE</div>
    </section>

    {cta_block().replace('../../', '../')}
  </div>
</main>
"""
    return body


def build_work_index(up="../"):
    # Each card now leads with THE OUTCOME, not a description of what it is.
    cards = [
        ("01", "ProWorkSpace", "Live SaaS — paying users", "Chrome extension + Stripe billing + admin panel. Shipped solo.", "proworkspace/"),
        ("02", "Forex Lead Finder", "5 platforms → 1 pipeline", "Python engine, 15-point classifier, 6-hour scheduler. Replaces manual lead research.", "forex-lead-finder/"),
        ("03", "AYVA", "Lighthouse 95 mobile", "Hand-coded Shopify Dawn fork, 50 products, zero third-party apps.", "ayva/"),
        ("04", "BrandiVibe", "WebGL brand + 24/7 AI Sales Brain", "Three.js front-end plus a GPT-4o-driven autonomous sales engine: daily SEO article, hourly lead radar across 4 feeds, deep research, Resend warmup cold outreach, self-learning A/B. Runs on Koyeb, state in GitHub.", "brandivibe/"),
        ("05", "Email Outreach Engine", "90%+ deliverability, 50/day", "Playwright collector + rate-capped sender. Production cold-outreach pipeline.", "email-outreach/"),
        ("06", "Maps Lead Extractor", "Day-of-research → 10 minutes", "SerpAPI CLI. Any geo + keyword → enriched CSV, sales-ready.", "maps-extractor/"),
    ]
    card_html = "\n".join([
        f"""
    <a class="work-card reveal" href="{slug}">
      <span class="wc-idx">{idx}</span>
      <h3>{name}</h3>
      <p class="wc-metric">{metric}</p>
      <p>{sub}</p>
      <span class="wc-arrow">Read case study <span>→</span></span>
    </a>
""" for (idx, name, metric, sub, slug) in cards
    ])
    body = page_hero(
        "Work",
        "Six products, each replacing a specific line-item on someone's budget.",
        "The common thread: a workflow that used to cost an agency contract, a team hire, or a week of manual time — compressed into a tool I built end-to-end. Every case study opens with what it replaced."
    ) + f"""
<main id="main" class="sub-body">
  <div class="wrap">
    <div class="work-grid">{card_html}</div>
    {cta_block().replace('../../', '../')}
  </div>
</main>
"""
    return body


def build_work_case(slug, idx, name, sub, problem, approach, arch_tiles, invisible, stack_groups, takeaway, live_url=None, up="../../"):
    arch_html = "\n".join([
        f"""
        <article class="arch-tile">
          <span class="arch-num">{n}</span>
          <h4>{h}</h4>
          <p>{p}</p>
        </article>
""" for (n, h, p) in arch_tiles
    ])
    invisible_html = "\n".join([f"<li><strong>{h}</strong> {p}</li>" for (h, p) in invisible])
    stack_html = "\n".join([
        f"""
        <div class="case-stack-col">
          <h5>{h}</h5>
          <p>{p}</p>
        </div>
""" for (h, p) in stack_groups
    ])
    live_btn = ""
    if live_url:
        live_btn = f"""
    <a href="{live_url}" target="_blank" rel="noopener" class="cta-btn">
      <span class="cta-label">See {name} live</span>
      <span class="cta-arrow">↗</span>
    </a>
"""

    body = f"""
<section class="case-hero">
  <div class="case-wrap">
    {back_link(up + 'work/', 'All work')}

    <div class="case-meta">
      <span><span class="copper">Case Study · {idx}</span></span>
      <span>Solo build</span>
    </div>

    <h1 class="case-title">{name}.</h1>
    <p class="case-subtitle">{sub}</p>
  </div>
</section>

<main id="main" class="case-body">
  <div class="case-wrap">

    <section class="case-section case-prose">
      <div class="case-eyebrow">01 · The problem</div>
      <h2 class="case-h2">{problem['h2']}</h2>
      {''.join(f'<p>{p}</p>' for p in problem['paragraphs'])}
    </section>

    <section class="case-section case-prose">
      <div class="case-eyebrow">02 · The approach</div>
      <h2 class="case-h2">{approach['h2']}</h2>
      {''.join(f'<p>{p}</p>' for p in approach['paragraphs'])}
    </section>

    <section class="case-section">
      <div class="case-eyebrow">03 · Architecture</div>
      <h2 class="case-h2">How it fits together.</h2>
      <div class="arch-grid">{arch_html}</div>
    </section>

    <section class="case-section case-prose">
      <div class="case-eyebrow">04 · The work beneath the surface</div>
      <h2 class="case-h2">Non-obvious decisions.</h2>
      <ul class="case-list">{invisible_html}</ul>
    </section>

    <section class="case-section">
      <div class="case-eyebrow">05 · Stack</div>
      <h2 class="case-h2">What it's built with.</h2>
      <div class="case-stack-band">{stack_html}</div>
    </section>

    <section class="case-section case-prose">
      <div class="case-eyebrow">06 · Takeaway</div>
      <h2 class="case-h2">Why this one matters.</h2>
      <p>{takeaway}</p>
    </section>

    <div class="case-cta">
      <div>
        <h3>Want something like this built for your company?</h3>
        <p>I'm currently available for select engagements.</p>
      </div>
      <div class="case-cta-buttons">
        {live_btn}
        <a href="{up}contact/" class="cta-btn primary">
          <span class="cta-label">Start a conversation</span>
          <span class="cta-arrow">→</span>
        </a>
      </div>
    </div>

  </div>
</main>
"""
    return body


def build_services_index(up="../"):
    cards = [
        ("01", "Growth website", "WebGL / 3D / motion brand sites, hand-built.", "2–4 wks", "growth-website/"),
        ("02", "SEO reboot", "Audit → architecture → links → ranked.", "4–12 wks", "seo-reboot/"),
        ("03", "Lead scraper", "Python pipelines for any source.", "5–10 days", "lead-scraper/"),
        ("04", "Chrome extension", "End-to-end SaaS with Stripe.", "3–6 wks", "chrome-extension/"),
        ("05", "Shopify theme", "Hand-coded Dawn forks.", "2–3 wks", "shopify-theme/"),
        ("06", "AI workflow", "n8n / LLM orchestration.", "1–2 wks", "ai-workflow/"),
    ]
    card_html = "\n".join([
        f"""
    <a class="svc-card reveal" href="{slug}">
      <span class="sc-idx">{idx}</span>
      <h3>{name}</h3>
      <p>{sub}</p>
      <div class="sc-foot">
        <span class="sc-label">Typical build</span>
        <span class="sc-value">{wks}</span>
      </div>
    </a>
""" for (idx, name, sub, wks, slug) in cards
    ])
    body = page_hero("Services", "Six things I build. Start to finish.", "Every engagement scoped, priced, and delivered by one operator. No handoffs, no hidden freelancers, no agency tax.") + f"""
<main id="main" class="sub-body">
  <div class="wrap">
    <div class="svc-grid">{card_html}</div>
    {cta_block().replace('../../', '../')}
  </div>
</main>
"""
    return body


def build_service_page(slug, idx, name, sub, what, when, how, stack, timeline, price_hint, up="../../"):
    body = f"""
<section class="sub-hero">
  <div class="wrap">
    {back_link(up + 'services/', 'All services')}
    <div class="sub-meta"><span class="copper">Service · {idx}</span></div>
    <h1 class="sub-title">{name}</h1>
    <p class="sub-sub">{sub}</p>
  </div>
</section>

<main id="main" class="sub-body">
  <div class="wrap">
    <section class="prose reveal">
      <h2>What's delivered</h2>
      {''.join(f'<p>{p}</p>' for p in what)}

      <h2>When this fits</h2>
      {''.join(f'<p>{p}</p>' for p in when)}

      <h2>How I work</h2>
      <ol class="case-list">
        {''.join(f'<li>{step}</li>' for step in how)}
      </ol>

      <div class="svc-summary">
        <div><span class="svc-label">Typical build</span><span class="svc-value">{timeline}</span></div>
        <div><span class="svc-label">Scope signal</span><span class="svc-value">{price_hint}</span></div>
        <div><span class="svc-label">Stack</span><span class="svc-value">{stack}</span></div>
      </div>
    </section>

    {cta_block()}
  </div>
</main>
"""
    return body


def build_experience_page(up="../"):
    roles = [
        ("Senior SEO &amp; Digital Marketing Specialist", "Innohedge", "Jan 2025 – Present",
         "Building AI-driven marketing systems across SEO and content. Automated content pipelines, prompt frameworks, data-enriched keyword systems. n8n-based automation for lead flow and reporting. AEO &amp; GEO strategies for AI-driven search visibility."),
        ("Senior SEO &amp; Digital Marketing Specialist", "Print Britannia", "May 2021 – Mar 2025 (3 yrs 10 mos)",
         "Architected the SEO and content ecosystem that ranked high-value commercial keywords and converted organic traffic into revenue. Built structured keyword clusters, internal linking systems, and conversion-focused landing flows tied directly to revenue KPIs."),
        ("SEO &amp; Digital Marketing Specialist", "Image Retouching Lab", "Jan 2019 – May 2021 (2 yrs 4 mos)",
         "Led digital marketing execution across SEO, content, and social channels. Managed team operations, campaign rollout, and engagement strategy. Improved brand visibility and client acquisition through structured content and search optimisation. Delivered the USA Rank #1 result on core commercial keywords."),
        ("Independent Consultant", "Upwork &amp; direct clients", "Jul 2023 – Present",
         "SEO systems, AI-driven content infrastructure, and custom automation for global clients. Integrated workflows combining search strategy, data pipelines, and web execution. 5.0 rating, full-time long-term client retention."),
    ]
    items = "\n".join([
        f"""
    <li class="exp-row reveal">
      <div class="er-date">{date}</div>
      <div class="er-body">
        <h3>{title} <span class="er-co">— {co}</span></h3>
        <p>{desc}</p>
      </div>
    </li>
""" for (title, co, date, desc) in roles
    ])
    body = page_hero("Experience", "Seven years across four seats.", "The career arc, with dates, responsibilities, and outcomes.") + f"""
<main id="main" class="sub-body">
  <div class="wrap">
    <ol class="exp-long">{items}</ol>
    {cta_block().replace('../../', '../')}
  </div>
</main>
"""
    return body


def build_credentials_page(up="../"):
    body = page_hero("Credentials", "Training and education.", "Certifications and formal education, listed in full.") + f"""
<main id="main" class="sub-body">
  <div class="wrap">
    <div class="prose-grid">
      <div class="reveal">
        <h2>Certifications</h2>
        <ul class="cred-list">
          <li><span>HubSpot Academy</span> — SEO &amp; Digital Marketing <span class="y">2024</span></li>
          <li><span>Skillshare</span> — Google Ads &amp; Meta Ads Mastery <span class="y">2024</span></li>
          <li><span>Coursera</span> — Branding &amp; Brand Strategy · SMM <span class="y">2024</span></li>
          <li><span>Semrush Academy</span> — SEO Crash Course, Brian Dean <span class="y">2023</span></li>
          <li><span>UY Lab Dhaka</span> — Digital Marketing &amp; SEO <span class="y">2018</span></li>
        </ul>
      </div>
      <div class="reveal">
        <h2>Education</h2>
        <ul class="cred-list">
          <li><span>LLB</span> — Bangladesh Islami University, Dhaka <span class="y">2019</span></li>
          <li><span>HSC</span> — Khilgaon Model University College <span class="y">2015</span></li>
          <li><span>SSC</span> — Haider Ali School and College <span class="y">2013</span></li>
        </ul>
      </div>
    </div>
    {cta_block().replace('../../', '../')}
  </div>
</main>
"""
    return body


def build_code_page(up="../"):
    plates = [
        ("01", "classifier / forex_classifier.py", "Lead classifier", "15-point scoring engine from Forex Lead Finder.",
         "accepts ~26% · discards ~74%"),
        ("02", "scheduler.py", "Six-hour scheduler", "APScheduler loop that drives the scraper.",
         "four harvests per day · indefinite runtime"),
        ("03", "extension / content.js", "Chrome extension", "DOM injection for ProWorkSpace on Upwork.",
         "idempotent · SPA-safe · no polling"),
        ("04", "sections / product-grid.liquid", "Storefront section", "Hand-authored Liquid from the AYVA Dawn fork.",
         "zero third-party apps · <50 kb css"),
    ]
    tiles = "\n".join([
        f"""
    <article class="code-plate-teaser reveal">
      <header>
        <span class="plate-ref">{idx}</span>
        <span class="plate-file">{f}</span>
      </header>
      <h3>{h}</h3>
      <p>{sub}</p>
      <footer><span class="plate-metric">{metric}</span></footer>
    </article>
""" for (idx, f, h, sub, metric) in plates
    ])
    body = page_hero("Code", "Four excerpts from production systems.", "Short extracts from four of my shipped systems — the same code that classifies leads, runs the scheduler, powers the Chrome extension, and renders the storefront.") + f"""
<main id="main" class="sub-body">
  <div class="wrap">
    <div class="code-plate-grid">{tiles}</div>
    <p class="tooling-intro reveal" style="margin-top:60px;">Full code excerpts with syntax highlighting live on the <a href="../#tooling">home page</a> — this page is the summary for direct links.</p>
    {cta_block().replace('../../', '../')}
  </div>
</main>
"""
    return body


def build_recognition_page(up="../"):
    items = [
        ("Award", "Top Performer of the Month", "JK Lifestyle · July 2025 · awarded to Muraduzzaman"),
        ("SERP", "USA rank #1", "\"best clipping path service\" · commercial intent keyword"),
        ("Reach", "6 countries / 30 days", "GA4 · DE · UK · FR · TR · US · SE"),
        ("Lighthouse", "95 perf · 100 best-practices", "Client mobile site · third-party verified"),
        ("Upwork", "5.0 rating · retained", "Full-time engagement since July 2023 · verified client"),
        ("Wikidata", "Listed as an entity", "Unusual credential for an independent operator"),
    ]
    cards = "\n".join([
        f"""
    <article class="rec-card reveal">
      <span class="rec-label">{label}</span>
      <div class="rec-value">{value}</div>
      <div class="rec-meta">{meta}</div>
    </article>
""" for (label, value, meta) in items
    ])
    body = page_hero("Recognition", "Receipts, rankings, results.", "Evidence that the positioning on this site is backed by verifiable results — awards, search rankings, analytics, performance scores, and one unusual credential.") + f"""
<main id="main" class="sub-body">
  <div class="wrap">
    <div class="rec-grid">{cards}</div>
    {cta_block().replace('../../', '../')}
  </div>
</main>
"""
    return body


def build_praise_page(up="../"):
    body = page_hero("Praise", "What clients say.", "Verified, unedited quotes.") + f"""
<main id="main" class="sub-body">
  <div class="wrap">
    <figure class="featured-quote reveal" style="max-width:900px;margin:0 auto;">
      <div class="quote-credibility">
        <span class="qc-num">$120,000+</span><span class="qc-cap">spent on Upwork</span>
        <span class="qc-sep">·</span>
        <span class="qc-num">250+</span><span class="qc-cap">providers hired</span>
        <span class="qc-sep">·</span>
        <span class="qc-num">1</span><span class="qc-cap">rating he can't stop giving</span>
      </div>

      <p class="pull-quote">
        <em>&ldquo;By&nbsp;far&nbsp;the&nbsp;best web&nbsp;designer I&nbsp;have&nbsp;ever come&nbsp;across.&rdquo;</em>
      </p>

      <blockquote class="quote-body">
        <p>I have had the pleasure of working with Muraduz on several websites. Although our journey began with a few challenges, he approached me with a genuine request to finish the project and showcase his skills. From that point on he has consistently impressed me with his professionalism, expertise, and dedication to delivering high-quality work — and has now become a valued full-time member of my team.</p>
        <p>Muraduz demonstrates an impressive level of technical proficiency while exhibiting great respect and communication skills. He consistently completes tasks well ahead of schedule, surpassing my expectations every time. His attention to detail and ability to bring my ideas to life on the web is truly remarkable.</p>
        <p>I have worked with numerous web designers over the years, but none have been as reliable, efficient, and talented. If you're looking for a web designer who will exceed your expectations, I highly recommend working with him.</p>
      </blockquote>

      <figcaption class="quote-caption">
        <div class="qc-line">
          <span class="qc-dot"></span>
          <strong>MyTown Mysteries</strong>
        </div>
        <span class="qc-role">Full-time engagement since Jul 2023 · Verified Upwork client · 5.0 rating</span>
        <a class="qc-link" href="https://www.upwork.com/freelancers/~018280ef5078222f43" target="_blank" rel="noopener">
          Read the full review on Upwork <span>↗</span>
        </a>
      </figcaption>
    </figure>
    {cta_block().replace('../../', '../')}
  </div>
</main>
"""
    return body


def build_contact_page(up="../"):
    body = page_hero("Contact", "Let's talk.", "Currently available for select engagements — SEO, automation, AI workflows, and full-stack web projects. Share your brief below; I reply within 24 hours.") + f"""
<main id="main" class="sub-body">
  <div class="wrap">
    <div class="close-actions reveal" style="margin-bottom:20px;">
      <a href="{up}muraduzzaman-cv-portfolio.pdf" download class="close-cta primary">
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M12 4v12m0 0l-5-5m5 5l5-5M4 20h16" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round"/></svg>
        <span>Download portfolio CV</span>
      </a>
      <a href="{up}muraduzzaman-cv.pdf" download class="close-cta">
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M12 4v12m0 0l-5-5m5 5l5-5M4 20h16" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round"/></svg>
        <span>Download ATS CV</span>
      </a>
      <a href="#contact-form" class="close-cta">
        <span>Start a project</span>
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round"/></svg>
      </a>
    </div>

    <p class="cv-hint reveal" style="max-width:760px;margin-bottom:60px;">
      <em>Two versions of the CV:</em>
      the <strong>portfolio</strong> PDF matches this site's dark aesthetic (for founder-clients and creative agencies);
      the <strong>ATS</strong> PDF is single-column, plain-contrast, and safe for Workday / Greenhouse / Lever resume parsers.
    </p>

    <section id="contact-form" class="contact-form-wrap" aria-labelledby="contact-form-title">
      <header class="cf-head">
        <h2 id="contact-form-title">Project inquiry</h2>
        <p>Tell me what you're trying to ship. I read every message myself and reply within <strong>24 hours</strong> with either a scoped proposal or an honest "not a fit."</p>
      </header>

      <form id="contactForm" class="contact-form" action="https://formsubmit.co/mjrifat54@gmail.com" method="POST" novalidate>
        <input type="hidden" name="_subject" value="New inquiry from mjrifat.com">
        <input type="hidden" name="_template" value="table">
        <input type="hidden" name="_captcha" value="false">
        <input type="hidden" name="_next" value="https://mjrifat.com/contact/?sent=1">
        <input type="text" name="_honey" tabindex="-1" autocomplete="off" style="display:none;" aria-hidden="true">

        <div class="cf-row two">
          <div class="cf-field">
            <label for="cf-name">Your name <span class="req">*</span></label>
            <input id="cf-name" name="name" type="text" required autocomplete="name" minlength="2" maxlength="100">
          </div>
          <div class="cf-field">
            <label for="cf-email">Work email <span class="req">*</span></label>
            <input id="cf-email" name="email" type="email" required autocomplete="email" maxlength="120">
          </div>
        </div>

        <div class="cf-row two">
          <div class="cf-field">
            <label for="cf-company">Company / website <span class="opt">(optional)</span></label>
            <input id="cf-company" name="company" type="text" autocomplete="organization" maxlength="160">
          </div>
          <div class="cf-field">
            <label for="cf-role">Your role <span class="opt">(optional)</span></label>
            <input id="cf-role" name="role" type="text" autocomplete="organization-title" maxlength="80">
          </div>
        </div>

        <div class="cf-row three">
          <div class="cf-field">
            <label for="cf-type">Project type</label>
            <select id="cf-type" name="project_type">
              <option value="">Choose one…</option>
              <option>SEO — technical audit &amp; rebuild</option>
              <option>SEO — content &amp; ranking programme</option>
              <option>Chrome extension</option>
              <option>Automation / scraper / AI workflow</option>
              <option>Shopify theme or storefront</option>
              <option>Full-stack web app</option>
              <option>WebGL / 3D brand experience</option>
              <option>Something else</option>
            </select>
          </div>
          <div class="cf-field">
            <label for="cf-budget">Budget range</label>
            <select id="cf-budget" name="budget">
              <option value="">Choose one…</option>
              <option>Under $2,000</option>
              <option>$2,000 – $5,000</option>
              <option>$5,000 – $15,000</option>
              <option>$15,000 – $50,000</option>
              <option>$50,000+</option>
              <option>Retainer / monthly</option>
              <option>Not sure yet</option>
            </select>
          </div>
          <div class="cf-field">
            <label for="cf-timeline">Timeline</label>
            <select id="cf-timeline" name="timeline">
              <option value="">Choose one…</option>
              <option>Yesterday</option>
              <option>Within 2 weeks</option>
              <option>Within 1 month</option>
              <option>1 – 3 months</option>
              <option>Flexible</option>
            </select>
          </div>
        </div>

        <div class="cf-field">
          <label for="cf-message">Project brief <span class="req">*</span></label>
          <textarea id="cf-message" name="message" rows="7" required minlength="20" maxlength="4000" placeholder="What are you trying to ship? What's blocking you? Share goals, constraints, and anything relevant — the more specific the brief, the more useful my reply."></textarea>
          <span class="cf-counter" id="cf-counter" aria-live="polite">0 / 4000</span>
        </div>

        <div class="cf-actions">
          <button type="submit" class="cf-submit" id="cf-submit">
            <span class="cf-submit-label">Send inquiry</span>
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          </button>
          <p class="cf-meta">
            Delivered to me within seconds via an encrypted form service. No newsletter, no data sharing, no follow-up marketing — only your inquiry.
          </p>
        </div>

        <div class="cf-success" id="cfSuccess" hidden>
          <strong>Thanks — your brief is in my inbox.</strong>
          <p>I reply within 24 hours, usually sooner. If you don't hear from me, your email provider may have filtered my reply — check spam, or ping me on <a href="https://www.linkedin.com/in/md-muraduzzaman-4a581410a/" target="_blank" rel="noopener">LinkedIn</a>.</p>
        </div>
        <div class="cf-error" id="cfError" hidden>
          <strong>Hmm — that didn't go through.</strong>
          <p>Please try again, or reach me directly on <a href="tel:+8801917286515">+880 1917 286 515</a> / <a href="https://www.upwork.com/freelancers/~018280ef5078222f43" target="_blank" rel="noopener">Upwork</a>.</p>
        </div>
      </form>
    </section>

    <div class="contact-grid" style="margin-top:80px;">
      <a class="c-item reveal" href="tel:+8801917286515">
        <span class="c-label">Phone</span>
        <span class="c-value">+880 1917 286 515</span>
        <span class="c-arrow">→</span>
      </a>
      <a class="c-item reveal" href="https://github.com/MuraduzzamanRifat" target="_blank" rel="noopener">
        <span class="c-label">GitHub</span>
        <span class="c-value">@MuraduzzamanRifat</span>
        <span class="c-arrow">→</span>
      </a>
      <a class="c-item reveal" href="https://www.upwork.com/freelancers/~018280ef5078222f43" target="_blank" rel="noopener">
        <span class="c-label">Upwork · Hire directly</span>
        <span class="c-value">View profile</span>
        <span class="c-arrow">→</span>
      </a>
      <a class="c-item reveal" href="https://www.linkedin.com/in/md-muraduzzaman-4a581410a/" target="_blank" rel="noopener">
        <span class="c-label">LinkedIn</span>
        <span class="c-value">md-muraduzzaman</span>
        <span class="c-arrow">→</span>
      </a>
      <div class="c-item non-link reveal">
        <span class="c-label">Based in</span>
        <span class="c-value">Dhaka · working globally</span>
        <span class="c-arrow">·</span>
      </div>
    </div>
  </div>
</main>

<script>
(function() {{
  const form = document.getElementById('contactForm');
  if (!form) return;
  const submit  = document.getElementById('cf-submit');
  const success = document.getElementById('cfSuccess');
  const error   = document.getElementById('cfError');
  const message = document.getElementById('cf-message');
  const counter = document.getElementById('cf-counter');
  const max = 4000;

  if (new URLSearchParams(location.search).get('sent') === '1') {{
    form.hidden = true;
    success.hidden = false;
  }}

  function updateCounter() {{
    const n = message.value.length;
    counter.textContent = n + ' / ' + max;
    counter.classList.toggle('warn', n > max * 0.9);
  }}
  message.addEventListener('input', updateCounter);
  updateCounter();

  form.addEventListener('submit', async (e) => {{
    if (!form.checkValidity()) {{
      form.reportValidity();
      return;
    }}
    e.preventDefault();
    submit.disabled = true;
    submit.classList.add('loading');
    error.hidden = true;
    try {{
      const res = await fetch(form.action, {{
        method: 'POST',
        body: new FormData(form),
        headers: {{ Accept: 'application/json' }},
      }});
      if (!res.ok) throw new Error('Submit failed: ' + res.status);
      form.reset();
      form.hidden = true;
      success.hidden = false;
      success.scrollIntoView({{ behavior: 'smooth', block: 'center' }});
    }} catch (err) {{
      console.error('[contact] submission failed:', err);
      submit.disabled = false;
      submit.classList.remove('loading');
      error.hidden = false;
      error.scrollIntoView({{ behavior: 'smooth', block: 'center' }});
    }}
  }});
}})();
</script>
"""
    return body


# ──────────────────────────────────────────────────────────────────
# Case-study content per product
# ──────────────────────────────────────────────────────────────────

CASE_STUDIES = {
    'forex-lead-finder': dict(
        idx='02',
        name='Forex Lead Finder',
        sub='Replaces 10 hours of weekly manual lead research with a Python engine that harvests 5 platforms, scores every profile, and delivers sales-ready CSVs on a 6-hour loop.',
        problem=dict(
            h2='Manual lead hunting burns a full workday per week.',
            paragraphs=[
                '<strong>Target buyer:</strong> anyone selling forex signals, courses, or brokerage services. <strong>Their bottleneck:</strong> finding qualified traders — people with MT4/MT5 bios, trading-pair posts, or telltale hashtags. That audience is scattered across Reddit, TradingView, BabyPips, ForexFactory, and LinkedIn. <strong>Existing tools:</strong> cover one platform at a time, require constant maintenance, and return unscored data that still needs a human to filter.',
            ]
        ),
        approach=dict(
            h2='Five scrapers in parallel, scored at ingestion, sales-ready on export.',
            paragraphs=[
                '<strong>What ships:</strong> five platform-specific Python collectors running concurrently; a 15-point keyword classifier gating every candidate (bio keyword +10, post keyword +10, trading pair +10, MT4/MT5 +5, hashtag +5, threshold 15); SQLite warehouse keyed by profile URL (idempotent re-runs, no duplicates); Flask UI for operator review; REST endpoints for downstream CRM / email tools; APScheduler 6-hour loop; XLSX / CSV / JSON export.',
                '<strong>What it replaces:</strong> a junior researcher spending ~10 hrs/week scraping names manually (typical market cost in Dhaka: $800–1,200/month; US: $3,500–5,000/month). This engine compresses that to zero human time after initial tuning.',
            ]
        ),
        arch_tiles=[
            ('01 / Collectors',   'Multi-source Python',    'Five independent scrapers (Reddit, TradingView, BabyPips, ForexFactory, LinkedIn) run in parallel. Playwright handles the JS-heavy ones.'),
            ('02 / Classifier',   '15-point scoring',       'Bio keywords (+10), post keywords (+10), trading pairs (+10), MT4/MT5 (+5), hashtags (+5). ≥15 keeps the lead; below discards it.'),
            ('03 / Storage',      'SQLite warehouse',       'Profiles, posts, emails, websites — all normalised into a single store, keyed by profile URL. Idempotent re-runs, no duplicates.'),
            ('04 / Delivery',     'Flask UI + REST',        'Operators use the Flask UI to browse. API consumers (CRMs, email tools) hit REST endpoints for /api/leads and /api/stats.'),
        ],
        invisible=[
            ('Rate-limit isolation —', 'each platform has its own throttle config. A spike on one source never triggers a ban on another.'),
            ('SPA vs static detection —', 'Playwright only boots where the platform requires JS render; the rest run through requests + BS4 for 10× speed.'),
            ('Classifier calibration —', 'the 15-point threshold was tuned against a labelled seed set; accepts roughly 26% of scraped profiles and rejects 74%.'),
        ],
        stack_groups=[
            ('Runtime',     'Python 3.11 · Flask · APScheduler'),
            ('Scraping',    'Playwright · Requests · BeautifulSoup4'),
            ('Storage',     'SQLite · XLSX / CSV / JSON export pipelines'),
            ('Ops',         'Tkinter GUI launcher for non-dev operators · 6-hour scheduler loop'),
        ],
        takeaway='A single operator ships a Python system that replaces the work of two or three manual lead researchers. The product proves the hybrid-SEO-plus-engineering positioning: commercial keyword knowledge (what makes a trader "qualified") fused with the Python chops to automate the capture.',
        live_url=None,
    ),
    'ayva': dict(
        idx='03',
        name='AYVA',
        sub='A Shopify storefront that loads like a static site: hand-coded Dawn fork, zero third-party apps, Lighthouse 95 mobile, 50 products migrated clean.',
        problem=dict(
            h2='App-stacked Shopify stores lose money to latency.',
            paragraphs=[
                '<strong>Industry pattern:</strong> the average Shopify store runs 12–18 third-party apps. Each adds CSS, JS, and DOM weight. <strong>Result:</strong> mobile Lighthouse scores in the 30–50 range, bounce rates above 60%, and conversion drop-off of ~7% per additional second of load time (Google data). <strong>The brand\'s ask:</strong> a Scandinavian-minimalist store where every byte and every millisecond is owned. That eliminates 80% of the shortcuts most Shopify developers take.',
            ]
        ),
        approach=dict(
            h2='Fork Dawn. Rewrite every section. Carry nothing forward.',
            paragraphs=[
                '<strong>What ships:</strong> hand-written Liquid for homepage, collection, and about-page sections; custom section schema exposing merchant-friendly settings (non-technical staff update copy and layout from Shopify admin); hand-tuned CSS under a 50 kb budget per section; responsive image srcset pipelines; deferred fonts; zero third-party JavaScript. 50 products migrated with metafields intact; pre- and post-migration SKU diff verified none slipped.',
                '<strong>What it replaces:</strong> a typical $2,000–5,000/year third-party app stack (reviews, cart, upsell, wishlist, loyalty) — every feature that would normally come from an app was built directly into the theme, converting recurring SaaS subscriptions into a one-time theme investment.',
            ]
        ),
        arch_tiles=[
            ('01 / Theme',     'Dawn fork',            'Custom schema per section, hand-written Liquid, explicit BEM class system. No inherited layouts.'),
            ('02 / Catalogue', '50 products migrated', 'All inventory, pricing, metafields, and media transferred without data loss or URL churn.'),
            ('03 / Perf',      'Lighthouse 95 mobile', 'No third-party JS. Hand-tuned image pipelines, deferred fonts, clean critical CSS.'),
            ('04 / Ops',       'Editorial-first CMS',  'Every section exposes merchant-friendly settings. Non-technical staff can add a new collection block without touching code.'),
        ],
        invisible=[
            ('Zero-app discipline —', 'every feature the brand asked for (cart upsell, dynamic badges, filter logic) was hand-coded in Liquid + vanilla JS rather than bolted on via app.'),
            ('Performance budget —', 'CSS budget was set at 50 kb and enforced manually per section. No section ships that breaks it.'),
            ('Migration safety —', 'catalogue was diffed pre- and post-migration with a Python script; not one SKU slipped.'),
        ],
        stack_groups=[
            ('Theme',       'Shopify Dawn fork · Liquid · Custom schema JSON'),
            ('Assets',      'Hand-tuned CSS · image pipelines · responsive-srcset'),
            ('Migration',   'Python diff tooling · catalogue integrity checks'),
            ('Perf',        'Lighthouse 95 mobile · zero third-party JS · deferred fonts'),
        ],
        takeaway='A Shopify build that proves the counter-intuitive thesis: if you want a store that loads fast, converts well, and stays maintainable — you need a developer who can actually write Liquid, not a theme-buyer. AYVA is the clearest example of that on the portfolio.',
        live_url=None,
    ),
    'brandivibe': dict(
        idx='04',
        name='BrandiVibe',
        sub='Two-layer system: a Three.js brand front-end AND an autonomous AI Sales Brain that runs content, outreach, and learning 24/7 with zero daily human input.',
        problem=dict(
            h2='Pretty brand sites don\'t sell. Sales engines aren\'t pretty.',
            paragraphs=[
                'Most premium brand sites are beautiful and inert — they win the click and then do nothing. Meanwhile, the sales stack that would convert that click (content marketing, cold outreach, CRM, A/B learning) typically requires a marketer, a copywriter, a sales-ops engineer, and a growth PM — four hires before the first email goes out.',
                'BrandiVibe proves a solo operator can ship both layers — a 60-fps WebGL front-end, and the autonomous sales engine that feeds it qualified pipeline — as one system.',
            ]
        ),
        approach=dict(
            h2='A front-end that earns the trust, and an AI Sales Brain that converts it.',
            paragraphs=[
                '<strong>Layer 1 — Experience.</strong> Three.js with custom shaders, cursor-aware geometry, scroll-linked motion. JSON-driven scene config so the brand edits copy and colour without touching render code. 60 fps desktop target; 30 fps graceful fallback on mid-range mobile.',
                '<strong>Layer 2 — The AI Sales Brain.</strong> A GPT-4o-driven autonomous system running on Koyeb with state persisted to GitHub. It writes one long-form SEO article every day, scans four startup feeds hourly for ICP-fit prospects, researches each one (scrapes homepage/about/pricing/contact, extracts personalization hooks), and runs a warmup-curve cold-email sequence via Resend. A weekly digest scores every email by angle, industry, and subject style — then proposes and auto-applies A/B winners. Zero daily human input.',
            ]
        ),
        arch_tiles=[
            ('01 / Renderer',        'Three.js · WebGL 2',        'Custom GLSL shaders, cursor-aware geometry, scroll-linked motion. 60 fps desktop, 30 fps mobile fallback, JSON-driven scene config.'),
            ('02 / Content Engine',  'GPT-4o · daily',            '1,800–2,500-word SEO article per day. 10 content angles rotating (ROI, conversion psychology, case studies…). Pexels hero images, 40+ banned AI-phrase filter for E-E-A-T, auto-publishes to /journal.'),
            ('03 / Lead Radar',      '4 feeds · hourly',          'Scans TechCrunch, Product Hunt, Hacker News Show HN, and BetaList every hour. GPT-4o extracts company, domain, funding, industry. Filters out mega-brands and sites already using premium design (Three.js, Spline, Framer, GSAP) to keep only ICP fit.'),
            ('04 / Deep Research',   'Scrape + GPT-4o hooks',     'Scrapes each prospect\'s homepage, about, team, pricing, contact. Tech-stack + design-quality score. GPT-4o extracts personalization hooks — specific weaknesses, decision-maker name, budget estimate. Email found via scrape then pattern fallback with MX verification.'),
            ('05 / Cold Outreach',   'Resend · warmup · timing',  'Personalized 4-touch sequence per prospect. Warmup ramps 5 → 50 emails/day over 30 days. Per-domain throttle (1 email / 3 days), send window Tue/Wed/Thu 13:00 UTC. Smart timing: clicked = 2-day follow-up, opened = 3 days, no-open = 5 days with a new subject.'),
            ('06 / Conversion',      'Webhooks · CRM',            'Resend webhook records opens, clicks, bounces, replies. Tracked /api/brain/book link redirects to Cal.com and marks booking intent. Inbound replies auto-pause sequences. Everything lives in brain.json, synced to GitHub.'),
            ('07 / Self-Learning',   'A/B · auto-apply',          'Monday 14:00 UTC digest scores every email by angle, industry, and subject style. Identifies winners and losers. Proposes A/B tests between top-performing patterns. Auto-applies winners to the planner\'s prompt when BRAIN_AUTONOMY=true. 60-day override expiry so it re-tests and doesn\'t freeze on stale truth.'),
            ('08 / Operations',      'Self-healing · resumable',  'Six-hour health check emails mjrifat54@gmail.com on failure. DailyRun ledger lets the pipeline resume from its last checkpoint if Koyeb kills mid-tick. State synced to GitHub survives every redeploy.'),
        ],
        invisible=[
            ('Frame-budget discipline —',   'every new scene element has to fit within a fixed frame budget. Nothing ships that drops the experience under 45 fps on a 2019-era laptop.'),
            ('Deliverability engineering —', 'the warmup curve, per-domain throttle, and narrow send window aren\'t optional — they\'re what keeps the from-domain off spam filters and makes the engine sustainable past month one.'),
            ('ICP filtering that refuses customers —', 'Lead Radar actively rejects prospects that already ship premium design (Three.js / Spline / Framer / GSAP detected on their site). They\'re not the ICP, so they\'re noise — even if the brain could get a reply.'),
            ('Self-experimentation with guardrails —', 'the brain proposes its own A/B tests and applies winners, but overrides expire after 60 days. That stops it from freezing on a pattern that stopped working six months ago.'),
            ('State as version-controlled artifact —', 'brain.json sits in a GitHub repo. Every run commits a diff. The entire history of every prospect, email, and learning decision is auditable — and Koyeb redeploys can\'t wipe it.'),
        ],
        stack_groups=[
            ('Front-end',     'Three.js · GLSL shaders · WebGL 2 · JSON-driven scene config'),
            ('Intelligence',  'GPT-4o (planner, article writer, lead extractor, personalizer)'),
            ('Sourcing',      'TechCrunch RSS · Product Hunt · Hacker News Show HN · BetaList'),
            ('Delivery',      'Resend (warmup curve, webhooks for open/click/bounce/reply)'),
            ('Infrastructure','Koyeb cron workers · brain.json on GitHub · Pexels media · Cal.com booking redirect'),
            ('Schedule',      'Daily 13:00 UTC · hourly sourcing · 6-hour health check · Mon 14:00 UTC learning digest'),
        ],
        takeaway='BrandiVibe is both the storefront and the sales engine. The WebGL front-end earns the trust; the AI Sales Brain behind it converts attention into pipeline — writing daily SEO articles, sourcing ICP-fit prospects from four startup feeds, researching them with GPT-4o, running a four-touch warmup-curve cold-email sequence, and auto-applying its own A/B winners every week. One operator, two layers, zero daily human input. Most companies form a team to build half of this.',
        live_url='https://brandivibe.com',
    ),
    'email-outreach': dict(
        idx='05',
        name='Email Outreach Engine',
        sub='A two-stage pipeline: Playwright scrapes emails from social platforms, a rate-capped sender dispatches outreach that lands in the inbox, not the spam folder.',
        problem=dict(
            h2='Cold email at scale gets you blocked.',
            paragraphs=[
                'A cold outreach campaign has two failure modes: not finding the right emails, and getting your sender reputation torched by blasting them too fast. Most off-the-shelf tools fail on the first. The rest fail on the second.',
                'The engine was built to cover both ends — a collector with sensible heuristics, and a sender disciplined enough to keep deliverability above 90%.',
            ]
        ),
        approach=dict(
            h2='Scrape, queue, dispatch — with rate caps that respect the inbox.',
            paragraphs=[
                'A Playwright collector harvests emails from Facebook Groups and Instagram hashtags into a queue. A webmail sender pulls from the queue at a deliberate cap of 50 per day with randomised timing, so reputation stays healthy.',
                'Every step has a kill switch. If deliverability drops, the sender auto-throttles. If the collector hits a rate limit, it backs off without losing state.',
            ]
        ),
        arch_tiles=[
            ('01 / Collector', 'Playwright',            'Two sources — Facebook Groups + Instagram hashtags. Headless with stealth plugins. Auto-retries on transient failures.'),
            ('02 / Queue',     'Dedupe + prioritise',   'Leads enter a normalised queue. Duplicates rejected. Higher-match leads get sent first.'),
            ('03 / Sender',    '50/day rate cap',       'Webmail sender dispatches at a disciplined pace. Variable timing. Healthy sending reputation preserved.'),
            ('04 / Telemetry', 'Deliverability signal', 'If bounces spike, the sender throttles down automatically. Operator alerted.'),
        ],
        invisible=[
            ('Sending reputation —', 'rate cap was tuned against warm-up curves. 50/day is the sweet spot for a new sender domain.'),
            ('Two-source strategy —', 'mixing FB Groups and IG hashtags diversifies the source pool; either alone is too fragile.'),
            ('State resumability —', 'the queue persists; a process crash does not lose an in-flight batch.'),
        ],
        stack_groups=[
            ('Collection',  'Playwright · Stealth plugins · Per-source extractors'),
            ('Queue',       'SQLite-backed job store · dedupe · priority routing'),
            ('Sending',     'Webmail client · rate limiter · deliverability monitor'),
            ('Ops',         '50/day default cap · auto-throttle on bounce spike · operator alerts'),
        ],
        takeaway='Cold acquisition is brutal unless the infrastructure is disciplined. This pipeline is disciplined. It lets a solo operator run outbound at a volume that keeps inbox reputation intact — which is what makes it useful past week one.',
        live_url=None,
    ),
    'maps-extractor': dict(
        idx='06',
        name='Maps Lead Extractor',
        sub='A SerpAPI-driven CLI that sweeps any geography + keyword combination and writes enriched CSVs a sales team can actually use.',
        problem=dict(
            h2='Local lead research is manual, repetitive, and slow.',
            paragraphs=[
                'Every sales team pulling local business data from Google Maps hits the same wall — a day per geography, a week per region, a month per country. The data is public; the friction is time.',
                'The extractor automates the friction layer so the operator only has to think about the strategy: which geographies, which keywords, what depth.',
            ]
        ),
        approach=dict(
            h2='A small CLI. A SerpAPI call. A clean CSV.',
            paragraphs=[
                'The tool is a small Python CLI. The operator supplies a geography and keyword; the tool paginates through SerpAPI results and writes an enriched CSV with everything the sales team needs — business name, address, phone, website, category, rating, review count.',
                'Configurable depth (10 to 500+ results per query) and environment-based credentials mean it drops cleanly into any sales workflow without touching a UI.',
            ]
        ),
        arch_tiles=[
            ('01 / Input',     'CLI args',          'Geography + keyword + depth. Nothing more to configure. Runs from cron or manually.'),
            ('02 / Fetch',     'SerpAPI',           'Paginated Google Maps queries. Clean retries. Backoff-safe. .env-based credentials.'),
            ('03 / Enrich',    'Per-record fields', 'Business name, address, phone, website, category, rating, review count. Everything usable out of the box.'),
            ('04 / Output',    'CSV',               'UTF-8 with header row. Deduped. Sorted by category then rating. Ready to import anywhere.'),
        ],
        invisible=[
            ('Rate-aware pagination —', 'the tool knows SerpAPI quotas and never blows the budget on a single run.'),
            ('Resume logic —', 'if interrupted, it resumes from the last successful page rather than re-fetching the whole set.'),
            ('Deterministic output —', 'same geography + keyword = same CSV, so downstream processes can diff reliably between runs.'),
        ],
        stack_groups=[
            ('Runtime',  'Python 3.11 · standard library + requests'),
            ('Data',     'SerpAPI Google Maps endpoint · paginated fetch'),
            ('Output',   'UTF-8 CSV · deduped · sorted · ready-for-import'),
            ('Config',   '.env-based credentials · CLI args for geo + keyword + depth'),
        ],
        takeaway='A sales team that used to spend a week on local lead research runs this tool in ten minutes. The product is the embodiment of my philosophy: find the repeatable bottleneck in your client\'s workflow, then write a small, sharp tool that removes it.',
        live_url=None,
    ),
}

# ──────────────────────────────────────────────────────────────────
# Service content per service
# ──────────────────────────────────────────────────────────────────

SERVICES = {
    'growth-website': dict(
        idx='01',
        name='Growth website',
        sub='WebGL / 3D / motion-driven brand sites, hand-built. No templates, no bloat — the site you\'re on right now is the proof.',
        what=[
            'A complete conversion-focused site, designed and coded by hand. Custom typography, motion system, cursor interactions, and a performance budget enforced from the first commit.',
            'Ships with a content model the brand can update without touching code, and on-page SEO architecture so the site does not start from zero in search.',
        ],
        when=[
            'You are a brand that needs to feel different from the competition and your current site reads generic. Your budget is ready for premium work, and you have copy + imagery that a site can actually be built around.',
        ],
        how=[
            'Discovery: one call + brief. I read your existing site and your competitors\'.',
            'Architecture: I propose sections, motion moments, and the SEO skeleton in a short doc.',
            'Design-in-code: every section built live in the browser. No Figma handoffs.',
            'Review rounds: two rounds, scoped — major + polish.',
            'Launch: I ship to your hosting, enable SEO basics, and hand over a maintenance guide.',
        ],
        stack='Vanilla HTML/CSS/JS · Three.js · GLSL shaders · Astro or plain static build',
        timeline='2–4 weeks',
        price_hint='Scoped per project; starts at serious-commitment tier',
    ),
    'seo-reboot': dict(
        idx='02',
        name='SEO reboot',
        sub='Technical audit → content architecture → internal linking → ranked. Seven years in the machinery of Google search, now with AEO and GEO layered in.',
        what=[
            'A ground-up rebuild of your organic growth engine: technical audit, content architecture, internal linking system, and a ranked outcome I can point at.',
            'Includes AEO (Answer Engine Optimization) and GEO (Generative Engine Optimization) so your content surfaces in AI-driven search, not just traditional SERPs.',
        ],
        when=[
            'You have a site that ranks for branded terms but not commercial ones, or you just launched and need the SEO foundation done right from the start.',
        ],
        how=[
            'Technical audit: crawl, index, performance, schema, internal links.',
            'Keyword + content architecture: commercial-intent mapping, topical clusters.',
            'Link system: internal linking, on-page authority flow, outbound strategy.',
            'Content execution: either I write or I brief your team.',
            'Measurement: monthly reports tying organic to revenue.',
        ],
        stack='Ahrefs · Semrush · Google Search Console · GA4 · Looker Studio',
        timeline='4–12 weeks engagement',
        price_hint='Monthly retainer or project-based',
    ),
    'lead-scraper': dict(
        idx='03',
        name='Lead scraper',
        sub='Python pipelines for Reddit, LinkedIn, Maps, Instagram, or any source with a URL. Scoring, storage, export — the whole bucket.',
        what=[
            'A custom Python scraping + enrichment pipeline built for your specific lead source. Includes scoring logic, data storage, and clean exports your sales team can use.',
            'Designed for repeatability: you run it once or on a schedule, and it just works. No manual cleanup, no fragile CSVs.',
        ],
        when=[
            'Your sales team is doing manual lead research and you know the cost is wrong. Or your existing scraper broke and you need something production-grade.',
        ],
        how=[
            'Source audit: what to scrape, what the pattern is, what signals matter.',
            'Classifier design: scoring rules for "is this a lead" based on real examples.',
            'Build: Python + Playwright + SQLite + export pipeline.',
            'Ops: cron scheduling, backups, error alerting.',
            'Handover: you get the code, the admin script, and a short runbook.',
        ],
        stack='Python · Playwright · BeautifulSoup4 · SQLite · APScheduler',
        timeline='5–10 days',
        price_hint='Scoped per source complexity',
    ),
    'chrome-extension': dict(
        idx='04',
        name='Chrome extension',
        sub='End-to-end SaaS: manifest, UI, payment, admin. Shipped.',
        what=[
            'A complete Chrome extension product — manifest v3, content script, UI, backend, Stripe billing, and an admin panel. Same shape as ProWorkSpace.',
            'Ships to the Chrome Web Store, monetised, and operated through a remote admin so you can iterate without shipping new versions.',
        ],
        when=[
            'You have an idea for a workflow tool that lives inside another web app (Upwork, LinkedIn, Notion, Shopify admin, etc.) and want it built as a product, not a one-off script.',
        ],
        how=[
            'Discovery: what the extension does, where it injects, what the user pays for.',
            'Build: manifest v3 + content script + backend API + admin.',
            'Payments: Stripe subscription flow + dunning + webhooks.',
            'Store listing: copy, screenshots, submission.',
            'Ops: remote prompt/feature-flag admin for iteration without redeploying.',
        ],
        stack='Chrome Extensions API · JavaScript · Node.js · Stripe · admin dashboard',
        timeline='3–6 weeks',
        price_hint='Scoped per product',
    ),
    'shopify-theme': dict(
        idx='05',
        name='Shopify theme',
        sub='Hand-coded Dawn forks. No apps. No bloat. Loads fast.',
        what=[
            'A custom Shopify theme built on a Dawn fork, with hand-written Liquid sections and zero third-party app dependencies.',
            'Optimised for speed, control, and maintainability. Every byte is yours.',
        ],
        when=[
            'You are a brand with a Shopify store that feels generic, slow, or bloated with app overhead. You want a store that loads like a static site.',
        ],
        how=[
            'Fork Dawn as a clean base.',
            'Rebuild each section from scratch with your brand\'s design language.',
            'Migrate catalogue + metafields cleanly.',
            'Optimise images, defer fonts, enforce CSS budget.',
            'Handover with a merchant-facing guide for day-to-day edits.',
        ],
        stack='Liquid · Shopify Dawn · Theme architecture · Hand-tuned CSS',
        timeline='2–3 weeks',
        price_hint='Per theme',
    ),
    'ai-workflow': dict(
        idx='06',
        name='AI workflow',
        sub='n8n or custom: scrape → enrich → classify → outreach. End-to-end, production-ready.',
        what=[
            'A custom AI workflow built in n8n or with custom Python/Node — chaining scraping, LLM enrichment, classification, and downstream action (CRM, email, Slack, etc.).',
            'Not a demo. Production-deployed, monitored, and documented.',
        ],
        when=[
            'You have a repetitive knowledge-work task that costs hours of manual time per week, and you want to compress it to minutes with AI in the loop.',
        ],
        how=[
            'Map the manual process: inputs, decisions, outputs.',
            'Prototype the workflow in n8n or code.',
            'Integrate with your existing tools (CRM, email, Notion, Slack).',
            'Test against real cases until reliability is production-grade.',
            'Deploy + monitor + document.',
        ],
        stack='n8n · Claude API · OpenAI API · Python · custom integrations',
        timeline='1–2 weeks',
        price_hint='Scoped per workflow complexity',
    ),
}


# ──────────────────────────────────────────────────────────────────
# WRITE EVERYTHING
# ──────────────────────────────────────────────────────────────────

import json as _json

def _build_schemas(path_rel, title, description):
    """Build per-page BreadcrumbList + WebPage JSON-LD for SEO."""
    SITE = 'https://mjrifat.com'
    canonical_path = path_rel.rstrip('/') + '/'
    parts = [p for p in path_rel.split('/') if p]
    crumbs = [{'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE + '/'}]
    acc = SITE
    for i, p in enumerate(parts, start=2):
        acc = f'{acc}/{p}'
        label = p.replace('-', ' ').title()
        # last crumb gets the page title
        if i - 1 == len(parts):
            label = title
        crumbs.append({'@type': 'ListItem', 'position': i, 'name': label, 'item': acc + '/'})

    breadcrumb = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': crumbs,
    }
    webpage = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': f'{title} — Muraduzzaman',
        'description': description,
        'url': f'{SITE}/{canonical_path}',
        'inLanguage': 'en',
        'isPartOf': {'@type': 'WebSite', 'url': f'{SITE}/', 'name': 'Muraduzzaman'},
        'about': {'@type': 'Person', 'name': 'Muraduzzaman', 'url': f'{SITE}/'},
    }
    return canonical_path, _json.dumps(breadcrumb, indent=2), _json.dumps(webpage, indent=2)


def write_page(path_rel, title, description, body, up='../'):
    canonical_path, breadcrumb_json, webpage_json = _build_schemas(path_rel, title, description)
    full = HEAD.format(
        title=html.escape(title),
        description=html.escape(description),
        up=up,
        canonical_path=canonical_path,
        breadcrumb_json=breadcrumb_json,
        webpage_json=webpage_json,
    ) + body + FOOTER.format(up=up)
    target = ROOT / path_rel / 'index.html'
    target.parent.mkdir(parents=True, exist_ok=True)
    with open(target, 'w', encoding='utf-8') as f:
        f.write(full)
    return str(target)

written = []

# simple one-level pages
written.append(write_page('about',       'About',       'A marketer who codes. Seven years of SEO, paired with production engineering. One operator, end-to-end.', build_about('../'), '../'))
written.append(write_page('work',        'Work',        'Six shipped products, each with its own case study — problem, architecture, stack, outcomes.', build_work_index('../'), '../'))
written.append(write_page('services',    'Services',    'Six things I build, scoped and delivered by one operator. No handoffs, no vendor chain.', build_services_index('../'), '../'))
written.append(write_page('contact',     'Contact',     'Currently available for select engagements. Email, phone, CV downloads, and profile links.', build_contact_page('../'), '../'))
written.append(write_page('experience',  'Experience',  'Seven years across four seats. Career arc with dates, responsibilities, and outcomes.', build_experience_page('../'), '../'))
written.append(write_page('credentials', 'Credentials', 'Certifications and formal education, listed in full.', build_credentials_page('../'), '../'))
written.append(write_page('code',        'Code',        'Four excerpts from production systems — lead classifier, scheduler, Chrome extension, storefront.', build_code_page('../'), '../'))
written.append(write_page('recognition', 'Recognition', 'Awards, rankings, analytics, performance scores, and one unusual credential.', build_recognition_page('../'), '../'))
written.append(write_page('praise',      'Praise',      'Verified Upwork testimonial from MyTown Mysteries — full-time retained client since 2023.', build_praise_page('../'), '../'))

# work case studies (two-level deep)
for slug, cfg in CASE_STUDIES.items():
    body = build_work_case(slug, up='../../', **cfg)
    written.append(write_page(f'work/{slug}', cfg['name'], cfg['sub'], body, '../../'))

# service pages (two-level deep)
for slug, cfg in SERVICES.items():
    body = build_service_page(slug, up='../../', **cfg)
    written.append(write_page(f'services/{slug}', cfg['name'], cfg['sub'], body, '../../'))

print(f'\nWrote {len(written)} pages:')
for p in written:
    rel = os.path.relpath(p, ROOT)
    print(f'  {rel}')
