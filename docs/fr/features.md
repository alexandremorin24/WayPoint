# 🛠 Fonctionnalités – WayPoint Map Builder

WayPoint Map Builder est conçu avec une distinction claire entre les fonctionnalités du **Minimum Viable Product (MVP)** et les améliorations futures prévues dans la roadmap post-MVP.

---

## 🚩 Fonctionnalités MVP

### 1. Téléchargement de cartes personnalisées
- Les utilisateurs peuvent télécharger des images personnalisées comme fonds de carte.

### 2. Points d'intérêt (POI)
- Création de POI avec :
  - Coordonnées (X/Y)
  - Nom, description
  - Icône optionnelle (personnalisée ou prédéfinie)
  - Image attachée optionnelle

### 3. Catégorisation hiérarchique
- Organisation des POI par :
  - Catégories
  - Sous-catégories

### 4. Gestion collaborative des accès
- Les créateurs de carte peuvent :
  - Inviter des utilisateurs par email
  - Retirer les accès à tout moment
- Les collaborateurs invités peuvent :
  - Ajouter/modifier des POI
  - Créer/modifier des catégories et sous-catégories
- Utilisateurs non invités :
  - Visualisent les cartes publiques
  - Ne peuvent pas modifier les contenus

### 5. Collaboration en temps réel (Mode Live)
- Édition simultanée des cartes par les collaborateurs
- Changements enregistrés immédiatement
- Toutes les actions sont journalisées en base de données

### 6. Partage public et exploration
- Les cartes peuvent être partagées publiquement via une URL dédiée
- Mode lecture seule pour les visiteurs publics
- Page d'accueil publique avec :
  - Cartes publiques récentes
  - Cartes populaires ou bien notées

### 7. Logs techniques et historique
- Chaque action sur un POI (création/modification) est journalisée avec détails :
  - Utilisateur, horodatage, type d'action et données associées
- Statistiques agrégées de l'activité utilisateur (création/mise à jour POI)

---

## 🚀 Roadmap (Post-MVP)

### 1. Gestion avancée des accès et des rôles
- Rôles personnalisés (Admin, Éditeur, Lecteur)
- Transfert de propriété
- Gestion avancée des permissions

### 2. Collaboration en Mode Proposition
- Modifications proposées et non directement appliquées
- Validation ou rejet par l'administrateur
- Historique intégré des propositions

### 3. Exploration publique avancée
- Filtrage par type de jeux ou tags
- Cartes mises en avant manuellement par les administrateurs

### 4. Historique détaillé des activités
- Historique visuel des actions
- Chronologie interactive avec filtres
- Restauration à une version antérieure

### 5. Interface de collaboration améliorée
- Interface conviviale de suivi des modifications et propositions
- Acceptation partielle des modifications proposées

---

## 📌 Comparatif des modes de collaboration

| Fonctionnalité                  | Mode Live (MVP) | Mode Proposition (Post-MVP) |
|---------------------------------|-----------------|-----------------------------|
| Modification d'une carte        | ✅ Direct       | ✅ Après validation         |
| Synchronisation                 | ✅ Immédiate    | ✅ Immédiate                |
| Historique technique            | ✅ Logs simples | ✅ Logs enrichis            |
| Interface de suivi              | ❌              | ✅ Prévue                   |
| Propositions de changements     | ❌              | ✅ Disponible               |
| Rôles personnalisés             | ❌              | ✅ Disponible               |
| Acceptation partielle des modifs| ❌              | ✅ Disponible               |

---

> **Prochaines étapes :**
> - Valider ces fonctionnalités MVP avec des retours utilisateurs
> - Prioriser les fonctionnalités de la roadmap selon les besoins réels des utilisateurs et l'évolution du projet
