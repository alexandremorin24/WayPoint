# 🧩 Class Diagram – WayPoint Map Builder (MVP)

This document illustrates the core data entities and their relationships in the MVP version of the WayPoint Map Builder application.

---

## 🌳 Class Diagram

```mermaid
classDiagram

%% === CORE CLASSES (MVP)===

class User {
  +string id
  +string email
  +string displayName
  +string photoUrl
  +string authProvider       // 'google' or 'local'
  +string passwordHash       // bcrypt
  +bool emailVerified
  +Date createdAt
  +Date lastLoginAt
  +string preferredLanguage
  +boolean emailOptIn
  +createMap()
  +getMyMaps()
  +getFavoriteMaps(page, limit)
}

class Map {
  +string id
  +string name
  +string description
  +string imageUrl
  +string thumbnailUrl
  +boolean isPublic
  +string gameId
  +string gameName
  +Date createdAt
  +string ownerId
  +int imageWidth
  +int imageHeight
  +addPOI()
  +removePOI()
  +inviteUser()
  +addCategory()
  +paginatePOIs(page, limit)
  +generateThumbnails()
}

class POI {
  +string id
  +string name
  +string description
  +string mapId
  +string categoryId
  +string categoryName
  +string creatorId
  +string creatorName
  +float x
  +float y
  +string icon
  +string imageUrl
  +Date createdAt
  +Date updatedAt
  +update()
  +attachImage()
  +preloadNearbyPOIs(radius)
}

class Category {
  +string id
  +string name
  +string icon
  +string parentCategoryId?
  +addSubCategory()
  +removeSubCategory()
}

class Game {
  +string id
  +string name
  +string slug
  +string coverUrl
  +Date releaseDate
  +string genre
}

%% === ROLES MANAGEMENT ===

class MapUserRole {
  +string mapId
  +string userId
  +string role  // viewer, banned, editor_own, editor_all, contributor
}

class Invitation {
  +string id
  +string mapId
  +string invitedEmail
  +string status
  +Date createdAt
}

%% === METRICS / LOGGING ===

class POILog {
  +string id
  +string poiId
  +string mapId
  +string userId
  +string action
  +Date timestamp
  +string payload
}

class POIUserStat {
  +string id
  +string userId
  +string mapId
  +int poiCreatedCount
  +int poiUpdatedCount
}

class MapVote {
  +string id
  +string userId
  +string mapId
  +Date createdAt
}

%% ==== RELATIONSHIPS (MVP) ====

User "1" --> "many" Map : owns
User "1" --> "many" MapUserRole
User "1" --> "many" POILog
User "1" --> "many" POIUserStat

Map "1" --> "many" POI
Map "1" --> "many" Category
Map "1" --> "many" MapUserRole
Map "1" --> "many" POILog
Map "1" --> "many" POIUserStat

POI "1" --> "0..1" Category
POI "1" --> "many" POILog

User "1" --> "many" MapVote
Map "1" --> "many" MapVote

Map "1" --> "1" Game

Category "0..1" --> "many" Category : subcategories

```

---

## 🔑 Explanation of Classes

- **User**: Represents authenticated users (map creators and collaborators).
- **Map**: Represents an individual map created by a user.
- **POI (Point of Interest)**: Represents markers added to a map.
- **Category**: Organizes POIs into hierarchical categories.
- **MapUserRole**: Defines user roles and access permissions.
- **POILog**: Tracks creation and modification actions performed on POIs.
- **POIUserStat**: Aggregates statistics about user actions on POIs.
- **MapVote**: Allows users to upvote their favorite maps.

---

> 💡 **This structure ensures clarity, modularity, and ease of future feature integration, aligning with MVP requirements.**
