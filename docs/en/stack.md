# 🚀 Technology Stack – WayPoint Map Builder

The WayPoint Map Builder project leverages modern web technologies carefully chosen to ensure scalability, ease of use, and maintainability. Below is the detailed tech stack along with rationale and alternatives considered.

---

## 🌐 Languages & Core Technologies

| Technology       | Role                  | Why?                                                              |
|------------------|-----------------------|-------------------------------------------------------------------|
| **JavaScript**   | Frontend & Backend    | Unified language for frontend (**Vue.js**) and backend (Node.js). |
| **HTML/CSS**     | Structure & Styling   | Managed via Vue components with Vuetify for consistent UI.         |
| **SQL (MySQL)**  | Database              | Structured relational database ideal for maps, users, POIs.       |

---

## ⚙️ Frameworks & Libraries

| Tool               | Category           | Reason for choice                                           |
|--------------------|--------------------|------------------------------------------------------------|
| **Nuxt.js 3**      | Frontend Framework | Universal Vue.js framework with SSR, static generation.    |
| **Vue.js 3**       | Frontend           | Reactive, component-based, smooth learning curve.          |
| **Vuetify 3**      | UI/UX              | Rich UI components, Material Design, ideal for Vue PWAs.   |
| **Leaflet.js**     | Interactive Maps   | Lightweight, open-source, suitable for custom image maps.  |
| **Express.js**     | Backend            | Minimalist, flexible Node.js framework, easy API building. |
| **Socket.io**      | Real-time          | For real-time collaboration (planned post-MVP).            |
| **Google OAuth2 + Email Auth** | Authentication | Dual login system: Google OAuth2 or Email/Password. Email confirmation sent via Mailtrap. |
| **Local Storage**  | File Storage       | Local file storage with Docker volumes for development.    |
| **Axios**          | API Requests       | Simplifies frontend-backend HTTP communication.            |

---

## ☁️ Hosting & Deployment

| Platform         | Role                | Why chosen?                                                           |
|------------------|---------------------|-----------------------------------------------------------------------|
| **Docker Compose** | Full Stack       | Local development environment with database, backend, and frontend.   |
| **Local Storage** | File Storage       | Stores map background images, POI images, and custom icons locally.   |
---

## 🧪 Development & Productivity Tools

| Tool                 | Purpose               | Reason for choice                                     |
|----------------------|-----------------------|-------------------------------------------------------|
| **Git + GitHub**     | Version Control       | Essential for collaborative work, open-source prep.  |
| **Postman**          | API Testing           | Easy API testing and debugging during backend dev.   |
| **Excalidraw**       | Diagrams & Design     | Fast, collaborative diagramming for technical docs.  |
| **npm / yarn**       | Dependency Management | Package installation and management.                 |
| **dotenv**           | Environment Variables | Securely manage API keys and sensitive credentials.  |

---

## 📡 External Services / APIs

| Service | Role                          | Why use it?                                                |
|---------|-------------------------------|------------------------------------------------------------|
| IGDB API (via Twitch) | Game metadata provider       | Enables users to select official games when creating maps. Includes covers, release dates, and game slugs. |
| Mailtrap | Email Delivery (Development) | Handles email verification links and transactional emails during development. |

---

## 🗃️ Database Management

- **MySQL2**
  - Direct MySQL database client for Node.js with promise support.
  - Provides raw SQL access for flexible database operations.

---

## ⚡ State Management
- **Pinia**
  - Official Vue 3 state management solution.
  - Integrates seamlessly with Composition API.
  - [Official Pinia Documentation](https://pinia.vuejs.org/)

---

## 📊 Analytics & Monitoring
- **Google Analytics** (Recommended for comprehensive analytics)
  - [Google Analytics Setup](https://developers.google.com/analytics/devguides/collection/gtagjs)
- **Plausible or Matomo** (Privacy-friendly, open-source alternatives)
  - [Plausible Analytics](https://plausible.io/docs)
  - [Matomo Analytics](https://matomo.org/docs/javascript-tracking/)

---

## 🔄 Considered Alternatives

| Component    | Alternative Options        | Reason Not Chosen                             |
|--------------|----------------------------|-----------------------------------------------|
| Frontend     | React, Svelte, Next.js     | React replaced by Vue.js for simplicity and Vuetify integration. |
| Maps         | Mapbox, Google Maps        | Licensing complexity or pricing barriers.     |
| Backend      | Fastify, NestJS, Django    | Overkill for project scale or non-JS stack.   |
| Database     | PostgreSQL, MongoDB        | Complexity vs. current needs, relational fit. |
| Auth & Storage | Auth0, AWS S3, Clerk     | More complex integration, unnecessary features.|

---

---

## 📈 Performance & Scalability (Implemented from MVP)

To prepare for rapid adoption and ensure smooth scalability, the following optimizations are directly implemented from the MVP stage:

### 🔍 Database Optimizations (MySQL)
- **Immediate SQL indexing** on critical fields:
  - `owner_id`, `map_id`, `user_id`, `created_at`, `is_public`
- **Server-side Pagination**
  - Implemented on critical API endpoints (e.g., retrieving public maps)

### 🌐 Frontend Optimizations
- **Dynamic POI Loading**
  - POIs dynamically loaded based on user's viewport to enhance performance and reduce server load.
- **Automated Image Optimization**
  - Thumbnails automatically generated via Sharp for efficient image loading.

### 🔄 Real-time Collaboration (Future)
- **WebSocket Implementation (Planned)**
  - Socket.io integration planned for post-MVP real-time collaboration features.


> 💡 **Stack decisions were made to prioritize ease of use, maintainability, and scalability, aligned with project scope and objectives.**
