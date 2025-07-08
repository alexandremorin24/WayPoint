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

%% === ROLES MANAGEMENT ===

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

%% === METRICS / LOGGING ===

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

%% === PERMISSIONS MANAGEMENT ===

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

## 🔑 Explanation of Classes

- **User**: Represents authenticated users (map creators and collaborators).
- **PasswordResetToken**: Manages password reset tokens with expiration.
- **Map**: Represents an individual map created by a user with dimensions and metadata.
- **POI (Point of Interest)**: Represents markers added to a map with coordinates and category.
- **Category**: Organizes POIs into hierarchical categories with colors and icons.
- **Game**: Represents video games linked to maps with IGDB metadata.
- **MapUserRole**: Defines user roles and access permissions (viewer/editor).
- **MapInvitation**: Manages collaboration invitations with tokens and statuses.
- **POILog**: Tracks all creation and modification actions performed on POIs.
- **POIUserStat**: Aggregates statistics about user contributions.
- **MapVote**: Allows users to upvote their favorite maps.
- **Role**: Utility class for centralized permission management.

---

## 🔄 Changes from Previous Version

### ✅ **Classes Added:**
- **PasswordResetToken**: Secure password reset token management
- **Role**: Centralized permission logic
- **MapInvitation**: Replaces generic `Invitation` class

### 🔧 **Properties Added:**
- **Category**: `color`, `createdAt`, `updatedAt`, `parentCategoryName`
- **POI**: `color`, `updaterName` (from relations)
- **Game**: `createdAt`, `genres` (instead of `genre`)
- **Map**: clarified `description VARCHAR(120)`

### 📋 **Methods Updated:**
- All methods now correspond to actual model exports
- Added validation and permission management methods
- Automatic cleanup methods (expired tokens, invitations)

> 💡 **This structure accurately reflects the real implementation and ensures precise technical documentation for project maintenance and evolution.**
