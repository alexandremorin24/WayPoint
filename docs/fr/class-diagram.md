# 🧩 Diagramme de classes – WayPoint Map Builder (MVP)

Ce document présente les principales entités de données et leurs relations dans la version MVP de l'application WayPoint Map Builder.

---

## 🌳 Diagramme de classes

```mermaid
classDiagram

%% ==== CLASSES PRINCIPALES  ====

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

%% === GESTION DES ROLES ===

class MapUserRole {
  +string mapId
  +string userId
  +string role  // viewer, editor
}

class Invitation {
  +string id
  +string mapId
  +string invitedEmail
  +string status
  +Date createdAt
}

%% === DONNEES / LOGS ===

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

## 🔑 Explication des classes

- **User**: représente les utilisateurs authentifiés (créateurs et collaborateurs).
- **Map**: représente une carte individuelle créée par un utilisateur.
- **POI (Point of Interest)**: représente les marqueurs ajoutés à une carte.
- **Category**: organise les POI en catégories hiérarchiques.
- **MapUserRole**: définit les rôles et permissions d'accès des utilisateurs.
- **POILog**: journalise les actions de création et modification effectuées sur les POI.
- **POIUserStat**: compile des statistiques sur les actions utilisateur concernant les POI.
- **MapVote**: permet aux utilisateurs de voter pour leurs cartes favorites.

---

>💡 **Cette structure garantit clarté, modularité et facilité d'intégration des fonctionnalités futures, conformément aux exigences du MVP.**
