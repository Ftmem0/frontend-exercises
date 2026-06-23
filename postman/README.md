# WP HW2 - Postman-like API Client

A complete client-side API testing tool built with **React + TypeScript** for Web Programming HW2.

## Run

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite, usually `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

## Project structure

```text
src/
  App.tsx                    Main state and application actions
  main.tsx                   React entry point
  styles.css                 Global responsive/dark-mode styling
  constants.ts               Shared constants
  types.ts                   TypeScript domain types
  components/                Reusable UI components
    AppHeader.tsx
    BodyEditor.tsx
    CollectionsPanel.tsx
    HistoryPanel.tsx
    KeyValueEditor.tsx
    RequestBar.tsx
    ResponsePanel.tsx
    TabBar.tsx
    Workspace.tsx
  data/
    defaultState.ts          Default tabs, requests, collections, clone helpers
  storage/
    localStorage.ts          Load/save browser LocalStorage state
  utils/
    date.ts                  Date formatting
    download.ts              JSON export helper
    id.ts                    ID generator
    request.ts               URL, headers, body, and request helpers
    status.ts                Response status CSS helper
```

## Implemented checklist

- Responsive user interface
- Dark mode
- Loading state while sending requests
- HTTP method selection: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
- URL input and validation for `http://` and `https://`
- Query parameter add/edit/delete with final URL preview
- Header add/edit/delete
- Raw / JSON request body editor
- JSON body validation before sending
- Response status code, headers, body, size, and elapsed time display
- Network/input/CORS error handling
- Clear/reset request form
- LocalStorage persistence for tabs, history, collections, and theme
- Request history with load/delete/clear actions
- Collections with create/save/load/delete actions
- Import/export collections as JSON
- Multi-tab support with independent request data per tab

## Submission name

Rename the final zip file to:

```text
WP-HW2-[STDID].zip
```

Replace `[STDID]` with your student number.
