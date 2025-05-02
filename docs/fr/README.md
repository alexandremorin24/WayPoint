## 🗄 Initialisation de la base de données

Pour initialiser la base MySQL (création de toutes les tables et index), lance le script suivant depuis la racine du projet :

```bash
chmod +x backend/scripts/init-db.sh
./backend/scripts/init-db.sh
```

- Ce script est idempotent : tu peux le relancer autant de fois que tu veux sans erreur.
- Il crée toutes les tables et index, et fonctionne aussi bien pour une nouvelle installation que pour un fork.
- Tu peux configurer le nom de la base et l'utilisateur en haut du script si besoin. 
