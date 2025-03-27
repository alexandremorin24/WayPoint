# 🛠 Features – WayPoint Map Builder

WayPoint Map Builder is designed with a clear distinction between the **Minimum Viable Product (MVP)** features and future improvements planned for the post-MVP roadmap.

---

## 🚩 MVP Features

### 1. Custom Map Upload
- Users can upload custom images as map backgrounds.

### 2. Points of Interest (POIs)
- Creation of POIs with:
  - Coordinates (X/Y)
  - Name, description
  - Optional icon (custom or predefined)
  - Optional image attachment

### 3. Hierarchical Categorization
- POIs can be organized by:
  - Categories
  - Subcategories

### 4. Collaborative Access Management
- Map creators can:
  - Invite users via email
  - Revoke access anytime
- Invited collaborators can:
  - Add/edit POIs
  - Create/edit categories and subcategories
- Non-invited users:
  - View public maps
  - Cannot modify content

### 5. Real-time Collaboration (Live Mode)
- Collaborators can edit maps simultaneously
- Changes are immediately saved
- All actions logged in the database

### 6. Public Sharing & Exploration
- Maps can be shared publicly via a dedicated URL
- Read-only mode for public visitors
- Public home page:
  - Recent public maps
  - Popular/upvoted maps

### 7. Technical Logging & History
- Each POI action (create/edit) is logged with detailed metadata:
  - User, timestamp, action type, and payload
- Aggregated stats on user activity (POI creation/updates)

### 8. Game selection (via external API)

- When creating a map, users must select the game it belongs to.
- Game data is fetched from the external **IGDB API** (via Twitch).
- The list is searchable (autocomplete) and includes metadata like:
  - Official name
  - Cover image
  - Slug (used for public map URLs)
- Maps can then be grouped, filtered or displayed by game.

> Note: This integration allows building `/game/:slug` pages in the future.

---

## 🚀 Roadmap (Post-MVP)

### 🛡️ Advanced Access & Role Management
- Customized roles (Admin, Editor, Viewer)
- Ownership transfer between users
- Enhanced granular permission management

### 💬 Collaboration Enhancements
- **Proposal Mode Collaboration**
  - Changes suggested by editors and validated/rejected by admins
  - Integrated proposal history
  - Partial acceptance of proposed changes
- **Real-time Chat**
  - Chat system integrated per map
  - Accessible only to users with editing permissions
  - Real-time messaging for efficient collaboration and decision-making

### 📈 Enhanced Public & User Experience
- Advanced public map exploration (filters by game, tags, manual admin highlights)
- **User Comments**
  - Allow visitors to comment or suggest improvements on maps or specific POIs
- **Favorite Maps**
  - Users can save and easily manage favorite maps

### 🔔 Notifications & User Engagement
- **PWA Push Notifications**
  - Real-time notifications about important map updates or collaboration events

### 📜 Detailed Activity & Change Management
- Visual action history and interactive timeline
- Version rollback for maps and POIs

---

## 📌 Comparison of Collaboration Modes

| Feature                      | Live Mode (MVP) | Proposal Mode (Post-MVP) |
|------------------------------|-----------------|---------------------------|
| Modify map                   | ✅ Direct       | ✅ After validation       |
| Synchronization              | ✅ Immediate    | ✅ Immediate              |
| Technical action history     | ✅ Basic logs   | ✅ Enhanced logs          |
| Tracking interface           | ❌              | ✅ Planned                |
| Suggest changes              | ❌              | ✅ Available              |
| Customized roles             | ❌              | ✅ Available              |
| Partial acceptance of changes| ❌              | ✅ Available              |

---
