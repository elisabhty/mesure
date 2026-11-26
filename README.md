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

## Technique

HTML, CSS et JavaScript sans dépendance ni étape de build. Progression enregistrée dans le navigateur (`localStorage`).

- `js/core.js` : moteur (missions, cinématiques, indices, XP, récompenses, fiches)
- `js/pbi.js` : simulateur Power BI
- `js/pqengine.js` : moteur Power Query (étapes, langage M, profils)
- `js/pq2.js`, `js/pq2b.js`, `js/pq2c.js` : éditeur Power Query mobile
- `js/kit.js`, `js/kit2.js` : planches et boucles d'exercice partagées
- `js/m101.js` … `js/m110.js`, `js/m201.js` … `js/m210.js` : les missions
- `js/textes.js`, `js/textes2.js` : indices et erreurs contextuelles
- `js/data2.js` : fichiers d'entraînement du module 2
- `img/` : illustrations générées avec ElevenLabs

Police : Bricolage Grotesque (SIL Open Font License, voir `fonts/OFL.txt`). Données fictives.
