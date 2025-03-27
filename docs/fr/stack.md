# 🚀 Stack Technique – WayPoint Map Builder

Le projet WayPoint Map Builder utilise des technologies web modernes, soigneusement choisies pour assurer évolutivité, facilité d’utilisation et maintenabilité. Ci-dessous, le détail complet des choix techniques ainsi que les alternatives envisagées.

---

## 🌐 Langages & Technologies Principales

| Technologie       | Rôle                  | Pourquoi ?                                                            |
|-------------------|-----------------------|-----------------------------------------------------------------------|
| **JavaScript**    | Frontend & Backend    | Langage unifié pour frontend (React) et backend (Node.js).            |
| **SQL (MySQL)**   | Base de données       | Base relationnelle structurée idéale pour maps, utilisateurs, POIs.   |
| **HTML/CSS**      | Structure & Style     | Géré via composants React avec TailwindCSS pour un style rapide.      |

---

## ⚙️ Frameworks & Bibliothèques

| Outil               | Catégorie           | Raisons du choix                                           |
|---------------------|---------------------|------------------------------------------------------------|
| **React.js**        | Frontend            | Dynamique, modulaire, écosystème étendu, idéal pour PWA.   |
| **Vite**            | Serveur de dev      | Rapide et efficace, remplace avantageusement CRA.          |
| **TailwindCSS**     | UI/UX               | Framework de style rapide et simple à maintenir.           |
| **Leaflet.js**      | Cartes interactives | Léger, open-source, adapté aux cartes avec images perso.   |
| **Express.js**      | Backend             | Minimaliste, flexible, construction simple d’API REST.     |
| **Socket.io**       | Temps réel          | Collaboration temps réel (prévu post-MVP).                 |
| **Firebase Auth**   | Authentification    | Intégration Google rapide, simple et sécurisée.            |
| **Firebase Storage**| Stockage fichiers   | Stockage simplifié des images maps et POI.                 |
| **Axios**           | Requêtes API        | Communication HTTP frontend-backend simplifiée.            |

---

## ☁️ Hébergement & Déploiement

| Plateforme  | Rôle                 | Pourquoi choisie ?                                                      |
|-------------|----------------------|-------------------------------------------------------------------------|
| **Railway** | Backend & Database   | Hébergement simple API Express et MySQL, facile à configurer.           |
| **Vercel**  | Frontend             | Déploiement rapide, optimal pour React/Vite, support natif PWA.         |
| **Firebase**| Auth & Stockage      | Authentification sécurisée et stockage simplifié.                       |

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

## ⚡ Gestion d'état
- **Zustand**
  - Solution légère et performante de gestion d'état global pour React.
  - Très rapide à apprendre et intégrer.
  - [Documentation officielle Zustand](https://github.com/pmndrs/zustand)

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
  - Génération automatique de miniatures via Firebase Storage.

### 🔄 Optimisation collaboration temps réel (Socket.io)
- **Gestion efficace des connexions**
  - Gestion robuste des connexions WebSocket avec mécanismes de secours.
- **Optimisation des notifications**
  - Notifications groupées pour optimiser l'expérience utilisateur en temps réel.

---

## 🔄 Alternatives Envisagées

| Composant   | Alternatives             | Raisons du rejet                                   |
|-------------|--------------------------|----------------------------------------------------|
| Frontend    | Vue.js, Svelte, Next.js  | Moins adapté pour l’écosystème temps réel/cartes.  |
| Cartes      | Mapbox, Google Maps      | Complexité licence ou coût élevé.                  |
| Backend     | Fastify, NestJS, Django  | Trop lourd pour l’échelle projet ou stack non-JS.  |
| Database    | PostgreSQL, MongoDB      | Complexité inutile ou mauvais fit relationnel.     |
| Auth/Stockage| Auth0, AWS S3, Clerk    | Intégration plus complexe, fonctionnalités superflues.|

---

> 💡 **Ces choix techniques priorisent facilité d'utilisation, maintenabilité et évolutivité, alignés avec les objectifs du projet.**
