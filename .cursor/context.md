## 🧠 Project Context – WayPoint Frontend + Backend (Cursor Setup)

You are working on the full-stack application **WayPoint - Map Builder**, built with:

- **Frontend**: Vue 3 + Vite + Vuetify + Leaflet.js
- **Backend**: Node.js + Express + MySQL + Prisma

This context is primarily focused on **frontend work**, but you must always make sure the **frontend logic is aligned with the backend structure and expectations**.

---

### 📁 Project Structure (relevant paths)

#### Backend (`/backend`)
- **Source code**: `backend/src/`
  - API routes (`/routes`), controllers, models (MySQL/Prisma), middlewares, utils
- **Tests**: `backend/tests/`
  - All Jest tests are functional for `auth`, `maps`, `users`, and `pois`
- **DB Scripts**: `backend/scripts/`
  - SQL files for test database reset/init

#### Frontend (`/frontend`)
- **Pages**: `frontend/pages/`
  - Dynamic route: `pages/maps/[mapId].vue` is the **Map Editor page**
- **Components**: `frontend/components/`
  - UI blocks (sidebar, filters, map controls, etc.)
- **State**: Pinia (global stores for maps, POIs, etc.)
- **UI Kit**: Vuetify (v3, Material Design components)
- **Map rendering**: Leaflet + overlay image from uploaded file

---

### 🆕 Current Feature in Progress – POI (Frontend)

You are building the **Map Editor** interface inside `[mapId].vue`, and implementing POI logic in the frontend.

The frontend must reflect backend constraints:
- A POI has: `id`, `map_id`, `x`, `y`, `name`, `description`, `category_id`, and optional image
- Coordinates `x` and `y` are relative to the map image (`0 <= x <= width`, `0 <= y <= height`)
- You must **fetch valid categories**, and **respect role-based access** when implementing create/update/delete

🛑 You must **always inspect backend structure** (routes, models, validation) before calling APIs or assuming data shapes.

---

### ✅ UI Goals – Map Editor

The `[mapId].vue` page must:
- Display the map image using Leaflet
- Show POIs as pins on the map
- Include a **sidebar UI** with game name, map info, and POI category filters
- Later support: POI creation, edition, category management, and collaborative access

Initial implementation can use mock data (POIs, categories), but must be ready to connect to the real API.

---

### ✅ Guidelines

- 🔍 Always check backend routes/controllers/models before integrating features
- 🗺️ Leaflet is used to render the map with interactive pins (POIs)
- 📦 Use Vuetify components for layout: `v-card`, `v-navigation-drawer`, `v-list`, `v-btn`, etc.
- 🧪 Match frontend conventions (composition API, scoped styles, modular components)
- 🌍 Map interaction and POI rendering should be modular and reactive
