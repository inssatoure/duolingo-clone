# WoLingo — Feuille de route (refonte UX & backend)

Backlog exécutable par les agents définis dans `.claude/agents/`. Chaque chantier (WS)
est isolé, avec agent assigné, fichiers exacts et critères de vérification.
Vérifications communes à tous : `npx tsc --noEmit && pnpm run lint && env -u DATABASE_URL -u STRIPE_API_SECRET_KEY pnpm run build`.

## Séquencement

```
WS-A ────┬────────────→ WS-K → WS-L
WS-B, WS-C, WS-E  (parallèles, jour 1)
WS-D ────┬→ WS-M
         ├→ WS-K
         └→ WS-I
WS-F ────┬→ WS-I
         └→ WS-J (dispatcher → types en parallèle)
WS-G, WS-H  (parallèles, n'importe quand)
```

Règles : atomicité (A) avant gamification (K/L) ; index (D) avant cache (M) ; audio (F) avant offline (I) et nouveaux exercices (J).

---

## Phase 0 — Correction & Sécurité

### WS-A · Mises à jour atomiques & anti-farming — agent: (sonnet, session principale) — [ ]
Fichiers : `actions/challenge-progress.ts`, `actions/user-progress.ts`, `actions/streaks.ts`.
- Incréments SQL atomiques (`sql`${t.points} + 10``, clamp `GREATEST/LEAST`) au lieu de read-modify-write.
- Streak = UPDATE conditionnel unique (et noter le problème de fuseau horaire serveur).
- Plafond quotidien sur les récompenses de replay d'une leçon déjà complétée (+1 cœur/+10 pts actuellement infinis).
- Caveat : driver neon-http, pas de transactions interactives fiables.
- ✅ Vérif : plus aucun motif `points: currentUserProgress.points +` dans actions/.

### WS-B · Bugs boutique — agent: bug-fixer — [ ]
Fichiers : `actions/purchase-item.ts`, `app/(main)/shop/items.tsx`.
- Filtre `userId` manquant sur la vérification de possession (un achat marque l'objet possédé pour TOUS).
- Incrément atomique de `cfaBalance` pour currency_boost (recalcul depuis lecture périmée aujourd'hui).
- Remplacer l'ID magique `purchaseShopItem(4)` par une constante/lookup par clé ; centraliser les prix CFA.

### WS-C · Durcissement sécurité — agent: security-hardener — [ ]
Fichiers : `lib/admin.ts`, `lib/admin-list.ts`, `app/api/{courses,units,lessons,challenges,challengeOptions}*`, `app/api/seed`, `app/api/import`, `app/api/webhooks/stripe`, `proxy.ts`.
- Supprimer le backdoor `DEFAULT_ADMIN_EMAILS` (env uniquement, fail closed).
- Whitelister les champs (fin du `...body` mass-assignment) sur toutes les routes admin.
- `/api/seed` : exiger `{confirm:"WIPE"}`. `/api/import` : valider tout avant d'insérer.
- Webhook Stripe : réponse d'erreur générique ; gérer `customer.subscription.deleted`/`updated`.
- Borner la taille de page d'admin-list ; protéger `/admin(.*)` dans `proxy.ts`.
- ✅ Vérif : grep `apsfdsn` → rien ; grep `...body` dans app/api → rien.

### WS-D · Schéma, index & migrations — agent: schema-migrator — [ ]
Fichiers : `db/schema.ts`, `drizzle/`, `lib/recordings.ts`, `db/queries.ts`.
- Index sur toutes les FK ; unique `(userId, challengeId)` sur challenge_progress ; `points DESC` ; participation ligue `(leagueId, semaine)`.
- `user_progress.activeCourseId` : cascade → `set null` (+ gestion du null dans queries).
- Intégrer la table `recordings` dans le schéma (fin du CREATE TABLE runtime).
- `FREE_MODE` piloté par env (`db/queries.ts` ~l.213).
- Générer la migration (`drizzle-kit generate`) ; l'application (`push`/`migrate`) se fait au déploiement.

### WS-E · Sûreté du seeding — agent: bug-fixer — [ ]
Fichiers : `lib/seed-courses.ts`, `scripts/prod.ts`.
- Alignement challenges↔options par clé, pas par ordre de `.returning()`.
- `scripts/prod.ts` : suppressions séquentielles en ordre FK, jamais les utilisateurs, flag `--force` obligatoire.

## Phase 1 — Fondations UX

### WS-F · Unification audio & audio-first — agent: audio-refactorer — [ ]
Fichiers : `lib/audio-client.ts`, `app/(main)/dictionary/dictionary-list.tsx`, `app/lesson/{card,quiz}.tsx`, `app/api/recordings/play/route.ts`.
- API unique exportée par audio-client partout (le dictionnaire utilise `new Audio()` brut).
- Préserver la décision synchrone-dans-le-geste (iOS) et « wolof jamais en synthèse navigateur ».
- État visible « audio indisponible » ; composant gros bouton haut-parleur réutilisable.
- `Cache-Control`/ETag sur recordings/play (préparation offline).
- ✅ Vérif : `new Audio(` uniquement dans audio-client.

### WS-G · Nettoyage i18n — agent: a11y-i18n — [ ]
Fichiers : `lib/i18n.ts`, `lib/use-locale.ts`, `app/(main)/leagues/social-tabs.tsx`, `app/(main)/dictionary/dictionary-list.tsx`, `components/install-prompt.tsx`, `app/(main)/courses/list.tsx`.
- Corriger le flash d'hydratation (snapshot serveur « fr » figé).
- Migrer toutes les chaînes codées en dur vers DICT ; compléter les clés wo (TODO traduction acceptable).

### WS-H · A11y, error boundaries, code mort — agent: a11y-i18n — [ ]
- `div onClick` → `<button>` + aria + focus (lesson card, cartes cours, boutique) ; aria-labels sur boutons-emoji.
- Focus trap onboarding via Radix Dialog ; `error.tsx` pour (main)/lesson/admin ; `loading.tsx` dictionary ; état vide leaderboard.
- Supprimer les stubs `quests/page.tsx` et `leaderboard/page.tsx` (redirections dans `next.config.ts`).

### WS-I · Offline / PWA — agent: offline-pwa — [ ] (après WS-D + WS-F)
- Serwist (ou SW statique si conflit Turbopack) : precache shell, SWR pages, cache-first audio.
- Bouton « télécharger cette unité » ; file IndexedDB des résultats avec clé d'idempotence (contrainte unique WS-D) ; bannière hors-ligne.
- ✅ Vérif : test mode avion documenté ; un résultat en file rejoué une seule fois.

## Phase 2 — Fonctionnalités

### WS-J · Nouveaux types d'exercices — dispatcher (sonnet) puis agent: exercise-builder — [ ]
Fichiers : `db/schema.ts` (enum), `app/lesson/{quiz,challenge}.tsx`, nouveaux `challenge-listen/match/order.tsx`, `actions/challenge-progress.ts`, formulaires admin, seed d'exemple.
- Étape 1 (sonnet) : enum + dispatcher + **LISTEN_SELECT** (consigne audio seule, réponses images) comme référence.
- Étape 2 (haiku, par type) : **MATCH_PAIRS** (audio↔image), **ORDER_WORDS**, TYPE (optionnel).
- Chaque consigne écoutable sans lire ; gros boutons ; feedback existant réutilisé.

### WS-K · Réparer les ligues — agent: gamification — [ ] (après WS-A + WS-D)
- Écrire `xpEarned` atomiquement (upsert ON CONFLICT) à chaque gain de points ; créer la participation à la 1ʳᵉ activité de la semaine.
- Remplacer les boucles N+1 de `calculateWeeklyLeagueUpdate` ; cron hebdo `app/api/cron/leagues` + `vercel.json`, protégé par `CRON_SECRET`.

### WS-L · Rétention — agent: gamification (haiku ok) — [ ] (après WS-K)
- Quêtes quotidiennes sur vrais compteurs ; gel de streak branché boutique ; célébrations (confetti + audio réutilisés).

### WS-M · Cache des requêtes — agent: a11y-i18n — [ ] (strictement après WS-D)
- `unstable_cache` + `revalidateTag("content")` sur le contenu des cours dans `db/queries.ts`, invalidé par les écritures admin.
