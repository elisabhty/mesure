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

## Technique

HTML, CSS et JavaScript sans dépendance ni étape de build. Progression enregistrée dans le navigateur (`localStorage`, clé `pbq-module1`).

- `js/core.js` : moteur (missions, cinématiques, indices, XP, récompenses, fiches)
- `js/pbi.js` : simulateur Power BI
- `js/kit.js` : planches d'exercice partagées
- `js/m101.js` … `js/m110.js` : les missions
- `js/textes.js` : indices et erreurs contextuelles
- `img/` : illustrations générées avec ElevenLabs

Police : Bricolage Grotesque (SIL Open Font License, voir `fonts/OFL.txt`). Données fictives.
