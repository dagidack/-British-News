# Daily Feed News UK

UK news aggregator compiling RSS feeds from national and regional British publishers.

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer

## Setup

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Visit statistics (private)

Set a password, then open `/stats` to view visitor numbers:

```bash
export STATS_PASSWORD=your-secret-password
npm start
```

The stats page is password-protected. Visit counts are stored locally in `data/stats.json` (not committed to git). Page views on the main site, contact, and privacy pages are tracked; static assets and the stats page itself are excluded.

## Regions

The site covers UK nations and English regions, including major cities such as London, Manchester, Birmingham, Leeds, Liverpool, Bristol, Newcastle, Glasgow, Edinburgh, Cardiff, and Belfast.

## Project structure

```
├── feeds.js        # RSS feed configuration per region
├── server.js       # Express API and static file server
├── public/
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── privacy.html
│   └── contact.html
└── package.json
```
