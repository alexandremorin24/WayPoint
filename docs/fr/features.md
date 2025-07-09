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

### 8. Sélection du jeu (via API externe)
- Lors de la création d'une map, l’utilisateur doit sélectionner le jeu associé.
- Les données proviennent de l’**API IGDB** (via Twitch).
- La liste des jeux est **recherchable en autocomplete** et contient :
  - Le nom officiel du jeu
  - L’image de couverture
  - Le slug (utilisé pour les URLs publiques)
- Les maps pourront ensuite être **groupées ou filtrées par jeu**.

> Remarque : cela permettra de créer plus tard des pages publiques de type `/game/:slug`.
### 9. Système d'authentification sécurisé

- Les utilisateurs peuvent s’inscrire et se connecter via :
  - **Google OAuth2** (via le fournisseur officiel)
  - **Email + mot de passe** (création de compte classique)
- Lors de l’inscription par email, un lien de confirmation sécurisé est envoyé (via Mailtrap pour le développement) pour valider l’adresse.
- Le système garantit :
  - Un stockage sécurisé des mots de passe (hachés + salés)
  - Unicité des adresses email
  - Une procédure simple de récupération de mot de passe (à venir post-MVP)
- L’authentification est **entièrement gérée sans Firebase**.
- Tous les utilisateurs sont identifiés via des **UUIDs** pour plus de sécurité et de flexibilité.

---

## 🚀 Roadmap (Post-MVP)

### 🛡️ Gestion avancée des accès et des rôles
- Rôles personnalisés (Admin, Éditeur, Lecteur)
- Transfert de propriété entre utilisateurs
- Gestion granulaire des permissions

### 💬 Améliorations de la collaboration
- **Mode de collaboration par proposition**
  - Modifications proposées par les éditeurs, validées ou refusées par les admins
  - Historique des propositions intégré
  - Acceptation partielle des modifications proposées
- **Chat en temps réel**
  - Système de chat intégré par carte
  - Accessible uniquement aux utilisateurs ayant des droits d’édition
  - Messagerie instantanée pour faciliter la collaboration et la prise de décision

### 📈 Expérience publique et utilisateur améliorée
- Exploration publique avancée des cartes (filtres par jeu, tags, mise en avant manuelle par les admins)
- **Commentaires utilisateurs**
  - Permet aux visiteurs de commenter ou de suggérer des améliorations sur une carte ou un POI
- **Cartes favorites**
  - Les utilisateurs peuvent enregistrer et gérer facilement leurs cartes préférées

### 🔔 Notifications & engagement
- **Notifications push PWA**
  - Alertes en temps réel sur les modifications importantes ou les événements de collaboration

### 📜 Historique détaillé des activités & gestion des modifications
- Historique visuel des actions et timeline interactive
- Restauration des versions précédentes de cartes ou de POI

### ✅ Suivi d’accomplissement des POI (Checklists)
- Les utilisateurs peuvent marquer un POI comme complété (ex : trouvé, terminé, collecté)
- Système de checklist optionnel par carte ou par type de POI (ex : “Trouvé”, “Vaincu”, “Ouvert”)
- Statut visible directement sur la carte (icône ou surcouche colorée)
- Possibilité de filtrer ou visualiser les POI complétés par utilisateur ou par catégorie


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
