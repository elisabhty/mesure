# Power BI Quest · Opération Wonderland

Une appli web pour apprendre Power BI en immersion : 60 jours pour sauver un parc d'attractions grâce à la data.

Site : https://elisabhty.github.io/mesure/

## Module 1 — Le bureau des nouveaux arrivants

Dix missions sur la carte du parc, de « Ton premier jour » à « La première présentation ». Chaque mission contient :

- une cinématique avec Victoria, Gabriel, Oscar, Lola, Camille et Pixel ;
- une leçon interactive ;
- huit exercices joués dans un Power BI Desktop simulé (rapport, table, modèle, Navigateur, Texte/CSV, Power Query), avec trois indices et des erreurs expliquées ;
- 25 XP par exercice, un badge, un objet pour le bureau et huit fiches mémo à retourner.

Le projet `Wonderland_Pilotage` est conservé d'une mission à l'autre : tables importées, types, formats, pages et visuels.

## Module 2 — Les archives oubliées

Dix missions dans les archives techniques du parc, de « Le fichier catastrophe » à la finale « Le grand nettoyage ». On y prépare un vrai export de maintenance désorganisé dans un éditeur Power Query mobile :

- références, index de traçabilité, lignes de contexte, en-têtes, valeurs manquantes, doublons et collisions d'identifiants ;
- dates impossibles et fonctions personnalisées, fractionnement de colonnes, normalisation contrôlée des libellés ;
- ajout de douze fichiers mensuels avec leur provenance, fusion de requêtes avec comptage des correspondances et anti-jointure ;
- une finale en huit défis (mode apprentissage ou test chronométré), un bilan et un certificat pédagogique du module.

Chaque manipulation est vérifiée sur l'état réel des requêtes calculé par un moteur M simplifié (`js/pqengine.js`).

## L'écran d'exercice

Le logiciel occupe toute la largeur sous l'en-tête. En bas, une seule zone réunit la dernière réplique, la consigne en jaune et les questions, qui poussent l'éditeur vers le haut au lieu de le recouvrir. Dès que l'on agit, la réplique s'efface ; la poignée rouvre toute la conversation de l'exercice. Dans les boîtes de dialogue, la consigne avance pas à pas, une action à la fois. Power Query s'ouvre directement à chaque exercice du module 2, en 13 à 14 px, avec des cibles tactiles plus grandes ; le canevas du rapport se zoome (Ajuster, 150 %, 200 %).

## Attractions et style

Le parc commence éteint. Chaque mission réussie rallume son attraction sur la carte, et on peut ensuite la rejouer depuis la fiche de la mission. Les mini-jeux sont des attractions :

- **Montagnes russes** : le wagon arrive à l'aiguillage, on l'envoie sur la bonne voie (choix entre deux réponses).
- **Grande roue** : une nacelle par réponse, la roue tourne pour amener la bonne nacelle au quai (trois réponses ou plus, et les associations).
- **Petit train** : on pose les gares dans l'ordre et la locomotive avance (étapes à remettre dans l'ordre).
- **Stand de tir** : chaque réponse d'une question a sa cible.
- **Tape-taupe** : les réponses sortent de leur trou, on touche toutes les bonnes.

Chaque choix est jugé tout de suite, avec l'explication de la mission en cas d'erreur. Plusieurs bonnes réponses d'affilée déclenchent un combo. L'appli suit le style verre clair d'iOS (police de l'iPhone) ; Power BI et Power Query gardent leurs gestes habituels.

## Technique

HTML, CSS et JavaScript sans dépendance ni étape de build. Progression enregistrée dans le navigateur (`localStorage`).

- `js/core.js` : moteur (missions, cinématiques, indices, XP, récompenses, fiches)
- `js/pbi.js` : simulateur Power BI
- `js/pqengine.js` : moteur Power Query (étapes, langage M, profils)
- `js/pq2.js`, `js/pq2b.js`, `js/pq2c.js` : éditeur Power Query mobile
- `js/jeux.js` : attractions (montagnes russes, grande roue, petit train), étincelles, combo, vibrations
- `js/arcade.js` : registre des attractions rejouables (généré à partir des tests)
- `js/kit.js`, `js/kit2.js` : planches et boucles d'exercice partagées
- `js/m101.js` … `js/m110.js`, `js/m201.js` … `js/m210.js` : les missions
- `js/textes.js`, `js/textes2.js` : indices et erreurs contextuelles
- `js/data2.js` : fichiers d'entraînement du module 2
- `img/` : illustrations générées avec ElevenLabs

Police : celle du système (SF Pro sur iPhone). Données fictives.
