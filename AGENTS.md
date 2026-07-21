# AGENTS.md — Guide pour tout agent IA travaillant sur WoLingo

Ce fichier s'adresse à **n'importe quel outil IA** (Claude Code, Cursor, Copilot,
autre) qui reprend ce projet. Il documente les décisions d'architecture non
évidentes, les pièges déjà rencontrés, et comment ne pas refaire les mêmes
erreurs. **Lis-le en entier avant de toucher à l'authentification, l'audio, ou
la base de données.**

## C'est quoi WoLingo

App d'apprentissage du wolof façon Duolingo (français/anglais ↔ wolof), pour un
public sénégalais incluant enfants et personnes peu/pas lettrées. Stack :
Next.js 16 (App Router, Turbopack), Drizzle ORM + Neon Postgres, Clerk (auth
détournée, voir plus bas), Twilio (OTP), Stripe, déployé sur Vercel.

**Priorité produit absolue : simplicité et audio.** Toute fonctionnalité
utilisateur doit être utilisable sans savoir lire, et tout texte affiché
doit pouvoir être écouté.

## Workflow git (obligatoire)

Développer sur `claude/wolof-learning-app-1x9gw3`, puis :
```
git add -A && git commit -m "..."
git push -u origin claude/wolof-learning-app-1x9gw3
git checkout main && git merge --no-edit claude/wolof-learning-app-1x9gw3
git push origin main && git checkout claude/wolof-learning-app-1x9gw3
```
`main` est ce que Vercel déploie en production. **Avant chaque commit** :
```
npx tsc --noEmit && pnpm run lint && env -u DATABASE_URL -u STRIPE_API_SECRET_KEY pnpm run build
```
Le `env -u ...` est volontaire : ça vérifie que le build ne casse pas sur un
déploiement Preview qui n'aurait pas ces variables (voir pattern Proxy plus bas).

---

## 1. Authentification — architecture non standard, à bien comprendre

### Pourquoi ce n'est PAS du Clerk classique

Clerk (plan gratuit/dev instance) impose un **minimum de 8 caractères** sur le
mot de passe, non configurable en dessous. Le produit veut un **PIN à 4
chiffres** pour les enfants. Solution : **Clerk est utilisé uniquement comme
annuaire d'identité (username + session), jamais pour le mot de passe.**

- Les comptes sont créés via `client.users.createUser({ skipPasswordRequirement: true, ... })` (SDK backend Clerk) — **aucun mot de passe Clerk n'existe jamais**.
- Le PIN est haché (scrypt, `lib/pin.ts`) et stocké dans **notre propre table** `user_pins` (PAS dans Clerk).
- La connexion se fait via nos routes (`/api/auth/pin-login`, `/api/auth/register`, `/api/auth/reset-pin`) qui vérifient le PIN nous-mêmes, puis émettent un **sign-in token Clerk** (`client.signInTokens.createSignInToken`), que le client échange via `signIn.create({ strategy: "ticket", ticket })`.
- **Ne jamais** réintroduire `signIn.create({ identifier, password })` ou `signUp.create({ password })` — ça retombe directement sur le mur des 8 caractères.

### Piège Clerk découvert en prod : instance Development + numéros sénégalais rejetés

L'instance Clerk actuelle est en mode **Development** (clés `pk_test_`/`sk_test_`)
et son réglage exige un `phone_number` ET un `email_address`/OAuth à la
création de compte — **mais Clerk refuse purement et simplement les numéros
sénégalais** (`"unsupported_country_code"`). Contournement en place dans
`app/api/auth/register/route.ts` : génération d'un téléphone factice (plage
NANPA 555-01XX, réservée à la fiction, jamais un vrai numéro) et d'un email
factice sur notre propre domaine (`@wolingo.vercel.app`, jamais un domaine
tiers). **Ne pas supprimer ce contournement** sans d'abord vérifier dans le
Clerk Dashboard (User & Authentication → Email, Phone, Username) que "Phone"
n'est plus required — et idéalement passer l'instance en **Production** (clés
`pk_live_`/`sk_live_`) avant un vrai lancement, ce qui n'a jamais été fait.

### Piège découvert : Google OAuth cassé silencieusement

`signUp.authenticateWithRedirect(...)` échouait avec une erreur générique.
Cause réelle : la liste `redirect_urls` de Clerk (endpoint `GET
https://api.clerk.com/v1/redirect_urls`, à interroger avec `CLERK_SECRET_KEY`)
était **vide**. Il faut y enregistrer explicitement (`POST` sur ce même
endpoint) chaque URL de callback OAuth utilisée
(`https://<domaine>/sign-up/sso-callback`, `.../sign-in/sso-callback`). Si tu
changes de domaine (nouveau déploiement Vercel, domaine custom), **il faut
refaire cet enregistrement**, sinon Google recasse.

### Diagnostiquer un problème Clerk sans le Dashboard

Utile si l'agent n'a pas accès au navigateur/Dashboard : l'API Frontend
publique de Clerk expose la config complète sans authentification.
```
# Extraire l'host depuis la clé publique (visible dans le HTML des pages /sign-in, /sign-up) :
echo "<partie après pk_test_>" | base64 -d   # → xxx.clerk.accounts.dev

curl -sS "https://<host>/v1/environment" | python3 -m json.tool
# → user_settings.attributes.phone_number.required, .social.oauth_google.enabled, etc.
```

### Twilio OTP — WhatsApp d'abord, SMS en repli

`lib/twilio.ts` : `sendOtp()` essaie WhatsApp (≈0,008$/message) puis bascule
sur SMS (≈0,55$/message vers le Sénégal — bien plus cher, d'où la préférence
WhatsApp) en cas d'échec. OTP envoyé **uniquement** à l'inscription et à la
réinitialisation de PIN — **jamais** à la connexion normale (PIN seul
suffit). Le code fait 4 chiffres (`lib/phone.ts`, `OTP_LENGTH`) — **doit
correspondre exactement** au réglage "Code length" du Verify Service dans la
console Twilio, sinon les codes envoyés ne matchent jamais ce que le client
attend.

Le nom affiché dans le message ("Votre code XXX est...") vient du **Friendly
Name du Verify Service** — s'il est renommé, Twilio demande une attestation
(case à cocher) confirmant qu'on a le droit d'utiliser ce nom.

---

## 2. Audio — système central du produit, plusieurs pièges non évidents

### Le silence Wolof n'est (presque) jamais un bug de code

Si un mot Wolof reste muet, vérifie DANS CET ORDRE avant de toucher au code :
1. `curl` direct sur `/api/recordings/play?text=<mot>&lang=wo` renvoie-t-il 200 avec de l'audio ? Si oui, le backend fonctionne — le problème est côté client/navigateur (voir points suivants).
2. Le mot est-il dans `seeds/dictionary.json` (champ `wolof`) ? Sinon `isWolofText()` ne le reconnaît pas et il ne prendra JAMAIS l'appel `/api/recordings/play` (voir `lib/wolof-words.ts`).

La génération audio Wolof est **automatique à la demande** (Gemini,
`lib/gemini-tts.ts`) au premier accès à un mot, mise en cache en base
(`recordings` table) pour toujours ensuite. Ce n'est plus un processus manuel
admin — mais l'ancien outil `/admin/tts` existe toujours pour la génération
en masse si besoin.

### Piège #1 (le pire, à retenir) : Safari mobile exige le support HTTP Range

`curl` et Chrome desktop sont **tolérants** : un simple `200` avec le fichier
entier suffit. **Safari iOS refuse de jouer un `<audio>` si le serveur ne
répond pas correctement aux requêtes `Range`** (il envoie un `Range:
bytes=0-1` en sondage avant de jouer, et abandonne silencieusement si la
réponse n'est pas un `206 Partial Content` avec `Accept-Ranges`/`Content-Range`).
C'est implémenté dans `app/api/recordings/play/route.ts` (`audioResponse()`).
**Si un futur agent réécrit cette route, il DOIT conserver ce support Range**,
sinon le symptôme réapparaît : audio qui marche "sur le web" mais reste muet
"sur mobile" — un rapport utilisateur qu'on a eu plusieurs fois avant de
trouver la vraie cause.

### Piège #2 : URL de préchargement ≠ URL de lecture = cache HTTP inutile

`lib/audio-client.ts` précharge l'audio Wolof dès l'ouverture d'un exercice
(`prefetchWolof`) pour éviter le délai de génération au moment du tap. **Ce
préchargement ne sert à RIEN si l'URL utilisée diffère, même légèrement (ex.
paramètre `lang=wo` présent dans un cas, absent dans l'autre) de l'URL
utilisée à la lecture réelle** — le navigateur les traite comme deux
ressources différentes et retélécharge tout au clic. Toute construction d'URL
vers `/api/recordings/play` doit passer par la fonction unique `recordingUrl()`
dans `lib/audio-client.ts`. Le `Cache-Control` de cette route est
`immutable, max-age=31536000` (le contenu d'un mot donné ne change jamais) —
ne pas le raccourcir sans raison, ça annule l'intérêt du préchargement.

### Piège #3 : chevauchement audio

Toujours appeler `stopAllAudio()` (interne à `lib/audio-client.ts`, déclenché
automatiquement par `speakSmart`/`playText`) avant de démarrer un nouveau son
— sinon taper vite plusieurs options fait se superposer plusieurs voix.

### Règle iOS sur `speechSynthesis` (différent du cas `<audio>` ci-dessus)

`speechSynthesis.speak()` (utilisé pour le français/anglais, PAS pour le
wolof) doit être appelé **de façon synchrone, dans la pile d'appel du clic**.
L'appeler après un `await`/`.then()`/callback async est silencieusement
ignoré sur iOS (desktop est tolérant). C'est pour ça que `lib/audio-client.ts`
précharge `recordedKeys` une fois au chargement de page, pour décider
*synchronement* recording-vs-synthèse au moment du clic.

### Ne jamais utiliser `new Audio()` en dehors de `lib/audio-client.ts`

Toute lecture audio doit passer par `speakSmart()` (ou `Speakable`/
`SpeakableText`, composants réutilisables avec bouton haut-parleur). Un
`new Audio(src)` direct ailleurs dans le code (ex. `dictionary-list.tsx`
avant correctif) contourne tout ce système et réintroduit les mêmes bugs.

---

## 3. Base de données — pièges de migration

- `drizzle-kit migrate` a **planté silencieusement** en production (tourne
  indéfiniment, jamais de message final) probablement à cause d'un
  désalignement entre la table de suivi des migrations et l'état réel du
  schéma (une ancienne migration avait été appliquée via `push` plutôt que
  `migrate`, désynchronisant `drizzle.__drizzle_migrations`). **Si `migrate`
  ne se termine pas proprement, vérifier l'état réel des tables/colonnes en
  base directement plutôt que de faire confiance à la sortie de la commande**,
  et envisager d'exécuter le SQL de la migration manuellement (le fichier
  `.sql` dans `drizzle/` est lisible et rejouable à la main).
- `DATABASE_URL` n'est pas dans l'environnement de dev par défaut — un agent
  qui doit exécuter une migration doit le demander au propriétaire du projet
  (valeur dans Vercel → Settings → Environment Variables → `DATABASE_URL`).

---

## 4. Variables d'environnement nécessaires

Toutes à configurer dans Vercel (Production **et** Preview) :

| Variable | Usage |
|---|---|
| `DATABASE_URL` | Neon Postgres |
| `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Auth (voir section 1 — actuellement clés `test`, pas `live`) |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` | OTP WhatsApp/SMS |
| `GEMINI_API_KEY` | Génération audio Wolof à la demande |
| `GOOGLE_TTS_API_KEY` | Audio fr/en (Cloud TTS) — clé différente de `GEMINI_API_KEY`, Google n'autorise pas une clé restreinte aux deux APIs à la fois |
| `STRIPE_API_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Abonnement (actuellement `FREE_MODE` actif, voir `db/queries.ts`) |
| `CLERK_ADMIN_IDS` / `CLERK_ADMIN_EMAILS` | Accès `/admin` (fail-closed si absent — voir `lib/admin.ts`) |
| `RESEND_API_KEY` | Email de bienvenue (webhook Clerk) |

**Sécurité : ne jamais committer une clé API dans le repo.** Si l'utilisateur
colle une clé en clair dans le chat, la configurer uniquement en variable
d'environnement Vercel, jamais dans le code ni dans un commit.

---

## 5. Autres pièges déjà rencontrés (courts, pour référence)

- **`FREE_MODE`** est actuellement forcé à `true` dans `db/queries.ts`
  (piloté par `NEXT_PUBLIC_FREE_MODE`) — les cœurs/limites Stripe sont
  désactivés partout tant que ce n'est pas explicitement mis à `false`.
- **`user_pins.userId` n'a pas de clé étrangère** vers `user_progress` — c'est
  volontaire, cette ligne est créée à l'inscription, avant que `user_progress`
  n'existe (créé plus tard, à la première visite de `/learn`).
- Ne jamais reconstruire un flux d'auth téléphone avec Clerk sans relire la
  section 1 en entier — l'historique de cette codebase contient plusieurs
  tentatives abandonnées (vérification téléphone native Clerk, payante ;
  `signUp.create({password})`, bloqué à 8 caractères) avant d'arriver à la
  solution actuelle par ticket.
- La feuille de route produit (fonctionnalités restantes, bugs connus non
  encore traités) vit dans `docs/ROADMAP.md`.

---

## 6. Comment redémarrer une session utilement

1. Lire ce fichier en entier.
2. Lire `docs/ROADMAP.md` pour la liste des chantiers restants.
3. `npx tsc --noEmit && pnpm run lint` pour confirmer que l'état actuel est propre avant de commencer.
4. Ne jamais supposer qu'un problème signalé ("l'audio ne marche pas", "je ne reçois pas le code") est nouveau — relire les sections 1 et 2 ci-dessus, la cause est probablement déjà documentée.
