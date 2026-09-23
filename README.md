# Nexgensis Technologies — Product Admin Dashboard

Next.js + React + Tailwind CSS + Axios assignment using the free DummyJSON API.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

Demo login:
- Username: `emilys`
- Password: `emilyspass`

## Completed

- Login/logout and protected product routes
- Shared Axios client with auth token interceptor and centralized error logging
- Product table with responsive horizontal scrolling
- Pagination with 10/20/50 page sizes
- Search with debounce and AbortController cancellation
- Category filtering
- Sorting by price, rating and title
- Product details and not-found handling
- Add/edit/delete with validation and confirmation
- Loading, empty and error/retry states
- Product list state kept in URL query parameters

## API limitation / approach

DummyJSON does not provide a combined search + category endpoint for this flow. The UI therefore uses search when a search query exists and disables the category selector while searching. When search is cleared, category filtering becomes available.

DummyJSON add/edit/delete endpoints are simulated. The app updates its local product list immediately after a successful API response so the UI demonstrates the requested change even though the remote demo API does not persist mutations.

## AI usage

AI assistance was used for scaffolding and implementation guidance. The code was reviewed and tested manually, and the implementation choices are documented above.

## Submission note

Create regular Git commits while working rather than one large final commit.
