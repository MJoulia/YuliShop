# YuliShop

[![CI](https://github.com/MJoulia/YuliShop/actions/workflows/ci.yml/badge.svg)](https://github.com/MJoulia/YuliShop/actions/workflows/ci.yml)

Web shop for perfumes, built with **React 19, TypeScript and Vite**. The REST API (Node.js, Express, MongoDB, with 63 automated API tests) lives in [MJoulia/yulishop-backend](https://github.com/MJoulia/yulishop-backend).

## Features

- Catalogue with search, product pages, variants (sizes) and stock-aware quantity
- Reviews with star ratings; you can edit your own review
- Basket, checkout with address validation, and a simulated card payment
- Accounts with JWT login; routes protected by role (`user` / `admin`)
- Admin area to create, edit and delete perfumes

## Engineering notes

- **One cart model** (`src/cart.ts`) shared by the product, basket, checkout and navbar pages. It replaced three incompatible copies; the product page used to store `qty` while the basket read `quantity`, which showed `NaN` totals.
- **The server is the source of truth:** the checkout only sends product ids, SKUs and quantities, and the API recalculates every price.
- **Card details never leave the browser:** the payment step is a demo with Luhn validation, ready to be swapped for Stripe Elements.
- The API base URL comes from `VITE_API_URL`, so the same build works locally and in production.

## Run locally

```bash
cp .env.example .env     # point VITE_API_URL at the API (default http://localhost:5124)
npm install
npm run dev              # http://localhost:5173
```

Quality checks (also run in CI on every push):

```bash
npm run lint
npm run build            # type-check + production build
```

## Deploy

The repo includes `vercel.json` with single-page-app rewrites. Set `VITE_API_URL` in the hosting provider's environment settings.

## License

MIT
