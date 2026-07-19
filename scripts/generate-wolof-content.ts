/**
 * Generates seeds/wolof-course.json from a structured Wolof vocabulary
 * dataset. Produces TWO courses that teach the same Wolof content:
 *   - "Wolof (depuis le français)"  -- prompts/questions in French
 *   - "Wolof (from English)"        -- prompts/questions in English
 *
 * Vocabulary is standard, well-attested Wolof written in the official
 * CLAD/standard orthography (ë, é, ñ, ŋ, à, x...). Confidence is tracked
 * per item ("core" = very common/certain, "review" = still standard Wolof
 * but worth a native-speaker double-check on spelling/register).
 *
 * Run with: npx tsx scripts/generate-wolof-content.ts
 */
import { writeFileSync } from "fs";
import { join } from "path";

type Category =
  | "greetings"
  | "family"
  | "numbers"
  | "food"
  | "colors"
  | "objects"
  | "verbs"
  | "days"
  | "body"
  | "animals"
  | "places"
  | "weather"
  | "clothing"
  | "pronouns"
  | "adjectives"
  | "phrases";

type Confidence = "core" | "review";

interface VocabItem {
  wolof: string;
  fr: string;
  en: string;
  category: Category;
  confidence: Confidence;
  imageSrc?: string | null;
}

// ---------------------------------------------------------------------------
// Vocabulary dataset — standard orthography, attested everyday Wolof
// ---------------------------------------------------------------------------
const VOCAB: VocabItem[] = [
  // Greetings & Basics
  { wolof: "Salaamaalekum", fr: "Bonjour (paix sur toi)", en: "Hello (peace be upon you)", category: "greetings", confidence: "core" },
  { wolof: "Maalekum salaam", fr: "Réponse à bonjour", en: "Reply to hello", category: "greetings", confidence: "core" },
  { wolof: "Na nga def?", fr: "Comment vas-tu ?", en: "How are you?", category: "greetings", confidence: "core" },
  { wolof: "Maa ngi fi rekk", fr: "Je vais bien (je suis là seulement)", en: "I'm fine (I'm just here)", category: "greetings", confidence: "core" },
  { wolof: "Jàmm rekk", fr: "La paix seulement (ça va)", en: "Peace only (all is well)", category: "greetings", confidence: "core" },
  { wolof: "Jërëjëf", fr: "Merci", en: "Thank you", category: "greetings", confidence: "core" },
  { wolof: "Ñoo ko bokk", fr: "De rien (on le partage)", en: "You're welcome (we share it)", category: "greetings", confidence: "core" },
  { wolof: "Baal ma", fr: "Excuse-moi / pardon", en: "Excuse me / sorry", category: "greetings", confidence: "core" },
  { wolof: "Waaw", fr: "Oui", en: "Yes", category: "greetings", confidence: "core" },
  { wolof: "Déedéet", fr: "Non", en: "No", category: "greetings", confidence: "core" },
  { wolof: "Ba beneen yoon", fr: "À la prochaine", en: "See you next time", category: "greetings", confidence: "core" },
  { wolof: "Ba suba", fr: "À demain", en: "See you tomorrow", category: "greetings", confidence: "core" },
  { wolof: "Naka nga tudd?", fr: "Comment tu t'appelles ?", en: "What's your name?", category: "greetings", confidence: "core" },
  { wolof: "Maa ngi tudd...", fr: "Je m'appelle...", en: "My name is...", category: "greetings", confidence: "core" },
  { wolof: "Fan nga dëkk?", fr: "Où habites-tu ?", en: "Where do you live?", category: "greetings", confidence: "core" },
  { wolof: "Ana waa kër gi?", fr: "Comment va la famille ?", en: "How is the family?", category: "greetings", confidence: "review" },
  { wolof: "Ñu ngi fi", fr: "Ils vont bien (ils sont là)", en: "They are fine (they are here)", category: "greetings", confidence: "core" },
  { wolof: "Mangi dem", fr: "J'y vais / au revoir", en: "I'm going / goodbye", category: "greetings", confidence: "core" },

  // Family
  { wolof: "Yaay", fr: "Maman / mère", en: "Mom / mother", category: "family", confidence: "core" },
  { wolof: "Baay", fr: "Papa / père", en: "Dad / father", category: "family", confidence: "core" },
  { wolof: "Ndey", fr: "Mère", en: "Mother", category: "family", confidence: "core" },
  { wolof: "Rakk", fr: "Petit frère / petite sœur", en: "Younger sibling", category: "family", confidence: "core" },
  { wolof: "Mag", fr: "Grand frère / grande sœur", en: "Older sibling", category: "family", confidence: "core" },
  { wolof: "Jigéen", fr: "Femme / fille", en: "Woman / girl", category: "family", confidence: "core" },
  { wolof: "Góor", fr: "Homme / garçon", en: "Man / boy", category: "family", confidence: "core" },
  { wolof: "Doom", fr: "Enfant (fils/fille de)", en: "Child (son/daughter)", category: "family", confidence: "core" },
  { wolof: "Xale", fr: "Enfant", en: "Child / kid", category: "family", confidence: "core" },
  { wolof: "Maam", fr: "Grand-parent", en: "Grandparent", category: "family", confidence: "core" },
  { wolof: "Sët", fr: "Petit-enfant", en: "Grandchild", category: "family", confidence: "review" },
  { wolof: "Nijaay", fr: "Oncle maternel", en: "Maternal uncle", category: "family", confidence: "core" },
  { wolof: "Bàjjan", fr: "Tante paternelle", en: "Paternal aunt", category: "family", confidence: "core" },
  { wolof: "Jëkkër", fr: "Mari", en: "Husband", category: "family", confidence: "core" },
  { wolof: "Jabar", fr: "Épouse", en: "Wife", category: "family", confidence: "core" },
  { wolof: "Kër", fr: "Maison / foyer", en: "Home / household", category: "family", confidence: "core" },
  { wolof: "Xarit", fr: "Ami(e)", en: "Friend", category: "family", confidence: "core" },
  { wolof: "Njaboot", fr: "Famille", en: "Family", category: "family", confidence: "core" },

  // Numbers
  { wolof: "Benn", fr: "Un", en: "One", category: "numbers", confidence: "core" },
  { wolof: "Ñaar", fr: "Deux", en: "Two", category: "numbers", confidence: "core" },
  { wolof: "Ñett", fr: "Trois", en: "Three", category: "numbers", confidence: "core" },
  { wolof: "Ñeent", fr: "Quatre", en: "Four", category: "numbers", confidence: "core" },
  { wolof: "Juróom", fr: "Cinq", en: "Five", category: "numbers", confidence: "core" },
  { wolof: "Juróom-benn", fr: "Six", en: "Six", category: "numbers", confidence: "core" },
  { wolof: "Juróom-ñaar", fr: "Sept", en: "Seven", category: "numbers", confidence: "core" },
  { wolof: "Juróom-ñett", fr: "Huit", en: "Eight", category: "numbers", confidence: "core" },
  { wolof: "Juróom-ñeent", fr: "Neuf", en: "Nine", category: "numbers", confidence: "core" },
  { wolof: "Fukk", fr: "Dix", en: "Ten", category: "numbers", confidence: "core" },
  { wolof: "Fukk ak benn", fr: "Onze", en: "Eleven", category: "numbers", confidence: "core" },
  { wolof: "Fukk ak ñaar", fr: "Douze", en: "Twelve", category: "numbers", confidence: "core" },
  { wolof: "Fukk ak juróom", fr: "Quinze", en: "Fifteen", category: "numbers", confidence: "core" },
  { wolof: "Ñaar-fukk", fr: "Vingt", en: "Twenty", category: "numbers", confidence: "core" },
  { wolof: "Fanweer", fr: "Trente", en: "Thirty", category: "numbers", confidence: "core" },
  { wolof: "Ñeent-fukk", fr: "Quarante", en: "Forty", category: "numbers", confidence: "core" },
  { wolof: "Juróom-fukk", fr: "Cinquante", en: "Fifty", category: "numbers", confidence: "core" },
  { wolof: "Téeméer", fr: "Cent", en: "One hundred", category: "numbers", confidence: "core" },
  { wolof: "Junni", fr: "Mille", en: "One thousand", category: "numbers", confidence: "core" },
  { wolof: "Ñaata la?", fr: "Combien ça coûte ?", en: "How much is it?", category: "numbers", confidence: "core" },

  // Food & Drink
  { wolof: "Ceeb", fr: "Riz", en: "Rice", category: "food", confidence: "core" },
  { wolof: "Jën", fr: "Poisson", en: "Fish", category: "food", confidence: "core" },
  { wolof: "Yàpp", fr: "Viande", en: "Meat", category: "food", confidence: "core" },
  { wolof: "Ndox", fr: "Eau", en: "Water", category: "food", confidence: "core" },
  { wolof: "Meew", fr: "Lait", en: "Milk", category: "food", confidence: "core" },
  { wolof: "Soow", fr: "Lait caillé", en: "Curdled milk", category: "food", confidence: "core" },
  { wolof: "Attaaya", fr: "Thé (à la menthe)", en: "(Mint) tea", category: "food", confidence: "core" },
  { wolof: "Kafe", fr: "Café", en: "Coffee", category: "food", confidence: "core" },
  { wolof: "Mburu", fr: "Pain", en: "Bread", category: "food", confidence: "core" },
  { wolof: "Nen", fr: "Œuf", en: "Egg", category: "food", confidence: "core" },
  { wolof: "Ganaar", fr: "Poulet", en: "Chicken", category: "food", confidence: "core" },
  { wolof: "Xorom", fr: "Sel", en: "Salt", category: "food", confidence: "core" },
  { wolof: "Suukar", fr: "Sucre", en: "Sugar", category: "food", confidence: "review" },
  { wolof: "Diwtiir", fr: "Huile", en: "Oil", category: "food", confidence: "review" },
  { wolof: "Ñebbe", fr: "Haricots", en: "Beans", category: "food", confidence: "core" },
  { wolof: "Màngo", fr: "Mangue", en: "Mango", category: "food", confidence: "core" },
  { wolof: "Banaana", fr: "Banane", en: "Banana", category: "food", confidence: "core" },
  { wolof: "Ceebu jën", fr: "Riz au poisson (plat national)", en: "Rice with fish (national dish)", category: "food", confidence: "core" },
  { wolof: "Yassa", fr: "Yassa (plat à la sauce oignon-citron)", en: "Yassa (onion-lemon sauce dish)", category: "food", confidence: "core" },
  { wolof: "Ndékki", fr: "Petit-déjeuner", en: "Breakfast", category: "food", confidence: "core" },
  { wolof: "Añ", fr: "Déjeuner", en: "Lunch", category: "food", confidence: "core" },
  { wolof: "Reer", fr: "Dîner", en: "Dinner", category: "food", confidence: "core" },
  { wolof: "Xiif naa", fr: "J'ai faim", en: "I'm hungry", category: "food", confidence: "core" },
  { wolof: "Mar naa", fr: "J'ai soif", en: "I'm thirsty", category: "food", confidence: "core" },
  { wolof: "Neex na", fr: "C'est délicieux", en: "It's delicious", category: "food", confidence: "core" },

  // Colors
  { wolof: "Weex", fr: "Blanc", en: "White", category: "colors", confidence: "core" },
  { wolof: "Ñuul", fr: "Noir", en: "Black", category: "colors", confidence: "core" },
  { wolof: "Xonq", fr: "Rouge", en: "Red", category: "colors", confidence: "core" },
  { wolof: "Wert", fr: "Vert", en: "Green", category: "colors", confidence: "core" },
  { wolof: "Bulo", fr: "Bleu", en: "Blue", category: "colors", confidence: "review" },
  { wolof: "Mboq", fr: "Jaune", en: "Yellow", category: "colors", confidence: "review" },
  { wolof: "Melo", fr: "Couleur", en: "Color", category: "colors", confidence: "review" },

  // Everyday objects
  { wolof: "Téere", fr: "Livre", en: "Book", category: "objects", confidence: "core" },
  { wolof: "Bind", fr: "Stylo (bic)", en: "Pen", category: "objects", confidence: "review" },
  { wolof: "Oto", fr: "Voiture", en: "Car", category: "objects", confidence: "core" },
  { wolof: "Bunt", fr: "Porte", en: "Door", category: "objects", confidence: "core" },
  { wolof: "Palanteer", fr: "Fenêtre", en: "Window", category: "objects", confidence: "review" },
  { wolof: "Siis", fr: "Chaise", en: "Chair", category: "objects", confidence: "core" },
  { wolof: "Taabal", fr: "Table", en: "Table", category: "objects", confidence: "core" },
  { wolof: "Lal", fr: "Lit", en: "Bed", category: "objects", confidence: "core" },
  { wolof: "Xaalis", fr: "Argent", en: "Money", category: "objects", confidence: "core" },
  { wolof: "Telefon", fr: "Téléphone", en: "Phone", category: "objects", confidence: "core" },
  { wolof: "Paaka", fr: "Couteau", en: "Knife", category: "objects", confidence: "core" },
  { wolof: "Ndab", fr: "Récipient / bol", en: "Container / bowl", category: "objects", confidence: "review" },
  { wolof: "Sabu", fr: "Savon", en: "Soap", category: "objects", confidence: "core" },
  { wolof: "Dëkk", fr: "Ville / village", en: "Town / village", category: "objects", confidence: "core" },

  // Common Verbs
  { wolof: "Dem", fr: "Aller", en: "To go", category: "verbs", confidence: "core" },
  { wolof: "Ñëw", fr: "Venir", en: "To come", category: "verbs", confidence: "core" },
  { wolof: "Lekk", fr: "Manger", en: "To eat", category: "verbs", confidence: "core" },
  { wolof: "Naan", fr: "Boire", en: "To drink", category: "verbs", confidence: "core" },
  { wolof: "Gis", fr: "Voir", en: "To see", category: "verbs", confidence: "core" },
  { wolof: "Dégg", fr: "Entendre / comprendre", en: "To hear / understand", category: "verbs", confidence: "core" },
  { wolof: "Wax", fr: "Parler / dire", en: "To speak / say", category: "verbs", confidence: "core" },
  { wolof: "Bind", fr: "Écrire", en: "To write", category: "verbs", confidence: "core" },
  { wolof: "Jàng", fr: "Étudier / lire / apprendre", en: "To study / read / learn", category: "verbs", confidence: "core" },
  { wolof: "Jàngale", fr: "Enseigner", en: "To teach", category: "verbs", confidence: "core" },
  { wolof: "Liggéey", fr: "Travailler", en: "To work", category: "verbs", confidence: "core" },
  { wolof: "Nelaw", fr: "Dormir", en: "To sleep", category: "verbs", confidence: "core" },
  { wolof: "Def", fr: "Faire", en: "To do", category: "verbs", confidence: "core" },
  { wolof: "Bëgg", fr: "Vouloir / aimer", en: "To want / love", category: "verbs", confidence: "core" },
  { wolof: "Am", fr: "Avoir", en: "To have", category: "verbs", confidence: "core" },
  { wolof: "Jënd", fr: "Acheter", en: "To buy", category: "verbs", confidence: "core" },
  { wolof: "Jaay", fr: "Vendre", en: "To sell", category: "verbs", confidence: "core" },
  { wolof: "Toog", fr: "S'asseoir / rester", en: "To sit / stay", category: "verbs", confidence: "core" },
  { wolof: "Taxaw", fr: "Se lever / être debout", en: "To stand up", category: "verbs", confidence: "core" },
  { wolof: "Daw", fr: "Courir", en: "To run", category: "verbs", confidence: "core" },
  { wolof: "Dox", fr: "Marcher", en: "To walk", category: "verbs", confidence: "core" },
  { wolof: "Ree", fr: "Rire", en: "To laugh", category: "verbs", confidence: "core" },
  { wolof: "Jooy", fr: "Pleurer", en: "To cry", category: "verbs", confidence: "core" },
  { wolof: "Sangu", fr: "Se laver / se doucher", en: "To wash / shower", category: "verbs", confidence: "core" },
  { wolof: "Togg", fr: "Cuisiner", en: "To cook", category: "verbs", confidence: "core" },
  { wolof: "Fo", fr: "Jouer", en: "To play", category: "verbs", confidence: "core" },
  { wolof: "Woo", fr: "Appeler", en: "To call", category: "verbs", confidence: "core" },
  { wolof: "Xam", fr: "Savoir / connaître", en: "To know", category: "verbs", confidence: "core" },

  // Days & Time
  { wolof: "Altine", fr: "Lundi", en: "Monday", category: "days", confidence: "core" },
  { wolof: "Talaata", fr: "Mardi", en: "Tuesday", category: "days", confidence: "core" },
  { wolof: "Àllarba", fr: "Mercredi", en: "Wednesday", category: "days", confidence: "core" },
  { wolof: "Alxamis", fr: "Jeudi", en: "Thursday", category: "days", confidence: "core" },
  { wolof: "Àjjuma", fr: "Vendredi", en: "Friday", category: "days", confidence: "core" },
  { wolof: "Gaawu", fr: "Samedi", en: "Saturday", category: "days", confidence: "core" },
  { wolof: "Dibéer", fr: "Dimanche", en: "Sunday", category: "days", confidence: "core" },
  { wolof: "Tey", fr: "Aujourd'hui", en: "Today", category: "days", confidence: "core" },
  { wolof: "Suba", fr: "Demain / matin", en: "Tomorrow / morning", category: "days", confidence: "core" },
  { wolof: "Démb", fr: "Hier", en: "Yesterday", category: "days", confidence: "core" },
  { wolof: "Ngoon", fr: "Après-midi / soir", en: "Afternoon / evening", category: "days", confidence: "core" },
  { wolof: "Guddi", fr: "Nuit", en: "Night", category: "days", confidence: "core" },
  { wolof: "Bés", fr: "Jour", en: "Day", category: "days", confidence: "core" },
  { wolof: "Ayubés", fr: "Semaine", en: "Week", category: "days", confidence: "core" },
  { wolof: "Weer", fr: "Mois / lune", en: "Month / moon", category: "days", confidence: "core" },
  { wolof: "At", fr: "Année", en: "Year", category: "days", confidence: "core" },
  { wolof: "Léegi", fr: "Maintenant", en: "Now", category: "days", confidence: "core" },
  { wolof: "Ban waxtu moo jot?", fr: "Quelle heure est-il ?", en: "What time is it?", category: "days", confidence: "core" },

  // Body
  { wolof: "Bopp", fr: "Tête", en: "Head", category: "body", confidence: "core" },
  { wolof: "Bët", fr: "Œil", en: "Eye", category: "body", confidence: "core" },
  { wolof: "Nopp", fr: "Oreille", en: "Ear", category: "body", confidence: "core" },
  { wolof: "Bakkan", fr: "Nez", en: "Nose", category: "body", confidence: "core" },
  { wolof: "Gémmiñ", fr: "Bouche", en: "Mouth", category: "body", confidence: "core" },
  { wolof: "Bëñ", fr: "Dent", en: "Tooth", category: "body", confidence: "core" },
  { wolof: "Loxo", fr: "Main / bras", en: "Hand / arm", category: "body", confidence: "core" },
  { wolof: "Tànk", fr: "Pied / jambe", en: "Foot / leg", category: "body", confidence: "core" },
  { wolof: "Biir", fr: "Ventre", en: "Belly", category: "body", confidence: "core" },
  { wolof: "Xol", fr: "Cœur", en: "Heart", category: "body", confidence: "core" },
  { wolof: "Kawar", fr: "Cheveux", en: "Hair", category: "body", confidence: "core" },
  { wolof: "Der", fr: "Peau", en: "Skin", category: "body", confidence: "review" },

  // Animals
  { wolof: "Xaj", fr: "Chien", en: "Dog", category: "animals", confidence: "core" },
  { wolof: "Muus", fr: "Chat", en: "Cat", category: "animals", confidence: "core" },
  { wolof: "Fas", fr: "Cheval", en: "Horse", category: "animals", confidence: "core" },
  { wolof: "Nag", fr: "Vache", en: "Cow", category: "animals", confidence: "core" },
  { wolof: "Xar", fr: "Mouton", en: "Sheep", category: "animals", confidence: "core" },
  { wolof: "Bëy", fr: "Chèvre", en: "Goat", category: "animals", confidence: "core" },
  { wolof: "Picc", fr: "Oiseau", en: "Bird", category: "animals", confidence: "core" },
  { wolof: "Gaynde", fr: "Lion", en: "Lion", category: "animals", confidence: "core" },
  { wolof: "Ñey", fr: "Éléphant", en: "Elephant", category: "animals", confidence: "core" },
  { wolof: "Golo", fr: "Singe", en: "Monkey", category: "animals", confidence: "core" },
  { wolof: "Jaan", fr: "Serpent", en: "Snake", category: "animals", confidence: "core" },
  { wolof: "Ginaar", fr: "Poule", en: "Hen", category: "animals", confidence: "review" },
  { wolof: "Yëkk", fr: "Chameau", en: "Camel", category: "animals", confidence: "review" },
  { wolof: "Mala", fr: "Animal", en: "Animal", category: "animals", confidence: "review" },

  // Places & City
  { wolof: "Marse", fr: "Marché", en: "Market", category: "places", confidence: "core" },
  { wolof: "Jumaa", fr: "Mosquée", en: "Mosque", category: "places", confidence: "core" },
  { wolof: "Jàngu", fr: "Église", en: "Church", category: "places", confidence: "review" },
  { wolof: "Lekool", fr: "École", en: "School", category: "places", confidence: "core" },
  { wolof: "Loppitaan", fr: "Hôpital", en: "Hospital", category: "places", confidence: "core" },
  { wolof: "Mbedd", fr: "Rue", en: "Street", category: "places", confidence: "core" },
  { wolof: "Yoon", fr: "Chemin / route", en: "Path / road", category: "places", confidence: "core" },
  { wolof: "Géej", fr: "Mer", en: "Sea", category: "places", confidence: "core" },
  { wolof: "Tefes", fr: "Plage", en: "Beach", category: "places", confidence: "core" },
  { wolof: "Àll", fr: "Brousse / campagne", en: "Bush / countryside", category: "places", confidence: "review" },
  { wolof: "Butik", fr: "Boutique", en: "Shop", category: "places", confidence: "core" },
  { wolof: "Ndakaaru", fr: "Dakar", en: "Dakar", category: "places", confidence: "core" },
  { wolof: "Senegaal", fr: "Sénégal", en: "Senegal", category: "places", confidence: "core" },
  { wolof: "Fan la ... nekk?", fr: "Où se trouve ... ?", en: "Where is ... ?", category: "places", confidence: "core" },

  // Weather & Nature
  { wolof: "Jant", fr: "Soleil", en: "Sun", category: "weather", confidence: "core" },
  { wolof: "Taw", fr: "Pluie", en: "Rain", category: "weather", confidence: "core" },
  { wolof: "Ngelaw", fr: "Vent", en: "Wind", category: "weather", confidence: "core" },
  { wolof: "Asamaan", fr: "Ciel", en: "Sky", category: "weather", confidence: "core" },
  { wolof: "Niir", fr: "Nuage", en: "Cloud", category: "weather", confidence: "review" },
  { wolof: "Suuf", fr: "Terre / sol", en: "Earth / ground", category: "weather", confidence: "core" },
  { wolof: "Garab", fr: "Arbre / médicament", en: "Tree / medicine", category: "weather", confidence: "core" },
  { wolof: "Tàngaay", fr: "Chaleur", en: "Heat", category: "weather", confidence: "core" },
  { wolof: "Sedd", fr: "Froid", en: "Cold", category: "weather", confidence: "core" },
  { wolof: "Tàng na", fr: "Il fait chaud", en: "It's hot", category: "weather", confidence: "core" },
  { wolof: "Sedd na", fr: "Il fait froid", en: "It's cold", category: "weather", confidence: "core" },
  { wolof: "Taw bi dafay taw", fr: "Il pleut", en: "It's raining", category: "weather", confidence: "review" },

  // Clothing
  { wolof: "Yére", fr: "Vêtement", en: "Clothing", category: "clothing", confidence: "core" },
  { wolof: "Simis", fr: "Chemise", en: "Shirt", category: "clothing", confidence: "core" },
  { wolof: "Tubéy", fr: "Pantalon", en: "Trousers / pants", category: "clothing", confidence: "core" },
  { wolof: "Dàll", fr: "Chaussure", en: "Shoe", category: "clothing", confidence: "core" },
  { wolof: "Mbubb", fr: "Boubou (grande tunique)", en: "Boubou (large tunic)", category: "clothing", confidence: "core" },
  { wolof: "Sér", fr: "Pagne", en: "Wrap skirt (pagne)", category: "clothing", confidence: "core" },
  { wolof: "Mus(ó)or", fr: "Foulard de tête", en: "Headscarf", category: "clothing", confidence: "review" },
  { wolof: "Sol", fr: "Porter / mettre (vêtement)", en: "To wear / put on", category: "clothing", confidence: "core" },

  // Pronouns & question words
  { wolof: "Man", fr: "Moi / je", en: "Me / I", category: "pronouns", confidence: "core" },
  { wolof: "Yow", fr: "Toi / tu", en: "You (singular)", category: "pronouns", confidence: "core" },
  { wolof: "Moom", fr: "Lui / elle", en: "Him / her", category: "pronouns", confidence: "core" },
  { wolof: "Nun", fr: "Nous", en: "We / us", category: "pronouns", confidence: "core" },
  { wolof: "Yéen", fr: "Vous", en: "You (plural)", category: "pronouns", confidence: "core" },
  { wolof: "Ñoom", fr: "Eux / elles", en: "They / them", category: "pronouns", confidence: "core" },
  { wolof: "Kan?", fr: "Qui ?", en: "Who?", category: "pronouns", confidence: "core" },
  { wolof: "Lan?", fr: "Quoi ?", en: "What?", category: "pronouns", confidence: "core" },
  { wolof: "Fan?", fr: "Où ?", en: "Where?", category: "pronouns", confidence: "core" },
  { wolof: "Kañ?", fr: "Quand ?", en: "When?", category: "pronouns", confidence: "core" },
  { wolof: "Naka?", fr: "Comment ?", en: "How?", category: "pronouns", confidence: "core" },
  { wolof: "Lu tax?", fr: "Pourquoi ?", en: "Why?", category: "pronouns", confidence: "core" },
  { wolof: "Ñaata?", fr: "Combien ?", en: "How many / how much?", category: "pronouns", confidence: "core" },

  // Adjectives & states
  { wolof: "Baax", fr: "Bon / gentil", en: "Good / kind", category: "adjectives", confidence: "core" },
  { wolof: "Bon", fr: "Mauvais", en: "Bad", category: "adjectives", confidence: "core" },
  { wolof: "Rafet", fr: "Beau / belle", en: "Beautiful", category: "adjectives", confidence: "core" },
  { wolof: "Ñaaw", fr: "Laid / moche", en: "Ugly", category: "adjectives", confidence: "core" },
  { wolof: "Mag", fr: "Grand / âgé", en: "Big / old", category: "adjectives", confidence: "core" },
  { wolof: "Ndaw", fr: "Petit / jeune", en: "Small / young", category: "adjectives", confidence: "core" },
  { wolof: "Bees", fr: "Nouveau / neuf", en: "New", category: "adjectives", confidence: "core" },
  { wolof: "Gaaw", fr: "Rapide", en: "Fast", category: "adjectives", confidence: "core" },
  { wolof: "Yomb", fr: "Facile / pas cher", en: "Easy / cheap", category: "adjectives", confidence: "core" },
  { wolof: "Jafe", fr: "Difficile / cher", en: "Difficult / expensive", category: "adjectives", confidence: "core" },
  { wolof: "Sonn", fr: "Fatigué", en: "Tired", category: "adjectives", confidence: "core" },
  { wolof: "Bég", fr: "Content / heureux", en: "Happy / glad", category: "adjectives", confidence: "core" },
  { wolof: "Feebar", fr: "Malade", en: "Sick", category: "adjectives", confidence: "core" },
  { wolof: "Set", fr: "Propre", en: "Clean", category: "adjectives", confidence: "core" },

  // Everyday Phrases & simple sentences
  { wolof: "Dégg naa", fr: "J'ai compris", en: "I understand / understood", category: "phrases", confidence: "core" },
  { wolof: "Dégguma", fr: "Je ne comprends pas", en: "I don't understand", category: "phrases", confidence: "core" },
  { wolof: "Xamuma", fr: "Je ne sais pas", en: "I don't know", category: "phrases", confidence: "core" },
  { wolof: "Ndax dégg nga wolof?", fr: "Est-ce que tu comprends le wolof ?", en: "Do you understand Wolof?", category: "phrases", confidence: "core" },
  { wolof: "Waaw, tuuti rekk", fr: "Oui, un petit peu seulement", en: "Yes, just a little", category: "phrases", confidence: "core" },
  { wolof: "Damay jàng wolof", fr: "J'apprends le wolof", en: "I'm learning Wolof", category: "phrases", confidence: "core" },
  { wolof: "Waxal ndànk, su la neexee", fr: "Parle lentement, s'il te plaît", en: "Speak slowly, please", category: "phrases", confidence: "review" },
  { wolof: "Lu xew?", fr: "Qu'est-ce qui se passe ?", en: "What's happening?", category: "phrases", confidence: "core" },
  { wolof: "Bëgg naa ko", fr: "Je le veux / je l'aime", en: "I want it / I like it", category: "phrases", confidence: "core" },
  { wolof: "Bëgguma ko", fr: "Je ne le veux pas", en: "I don't want it", category: "phrases", confidence: "core" },
  { wolof: "Maa ngi dem marse", fr: "Je vais au marché", en: "I'm going to the market", category: "phrases", confidence: "core" },
  { wolof: "Kaay lekk!", fr: "Viens manger !", en: "Come eat!", category: "phrases", confidence: "core" },
  { wolof: "Yow nak?", fr: "Et toi ?", en: "And you?", category: "phrases", confidence: "core" },
  { wolof: "Amul solo", fr: "Ce n'est pas grave", en: "It doesn't matter / no problem", category: "phrases", confidence: "core" },
  { wolof: "Ndank-ndank", fr: "Doucement / petit à petit", en: "Slowly / little by little", category: "phrases", confidence: "core" },
  { wolof: "Inch'Allah", fr: "Si Dieu le veut", en: "God willing", category: "phrases", confidence: "core" },
  { wolof: "Jàmm nga fanaane?", fr: "As-tu passé la nuit en paix ? (bonjour du matin)", en: "Did you spend the night in peace? (morning greeting)", category: "phrases", confidence: "core" },
  { wolof: "Jàmm nga yendoo?", fr: "As-tu passé la journée en paix ?", en: "Did you spend the day in peace?", category: "phrases", confidence: "review" },
  { wolof: "Fo jóge?", fr: "D'où viens-tu ?", en: "Where do you come from?", category: "phrases", confidence: "review" },
  { wolof: "Su la neexee", fr: "S'il te plaît", en: "Please", category: "phrases", confidence: "core" },
];

const CATEGORY_META: Record<
  Category,
  { titleFr: string; titleEn: string; descFr: string; descEn: string; order: number }
> = {
  greetings: {
    titleFr: "Salutations et bases",
    titleEn: "Greetings & Basics",
    descFr: "Apprends à saluer et à te présenter en wolof",
    descEn: "Learn to greet people and introduce yourself in Wolof",
    order: 1,
  },
  family: {
    titleFr: "La famille",
    titleEn: "Family",
    descFr: "Le vocabulaire de la famille et des proches",
    descEn: "Family and relatives vocabulary in Wolof",
    order: 2,
  },
  numbers: {
    titleFr: "Les nombres",
    titleEn: "Numbers",
    descFr: "Compter en wolof, de 1 à 1000",
    descEn: "Count in Wolof, from 1 to 1000",
    order: 3,
  },
  food: {
    titleFr: "Nourriture et boissons",
    titleEn: "Food & Drink",
    descFr: "La cuisine sénégalaise et les repas",
    descEn: "Senegalese cuisine and meals",
    order: 4,
  },
  colors: {
    titleFr: "Les couleurs",
    titleEn: "Colors",
    descFr: "Les couleurs en wolof",
    descEn: "Colors in Wolof",
    order: 5,
  },
  objects: {
    titleFr: "Objets du quotidien",
    titleEn: "Everyday Objects",
    descFr: "Les objets de la maison et de la vie quotidienne",
    descEn: "Household and everyday objects",
    order: 6,
  },
  verbs: {
    titleFr: "Verbes courants",
    titleEn: "Common Verbs",
    descFr: "Les verbes les plus utilisés en wolof",
    descEn: "The most commonly used Wolof verbs",
    order: 7,
  },
  days: {
    titleFr: "Jours et temps",
    titleEn: "Days & Time",
    descFr: "Les jours de la semaine et les expressions de temps",
    descEn: "Days of the week and time expressions",
    order: 8,
  },
  body: {
    titleFr: "Le corps humain",
    titleEn: "The Body",
    descFr: "Les parties du corps en wolof",
    descEn: "Parts of the body in Wolof",
    order: 9,
  },
  animals: {
    titleFr: "Les animaux",
    titleEn: "Animals",
    descFr: "Les animaux domestiques et sauvages",
    descEn: "Domestic and wild animals",
    order: 10,
  },
  places: {
    titleFr: "Lieux et ville",
    titleEn: "Places & City",
    descFr: "Se repérer en ville et au Sénégal",
    descEn: "Getting around town and Senegal",
    order: 11,
  },
  weather: {
    titleFr: "Météo et nature",
    titleEn: "Weather & Nature",
    descFr: "Le temps qu'il fait et la nature",
    descEn: "Weather and nature vocabulary",
    order: 12,
  },
  clothing: {
    titleFr: "Les vêtements",
    titleEn: "Clothing",
    descFr: "S'habiller à la sénégalaise",
    descEn: "Dressing the Senegalese way",
    order: 13,
  },
  pronouns: {
    titleFr: "Pronoms et questions",
    titleEn: "Pronouns & Questions",
    descFr: "Les pronoms personnels et les mots interrogatifs",
    descEn: "Personal pronouns and question words",
    order: 14,
  },
  adjectives: {
    titleFr: "Adjectifs et états",
    titleEn: "Adjectives & States",
    descFr: "Décrire les choses et dire comment on se sent",
    descEn: "Describe things and say how you feel",
    order: 15,
  },
  phrases: {
    titleFr: "Phrases du quotidien",
    titleEn: "Everyday Phrases",
    descFr: "Des phrases utiles pour converser en wolof",
    descEn: "Useful phrases for everyday conversation in Wolof",
    order: 16,
  },
};

type Lang = "fr" | "en";

interface ChallengeOption {
  text: string;
  correct: boolean;
  imageSrc: string | null;
  audioSrc: string | null;
}

interface Challenge {
  type: "SELECT" | "ASSIST";
  question: string;
  order: number;
  options: ChallengeOption[];
}

interface LessonOut {
  title: string;
  order: number;
  challenges: Challenge[];
}

interface UnitOut {
  title: string;
  description: string;
  order: number;
  lessons: LessonOut[];
}

// Deterministic seeded PRNG (mulberry32) so the seed file is reproducible
// across runs while still giving well-mixed option/distractor ordering.
let rngState = 0x9e3779b9;
function rand(): number {
  rngState |= 0;
  rngState = (rngState + 0x6d2b79f5) | 0;
  let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(
  pool: VocabItem[],
  exclude: VocabItem,
  count: number,
  field: "wolof" | Lang
): string[] {
  // Never reuse the excluded item's text on either side (some words share a
  // translation, e.g. "Doom"/"Xale" both mean child) to avoid two correct
  // answers in one challenge.
  const seen = new Set<string>([exclude[field], exclude.wolof, exclude.fr, exclude.en]);
  const candidates = shuffle(pool.filter((v) => v.wolof !== exclude.wolof));
  const out: string[] = [];
  for (const v of candidates) {
    if (out.length >= count) break;
    if (seen.has(v[field])) continue;
    seen.add(v[field]);
    out.push(v[field]);
  }
  return out;
}

function buildChallengesForItem(
  item: VocabItem,
  categoryPool: VocabItem[],
  lang: Lang,
  startOrder: number
): Challenge[] {
  const translation = item[lang];
  const challenges: Challenge[] = [];
  let order = startOrder;

  // SELECT: "How do you say X in Wolof?" -> pick the wolof word
  const distractorsWolof = pickDistractors(categoryPool, item, 3, "wolof");
  challenges.push({
    type: "SELECT",
    question:
      lang === "fr"
        ? `Comment dit-on "${translation}" en wolof ?`
        : `How do you say "${translation}" in Wolof?`,
    order: order++,
    options: shuffle([
      { text: item.wolof, correct: true, imageSrc: null, audioSrc: null },
      ...distractorsWolof.map((t) => ({
        text: t,
        correct: false,
        imageSrc: null,
        audioSrc: null,
      })),
    ]),
  });

  // ASSIST: show the wolof word, pick the correct translation
  const distractorsTrans = pickDistractors(categoryPool, item, 3, lang);
  challenges.push({
    type: "ASSIST",
    question: item.wolof,
    order: order++,
    options: shuffle([
      { text: translation, correct: true, imageSrc: null, audioSrc: null },
      ...distractorsTrans.map((t) => ({
        text: t,
        correct: false,
        imageSrc: null,
        audioSrc: null,
      })),
    ]),
  });

  return challenges;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function buildUnits(lang: Lang): UnitOut[] {
  const categories = Object.keys(CATEGORY_META) as Category[];

  return categories
    .map((category) => {
      const meta = CATEGORY_META[category];
      const items = VOCAB.filter((v) => v.category === category);
      const lessonGroups = chunk(items, 3);

      const lessons: LessonOut[] = lessonGroups.map((group, idx) => {
        let order = 1;
        const challenges: Challenge[] = [];
        for (const item of group) {
          challenges.push(...buildChallengesForItem(item, items, lang, order));
          order += 2;
        }
        return {
          title:
            lang === "fr"
              ? `${meta.titleFr} ${idx + 1}`
              : `${meta.titleEn} ${idx + 1}`,
          order: idx + 1,
          challenges,
        };
      });

      // Review lesson: re-test a random sample of the unit's vocabulary.
      const reviewItems = shuffle(items).slice(0, 4);
      let reviewOrder = 1;
      const reviewChallenges: Challenge[] = [];
      for (const item of reviewItems) {
        reviewChallenges.push(
          ...buildChallengesForItem(item, items, lang, reviewOrder)
        );
        reviewOrder += 2;
      }
      lessons.push({
        title:
          lang === "fr" ? `Révision : ${meta.titleFr}` : `Review: ${meta.titleEn}`,
        order: lessons.length + 1,
        challenges: reviewChallenges,
      });

      return {
        title:
          lang === "fr"
            ? `Unité ${meta.order} : ${meta.titleFr}`
            : `Unit ${meta.order}: ${meta.titleEn}`,
        description: lang === "fr" ? meta.descFr : meta.descEn,
        order: meta.order,
        lessons,
      };
    })
    .sort((a, b) => a.order - b.order);
}

function countStats(units: UnitOut[]) {
  let lessons = 0,
    challenges = 0,
    options = 0;
  for (const u of units) {
    lessons += u.lessons.length;
    for (const l of u.lessons) {
      challenges += l.challenges.length;
      for (const c of l.challenges) options += c.options.length;
    }
  }
  return { units: units.length, lessons, challenges, options };
}

// Sanity checks: every challenge must have exactly one correct option and no
// duplicate option texts.
function validate(units: UnitOut[]) {
  for (const u of units) {
    for (const l of u.lessons) {
      for (const c of l.challenges) {
        const correct = c.options.filter((o) => o.correct).length;
        if (correct !== 1)
          throw new Error(
            `Challenge "${c.question}" in ${u.title}/${l.title} has ${correct} correct options`
          );
        const texts = c.options.map((o) => o.text);
        if (new Set(texts).size !== texts.length)
          throw new Error(
            `Challenge "${c.question}" in ${u.title}/${l.title} has duplicate options: ${texts.join(", ")}`
          );
      }
    }
  }
}

const coreCount = VOCAB.filter((v) => v.confidence === "core").length;
const reviewCount = VOCAB.filter((v) => v.confidence === "review").length;

const frUnits = buildUnits("fr");
const enUnits = buildUnits("en");
validate(frUnits);
validate(enUnits);

const output = {
  meta: {
    language: "Wolof",
    note:
      "AI-assembled content using standard, well-attested Wolof vocabulary in " +
      "standard (CLAD) orthography across 16 thematic units. Vocabulary is not " +
      "placeholder/fake, but native-speaker review is still recommended before " +
      "wide launch, especially for the items flagged 'review' below (spelling " +
      "variants, register, and dialectal differences are common in Wolof).",
    coreVocabCount: coreCount,
    reviewVocabCount: reviewCount,
    reviewFlaggedWords: VOCAB.filter((v) => v.confidence === "review").map(
      (v) => v.wolof
    ),
    generatedBy: "scripts/generate-wolof-content.ts",
    version: "2.0.0",
  },
  courses: [
    {
      course: { title: "Wolof (depuis le français)", imageSrc: "/sn.svg" },
      units: frUnits,
      stats: countStats(frUnits),
    },
    {
      course: { title: "Wolof (from English)", imageSrc: "/sn.svg" },
      units: enUnits,
      stats: countStats(enUnits),
    },
  ],
};

const outPath = join(process.cwd(), "seeds", "wolof-course.json");
writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log("Wrote", outPath);
console.log("Vocab items:", VOCAB.length, `(core: ${coreCount}, review: ${reviewCount})`);
console.log("FR course stats:", output.courses[0].stats);
console.log("EN course stats:", output.courses[1].stats);
