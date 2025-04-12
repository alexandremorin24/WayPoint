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
| **Vue.js**         | Frontend           | Reactive, component-based, smooth learning curve.          |
| **Vite**           | Dev Server         | Fast and efficient, built-in support for Vue 3.            |
| **Vuetify**        | UI/UX              | Rich UI components, Material Design, ideal for Vue PWAs.   |
| **Leaflet.js**     | Interactive Maps   | Lightweight, open-source, suitable for custom image maps.  |
| **Express.js**     | Backend            | Minimalist, flexible Node.js framework, easy API building. |
| **Socket.io**      | Real-time          | For real-time collaboration (planned post-MVP).            |
| **Google OAuth2 + Email Auth** | Authentication | Dual login system: Google OAuth2 or Email/Password. Email confirmation sent via Resend. |
| **Firebase Storage**| File Storage      | Easy image storage for uploaded maps and POIs.             |
| **Axios**          | API Requests       | Simplifies frontend-backend HTTP communication.            |

---

## ☁️ Hosting & Deployment

| Platform    | Role                | Why chosen?                                                           |
|-------------|---------------------|-----------------------------------------------------------------------|
| **Railway** | Backend & Database  | Simple, efficient hosting for Express API and MySQL, easy setup.      |
| **Vercel**  | Frontend            | Rapid deployment, optimal for Vue/Vite apps, built-in PWA support.    |
+ **Firebase Storage** | File Storage | Stores map background images, POI images, and custom icons. |
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
| Resend | Email Delivery | Handles email verification links and transactional emails (e.g. sign-up confirmation). |

---

## 🗃️ Database Management

- **Prisma ORM**
  - Simplifies MySQL interactions with intuitive schemas and type-safe queries.
  - [Prisma Documentation](https://www.prisma.io/docs)

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
  - Thumbnails automatically generated via Firebase Storage for efficient image loading.

### 🔄 Real-time Collaboration Optimization (Socket.io)
- **Efficient Connection Management**
  - Handling WebSocket connections robustly, with graceful fallback mechanisms.
- **Notification Optimization**
  - Notifications throttled and batched to optimize real-time collaboration performance.


> 💡 **Stack decisions were made to prioritize ease of use, maintainability, and scalability, aligned with project scope and objectives.**
