# 🧩 Diagramme de classes – WayPoint Map Builder (MVP)

Ce document présente les principales entités de données et leurs relations dans la version MVP de l'application WayPoint Map Builder.

---

## 🌳 Diagramme de classes

```mermaid
classDiagram

%% ==== MAIN CLASSES (MVP) ====

class User {
  +string id
  +string email
  +string displayName
  +string photoUrl
  +createMap()
  +getMyMaps()
  +getFavoriteMaps(page, limit)
}

class Map {
  +string id
  +string name
  +string description
  +string imageUrl
  +boolean isPublic
  +Date createdAt
  +string ownerId
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
  +float x
  +float y
  +string icon
  +string imageUrl
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

class Collaboration {
  +string id
  +string role
  +notifyChange(actionType, payload)
}

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
User "1" --> "many" Collaboration
User "1" --> "many" POILog
User "1" --> "many" POIUserStat

Map "1" --> "many" POI
Map "1" --> "many" Category
Map "1" --> "many" Collaboration
Map "1" --> "many" POILog
Map "1" --> "many" POIUserStat

POI "1" --> "0..1" Category
POI "1" --> "many" POILog

User "1" --> "many" MapVote
Map "1" --> "many" MapVote

Category "0..1" --> "many" Category : subcategories

```

---

## 🔑 Explication des classes

- **User**: représente les utilisateurs authentifiés (créateurs et collaborateurs).
- **Map**: représente une carte individuelle créée par un utilisateur.
- **POI (Point of Interest)**: représente les marqueurs ajoutés à une carte.
- **Category**: organise les POI en catégories hiérarchiques.
- **Collaboration**: définit les rôles et permissions d'accès des utilisateurs.
- **POILog**: journalise les actions de création et modification effectuées sur les POI.
- **POIUserStat**: compile des statistiques sur les actions utilisateur concernant les POI.
- **MapVote**: permet aux utilisateurs de voter pour leurs cartes favorites.

---

>💡 **Cette structure garantit clarté, modularité et facilité d'intégration des fonctionnalités futures, conformément aux exigences du MVP.**
