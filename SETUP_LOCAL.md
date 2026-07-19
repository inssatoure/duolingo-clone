# Setup Local pour Test

## 1. Créer le fichier .env

Créez un fichier `.env` à la racine du projet (ce fichier n'est pas versionné par git):

```bash
cp .env.example .env
```

## 2. Configurer les variables d'environnement

Éditez le fichier `.env` et remplacez les valeurs:

### Base de données Neon
- Créez un compte gratuit sur https://neon.tech
- Créez un nouveau projet PostgreSQL
- Copiez la connection string et remplacez `DATABASE_URL`

### Clerk Auth
- Créez un compte sur https://clerk.com
- Créez une nouvelle application
- Copiez les clés et remplacez:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`

### Stripe (optionnel pour le test)
- Si vous voulez tester les paiements, configurez les clés Stripe
- Sinon, vous pouvez laisser les valeurs par défaut pour le moment

## 3. Installer les dépendances

Note: Les dépendances sont déjà installées via `pnpm install` lors du build précédent.

## 4. Lancer le dev server

```bash
pnpm dev
```

L'application sera disponible sur http://localhost:3000

## 5. Seed la base de données (optionnel)

Pour peupler la base de données avec le contenu Wolof de démonstration:

```bash
tsx scripts/prod.ts
```

Cela va:
- Créer les 4 leagues (Diamond, Gold, Silver, Bronze)
- Créer les items du shop (Streak Freeze, Bonus XP, Hearts Refill, CFA Boost)
- Créer le cours Wolof avec l'unité de démonstration (salutations, nombres, famille, couleurs, phrases)

## 6. Tester les nouvelles fonctionnalités

Une fois connecté via Clerk:
- **Streaks**: Complétez des leçons pour voir votre série augmenter
- **Leagues**: Allez sur /leagues pour voir votre ligue hebdomadaire
- **Shop**: Allez sur /shop pour acheter des items avec des CFA
- **CFA**: Gagnez des CFA en complétant des leçons (à implémenter dans la logique de récompenses)
