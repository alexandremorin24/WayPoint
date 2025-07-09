# 🚀 Stack Technique – WayPoint Map Builder

Le projet WayPoint Map Builder utilise des technologies web modernes, soigneusement choisies pour assurer évolutivité, facilité d’utilisation et maintenabilité. Ci-dessous, le détail complet des choix techniques ainsi que les alternatives envisagées.

---

## 🌐 Langages & Technologies Principales

| Technologie       | Rôle                  | Pourquoi ?                                                            |
|-------------------|-----------------------|-----------------------------------------------------------------------|
| **JavaScript**    | Frontend & Backend    | Langage unifié pour frontend (**Vue.js**) et backend (Node.js).      |
| **SQL (MySQL)**   | Base de données       | Base relationnelle structurée idéale pour maps, utilisateurs, POIs.   |
| **HTML/CSS**      | Structure & Style     | Géré via composants Vue avec Vuetify pour une UI riche et cohérente.  |

---

## ⚙️ Frameworks & Bibliothèques

| Outil               | Catégorie           | Raisons du choix                                           |
|---------------------|---------------------|------------------------------------------------------------|
| **Nuxt.js 3**       | Framework Frontend  | Framework Vue.js universel avec SSR, génération statique. |
| **Vue.js 3**        | Frontend            | Réactif, composantiel, courbe d'apprentissage douce.       |
| **Vuetify 3**       | UI/UX               | Composants riches, cohérents, adaptés mobile/PWA.          |
| **Leaflet.js**      | Cartes interactives | Léger, open-source, adapté aux cartes avec images perso.   |
| **Express.js**      | Backend             | Minimaliste, flexible, construction simple d’API REST.     |
| **Socket.io**       | Temps réel          | Collaboration temps réel (prévu post-MVP).                 |
| 🔐 Authentification   | Google OAuth2 + Email/mot de passe (via Mailtrap) |
| **Stockage local**  | Stockage fichiers   | Stockage local avec volumes Docker pour développement.     |
| **Axios**           | Requêtes API        | Communication HTTP frontend-backend simplifiée.            |


---

## ☁️ Hébergement & Déploiement

| Plateforme       | Rôle                 | Pourquoi choisie ?                                                      |
|------------------|----------------------|-------------------------------------------------------------------------|
| **Docker Compose** | Stack complète    | Environnement de développement local avec base, backend et frontend.    |
| **Stockage local** | Stockage de fichiers | Stocke les images de cartes, POI et icônes personnalisées localement.  |
---

## 🧪 Outils de Développement & Productivité

| Outil                | Rôle                    | Raison du choix                                       |
|----------------------|-------------------------|-------------------------------------------------------|
| **Git + GitHub**     | Versioning              | Essentiel pour collaboration, préparation open-source.|
| **Postman**          | Tests API               | Tests et debug simplifiés pendant le développement.    |
| **Excalidraw**       | Diagrammes & Conception | Diagrammes rapides et collaboratifs pour docs techniques.|
| **npm / yarn**       | Gestion dépendances     | Installation et gestion efficace des packages.         |
| **dotenv**           | Variables d'environnement| Gestion sécurisée des clés API et infos sensibles.     |

---

## 📡 Services externes / APIs

| Service                | Rôle                                      | Pourquoi l’utiliser ?                                                                                   |
|------------------------|-------------------------------------------|----------------------------------------------------------------------------------------------------------|
| **IGDB API (via Twitch)** | Fournisseur de métadonnées de jeux vidéo | Permet aux utilisateurs de sélectionner un jeu officiel lors de la création d'une map. Inclut les visuels (covers), dates de sortie et slugs. |
| Mailtrap | Envoi d’emails | Gère l’envoi des liens de confirmation et les messages transactionnels (inscription, etc.). |
---

## ⚡ Gestion d'état
- **Pinia**
  - Gestionnaire d'état officiel de Vue 3.
  - Intégration naturelle avec Composition API.
  - [Documentation officielle Pinia](https://pinia.vuejs.org/)

---

## 📊 Outils analytiques & suivi utilisateur
- **Google Analytics** (Recommandé pour un suivi complet des utilisateurs)
  - [Mise en place Google Analytics](https://developers.google.com/analytics/devguides/collection/gtagjs)
- **Plausible ou Matomo** (Alternatives open-source respectueuses de la vie privée)
  - [Documentation Plausible Analytics](https://plausible.io/docs)
  - [Documentation Matomo Analytics](https://matomo.org/docs/javascript-tracking/)

---

## 📈 Performance & Scalabilité (intégrées dès le MVP)

Afin d’anticiper une adoption rapide et de garantir des performances optimales, les optimisations suivantes seront mises en place dès la première version :

### 🔍 Optimisations base de données (MySQL)
- **Indexation SQL immédiate** sur les champs critiques :
  - `owner_id`, `map_id`, `user_id`, `created_at`, `is_public`
- **Pagination côté serveur**
  - Mise en place immédiate sur les routes API critiques (ex : récupération des cartes publiques)

### 🌐 Optimisations frontend
- **Chargement dynamique des POI**
  - Chargement dynamique basé sur la zone visible par l'utilisateur pour réduire la charge serveur.
- **Optimisation automatique des images**
  - Génération automatique de miniatures via Sharp pour un chargement efficace des images.

### 🔄 Collaboration temps réel (Futur)
- **Implémentation WebSocket (Planifiée)**
  - Intégration Socket.io prévue pour les fonctionnalités de collaboration temps réel post-MVP.

---

## 🔄 Alternatives Envisagées

| Composant   | Alternatives             | Raisons du rejet                                   |
|-------------|--------------------------|----------------------------------------------------|
| Frontend    | React, Svelte, Next.js   | React remplacé par Vue.js pour sa simplicité et Vuetify. |
| Cartes      | Mapbox, Google Maps      | Complexité licence ou coût élevé.                  |
| Backend     | Fastify, NestJS, Django  | Trop lourd pour l’échelle projet ou stack non-JS.  |
| Database    | PostgreSQL, MongoDB      | Complexité inutile ou mauvais fit relationnel.     |
| Auth/Stockage| Auth0, AWS S3, Clerk    | Intégration plus complexe, fonctionnalités superflues.|

---

> 💡 **Ces choix techniques priorisent facilité d'utilisation, maintenabilité et évolutivité, alignés avec les objectifs du projet.**
