# Copilot Instructions for AI Agents

## Project Overview
This codebase is a web application with a modular structure, primarily using HTML, JavaScript, and PHP. The main application logic is in the `tools-web-app/` directory, with supporting assets and scripts in the `assets/` subfolder.

## Key Components
- **tools-web-app/tools-web-app.php**: Main PHP backend entry point. Handles server-side logic and integration.
- **assets/app.js**: Central JavaScript file for client-side logic and event handling.
- **assets/firebase.js**: Handles Firebase integration (authentication, database, etc.).
- **assets/state.js**: Manages application state, likely using a global or singleton pattern.
- **assets/ui.js**: UI rendering and DOM manipulation logic.

## Architecture & Data Flow
- The frontend (JS in `assets/`) communicates with the backend (`tools-web-app.php`) via AJAX/fetch requests.
- State is managed in `state.js` and shared across UI components in `ui.js`.
- Firebase is used for authentication and/or data storage; see `firebase.js` for configuration and usage patterns.

## Developer Workflows
- **No build step**: Code is interpreted directly by the browser/PHP server. Deploy by copying files.
- **Debugging**: Use browser dev tools for JS; PHP errors appear in server logs or browser output.
- **Testing**: No automated test framework detected. Manual testing via browser is standard.

## Project-Specific Conventions
- All client-side logic is modularized by concern (app, state, ui, firebase).
- Use ES6+ syntax in JS files.
- Keep all new assets in the `assets/` directory.
- Backend changes go in `tools-web-app.php`.
- Use descriptive function and variable names; avoid abbreviations.

## Integration Points
- **Firebase**: All authentication and real-time data flows are handled in `firebase.js`.
- **AJAX/Fetch**: All server communication should go through fetch/AJAX to `tools-web-app.php`.

## Examples
- To add a new UI feature, update `ui.js` and, if needed, add state logic to `state.js`.
- To add a new backend endpoint, extend `tools-web-app.php` and call it from JS using fetch.

## References
- See `assets/app.js` for main app logic and event wiring.
- See `assets/firebase.js` for external service integration patterns.

---

**Keep instructions concise and up-to-date. Update this file if project structure or conventions change.**
