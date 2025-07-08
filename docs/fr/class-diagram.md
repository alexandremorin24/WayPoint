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
  +boolean emailOptin
  +createUser()
  +findUserByEmail()
  +findUserById()
  +updateUserEmailVerified()
  +findUserByDisplayName()
  +updateUserProfile()
  +updatePassword()
}

class PasswordResetToken {
  +string id
  +string userId
  +string token
  +Date expiresAt
  +boolean used
  +Date createdAt
  +createToken(userId)
  +validateToken(token)
  +markAsUsed(token)
  +getActiveTokensCount(userId)
  +cleanupExpiredTokens()
}

class Map {
  +string id
  +string name
  +string description        // VARCHAR(120)
  +string imageUrl
  +string thumbnailUrl
  +boolean isPublic
  +string gameId
  +Date createdAt
  +string ownerId
  +int imageWidth
  +int imageHeight
  +createMap()
  +findMapById()
  +findMapsByOwner()
  +updateMap()
  +deleteMap()
  +findPublicMapsPaginated()
  +hasEditorAccess()
  +canView()
  +canEdit()
  +addRole()
  +removeRole()
  +getMapUsers()
  +getUserRole()
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
  +string updaterName
  +float x
  +float y
  +string icon              // from category
  +string color             // from category
  +string imageUrl
  +Date createdAt
  +Date updatedAt
  +createPOI()
  +findPOIById()
  +findPOIsByMapId()
  +findPOIsByCategory()
  +findPOIsByCreator()
  +updatePOI()
  +deletePOI()
}

class Category {
  +string id
  +string mapId
  +string name
  +string color             // hex color code
  +string icon              // icon identifier
  +string parentCategoryId
  +string parentCategoryName
  +Date createdAt
  +Date updatedAt
  +createCategory()
  +findCategoryById()
  +findCategoriesByMapId()
  +updateCategory()
  +deleteCategory()
  +validateCategory()
  +hasChildren()
}

class Game {
  +string id
  +string name
  +string slug
  +string coverUrl
  +Date releaseDate
  +string genres            // TEXT field
  +Date createdAt
  +findGameByName()
  +createGame()
  +findPublicMapsByGameId()
  +findPublicMapsByGameName()
}

%% === GESTION DES ROLES ===

class MapUserRole {
  +string mapId
  +string userId
  +string role              // viewer, editor
  +addRole()
  +removeRole()
  +hasAnyRole()
  +canAddPOI()
  +canEditPOI()
  +canCreatePOI()
}

class MapInvitation {
  +string id
  +string mapId
  +string inviterId
  +string inviterName
  +string inviteeEmail
  +string role              // viewer, editor
  +string status            // pending, accepted, rejected, expired, cancelled
  +string token
  +Date createdAt
  +Date expiresAt
  +string mapName
  +string gameId
  +string gameName
  +createInvitation()
  +findInvitationByToken()
  +updateInvitationStatus()
  +checkExistingInvitation()
  +cleanupExpiredInvitations()
  +getPendingInvitationsForMap()
  +getPendingInvitationsForUser()
  +cancelInvitation()
  +isInvitationValid()
}

%% === DONNEES / LOGS ===

class POILog {
  +string id
  +string poiId
  +string mapId
  +string userId
  +string action            // create, update
  +Date timestamp
  +JSON payload
  +logPOIAction()
}

class POIUserStat {
  +string id
  +string userId
  +string mapId
  +int poiCreatedCount
  +int poiUpdatedCount
  +incrementUserPOICreated()
  +incrementUserPOIUpdated()
}

class MapVote {
  +string id
  +string userId
  +string mapId
  +Date createdAt
}

%% === GESTION DES PERMISSIONS ===

class Role {
  +string[] ROLES           // viewer, editor
  +object ROLE_PERMISSIONS
  +isEditor(role)
  +isViewer(role)
  +getRolePermissions(role)
  +hasPermission(role, permission)
  +isValidRole(role)
}

%% ==== RELATIONSHIPS (MVP) ====

User "1" --> "many" Map : owns
User "1" --> "many" PasswordResetToken : generates
User "1" --> "many" MapUserRole : collaborates
User "1" --> "many" POILog : modifies
User "1" --> "many" POIUserStat : contributes
User "1" --> "many" MapVote : votes
User "1" --> "many" MapInvitation : invites
User "1" --> "many" POI : creates

Map "1" --> "many" POI : contains
Map "1" --> "many" Category : organizes
Map "1" --> "many" MapUserRole : has_access
Map "1" --> "many" POILog : logs
Map "1" --> "many" POIUserStat : stats
Map "1" --> "many" MapVote : is_voted_on
Map "1" --> "many" MapInvitation : has_invitations

Game "1" --> "many" Map : is_linked

POI "1" --> "many" POILog : logged
Category "0..1" --> "many" POI : classifies
Category "0..1" --> "many" Category : subcategories

```

---

## 🔑 Explication des classes

- **User**: représente les utilisateurs authentifiés (créateurs et collaborateurs).
- **PasswordResetToken**: gère les jetons de réinitialisation de mot de passe avec expiration.
- **Map**: représente une carte individuelle créée par un utilisateur avec dimensions et métadonnées.
- **POI (Point of Interest)**: représente les marqueurs ajoutés à une carte avec coordonnées et catégorie.
- **Category**: organise les POI en catégories hiérarchiques avec couleurs et icônes.
- **Game**: représente les jeux vidéo liés aux cartes avec métadonnées IGDB.
- **MapUserRole**: définit les rôles et permissions d'accès des utilisateurs (viewer/editor).
- **MapInvitation**: gère les invitations de collaboration avec tokens et statuts.
- **POILog**: journalise toutes les actions de création et modification sur les POI.
- **POIUserStat**: compile des statistiques sur les contributions utilisateur.
- **MapVote**: permet aux utilisateurs de voter pour leurs cartes favorites.
- **Role**: classe utilitaire pour la gestion centralisée des permissions.

---

## 🔄 Nouveautés par rapport à la version précédente

### ✅ **Classes ajoutées :**
- **PasswordResetToken**: gestion sécurisée des réinitialisations de mot de passe
- **Role**: centralisation de la logique des permissions
- **MapInvitation**: remplace la classe générique `Invitation`

### 🔧 **Propriétés ajoutées :**
- **Category**: `color`, `createdAt`, `updatedAt`, `parentCategoryName`
- **POI**: `color`, `updaterName` (depuis les relations)
- **Game**: `createdAt`, `genres` (au lieu de `genre`)
- **Map**: précision `description VARCHAR(120)`

### 📋 **Méthodes mises à jour :**
- Toutes les méthodes correspondent maintenant aux exports réels des modèles
- Ajout des méthodes de validation et de gestion des permissions
- Méthodes de nettoyage automatique (tokens expirés, invitations)

>💡 **Cette structure reflète fidèlement l'implémentation réelle et garantit une documentation technique précise pour la maintenance et l'évolution du projet.**
