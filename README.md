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

Visitor analytics are handled by [Vercel Web Analytics](https://vercel.com/docs/analytics) when deployed on Vercel.

## Regions

The site covers UK nations and English regions, including major cities such as London, Manchester, Birmingham, Leeds, Liverpool, Bristol, Newcastle, Glasgow, Edinburgh, Cardiff, and Belfast.

## Project structure

```
├── feeds.js        # RSS feed configuration per region
├── worldcup.js     # World Cup 2026 fixtures/scores API helper
├── server.js       # Express API and static file server
├── public/
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── privacy.html
│   └── contact.html
└── package.json
```
