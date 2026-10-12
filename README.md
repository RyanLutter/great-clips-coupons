# Great Clips Coupons

This repository contains the static website and the local scraper output used to publish Great Clips coupon offers with GitHub Pages.

## Published website

The site is served from the repository root:

- `index.html` provides the page layout.
- `script.js` reads `data.json` and displays offers grouped by state and city.
- `data.json` is the latest generated offer data and is the only crawler output intended for GitHub Pages.

## Local scraper

The Python scraper lives in `scraper/` and is ignored by Git. It crawls Great Clips coupon pages, follows offer links, extracts offer location, price, and expiration details, then groups the results by state and city. The latest results are written to the root `data.json`. Timestamped snapshots are saved in `scraper/history/`; neither the scraper source nor its history is uploaded to GitHub.

To run it from the repository root, install the scraper dependencies (`selenium` and `webdriver-manager`) and run:

```powershell
python scraper/main.py "https://coupons-greatclips.com/" ""
```

Pass a search phrase as the second argument to set the offer match field. The scraper uses headless Chrome and ChromeDriver managed by `webdriver-manager`.

After reviewing the generated `data.json`, commit and push the static site files to update GitHub Pages.
