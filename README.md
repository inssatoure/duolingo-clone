# WoLingo 🇸🇳

**Apprendre l'anglais et le français, dans sa langue.**

WoLingo est une application mobile façon Duolingo qui enseigne le **wolof**
depuis le français ou l'anglais — et le **français**/**anglais** depuis le
wolof. Conçue en priorité pour les enfants et les personnes peu ou pas
lettrées au Sénégal, avec une approche **audio-first** : chaque mot, chaque
question, chaque bouton peut être écouté en un tap, pour que savoir lire ne
soit jamais un prérequis pour apprendre.

🔗 **[wolingo.vercel.app](https://wolingo.vercel.app)**

Créé par **[Issa Touré](https://www.issatoure.com)** · [LinkedIn](https://sn.linkedin.com/in/01issatoure) · [Instagram](https://www.instagram.com/inssa_tourei)

---

## 🌍 Langues

| Langue de départ | Langue apprise |
|---|---|
| 🇫🇷 Français | 🇸🇳 Wolof |
| 🇬🇧 Anglais | 🇸🇳 Wolof |
| 🇸🇳 Wolof | 🇫🇷 Français |
| 🇸🇳 Wolof | 🇬🇧 Anglais |

L'interface elle-même est disponible en français, anglais et wolof.

## ✨ Fonctionnalités

- **Leçons interactives** — exercices à choix multiples avec audio natif/généré, cœurs, points, séries (streaks)
- **Audio partout** — bouton haut-parleur sur chaque mot, chaque question, chaque écran ; génération vocale automatique pour le wolof (aucune voix wolof n'existant nativement dans les navigateurs)
- **Inscription ultra-simple** — connexion par numéro de téléphone + code à 4 chiffres (ou Google), vérification par WhatsApp/SMS, sans mot de passe complexe ni email
- **Gamification** — ligues hebdomadaires, quêtes quotidiennes, boutique, système de cœurs/vies
- **Dictionnaire** intégré, cherchable et écoutable
- **Back-office admin** complet pour gérer cours, unités, leçons et contenu audio
- **PWA** installable, pensée pour des connexions instables

## 🏗️ Stack technique

Next.js 16 (App Router) · TypeScript · Tailwind CSS · Drizzle ORM + Neon (Postgres) · Clerk (identité) · Twilio (OTP WhatsApp/SMS) · Stripe · Google Cloud TTS + Gemini (audio wolof) · react-admin · déployé sur Vercel.

📖 Pour toute contribution technique (agents IA inclus), voir **[AGENTS.md](./AGENTS.md)** — ça documente l'architecture d'authentification, le système audio et les pièges déjà rencontrés, pour éviter de reproduire les mêmes bugs.
🗺️ Chantiers produit en cours : **[docs/ROADMAP.md](./docs/ROADMAP.md)**

## 🚀 Démarrer en local

Voir [SETUP_LOCAL.md](./SETUP_LOCAL.md) pour les variables d'environnement et les étapes d'installation.

```bash
pnpm install
pnpm run dev
```

## 📄 Licence

MIT — voir [LICENSE](./LICENSE).
