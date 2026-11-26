/* Power BI Quest — aides partagées par les missions du module 2 (Power Query)
   K2.work : boucle d'exercice validée sur l'état réel des requêtes ; K2.C : requêtes canoniques (fin de chaque mission). */
(function () {
'use strict';
const { h, esc, fr, $, $$, act, shake } = window.PBQ;
const PQE = window.PQE;

/* ───────── Requêtes canoniques ───────── */
let n = 0;
const st = (name, op, o) => Object.assign({ id: 'k' + (++n).toString(36), name, op }, o || {});
const put = (P, q) => { const i = P.queries.findIndex(x => x.id === q.id); if (i >= 0) P.queries[i] = q; else P.queries.push(q); return q; };
const grp = (P, g) => { P.qgroups = P.qgroups || []; if (!P.qgroups.includes(g)) P.qgroups.push(g); };
const C = {
  brut: () => ({ id: 'q_brut', name: 'prep_Maintenance_Brut', m2: true, load: false, refresh: true, group: 'Maintenance',
    steps: [st('Source', 'excel', { file: 'Maintenance_Wonderland_Brut.xlsx' }), st('Navigation', 'nav', { item: 'Export_Maintenance' })] }),
  structSteps: () => [st('Source', 'ref', { of: 'q_brut' }), st('Index ajouté', 'index', { col: 'Index', start: 1, incr: 1 }), st('Colonnes renommées', 'rename', { pairs: [['Index', 'Ligne_Source']] }),
    st('Contexte_Retire', 'skip', { n: 5 }), st('Entetes_Promus', 'promote'), st('Trace_Restauree', 'rename', { pairs: [['6', 'Ligne_Source']] }),
    st('Commentaire_Structure_Retire', 'filter', { cond: { kind: 'values', col: 'ID_Intervention', exclude: true, values: ['COMMENTAIRE ATELIER'] } }),
    st('Pied_Export_Retire', 'filter', { cond: { kind: 'values', col: 'ID_Intervention', exclude: true, values: ['TOTAL PROVISOIRE', 'FIN EXPORT'] } })],
  struct: () => ({ id: 'q_struct', name: 'prep_Maintenance_Structure', m2: true, load: false, refresh: true, group: 'Maintenance', steps: C.structSteps() })
};
/* Formules M des missions (copiables depuis les bulles de Pixel) */
const F = {
  tech: 'if [Technicien] = null then\n    null\nelse\n    let\n        TexteNettoye =\n            Text.Trim(\n                Text.Clean(\n                    Text.From([Technicien])\n                )\n            )\n    in\n        if TexteNettoye = "" then\n            null\n        else\n            TexteNettoye',
  cout: 'if [Cout_HT] = null then\n    "Absent"\nelse if Value.Is([Cout_HT], type text) then\n    let\n        Texte = Text.Trim([Cout_HT])\n    in\n        if Texte = "" then\n            "Absent"\n        else if Text.Upper(Texte) = "N/A" then\n            "Marqueur N/A"\n        else if Text.Lower(Texte) = "à confirmer" then\n            "À confirmer"\n        else\n            "Présent — contrôle de format requis"\nelse if Value.Is([Cout_HT], type number) then\n    "Présent numérique — contrôle métier requis"\nelse\n    "Type inattendu"',
  attr: 'if [Attraction] = null then\n    true\nelse\n    Text.Trim(Text.From([Attraction])) = ""',
  techA: '[Technicien_Normalise] = null',
  coutA: 'List.Contains(\n    {"Absent", "Marqueur N/A", "À confirmer"},\n    [Etat_Cout_HT]\n)',
  dossier: '[Technicien_A_Renseigner]\n    or [Attraction_A_Renseigner]\n    or [Cout_HT_A_Confirmer]',
  lireDate: "(Valeur as any) as record =>\nlet\n    Texte =\n        if Valeur = null then\n            null\n        else\n            Text.Trim(Text.From(Valeur)),\n\n    EstAbsent = Texte = null or Texte = \"\",\n\n    EstFR =\n        if EstAbsent then\n            false\n        else\n            Text.Length(Texte) = 10\n            and Text.Middle(Texte, 2, 1) = \"/\"\n            and Text.Middle(Texte, 5, 1) = \"/\",\n\n    EstISO =\n        if EstAbsent then\n            false\n        else\n            Text.Length(Texte) = 10\n            and Text.Middle(Texte, 4, 1) = \"-\"\n            and Text.Middle(Texte, 7, 1) = \"-\",\n\n    FormatAccepte = EstFR or EstISO,\n\n    Tentative =\n        if EstAbsent or not FormatAccepte then\n            null\n        else if EstFR then\n            try Date.FromText(\n                Texte,\n                [Format = \"dd/MM/yyyy\", Culture = \"fr-FR\"]\n            )\n        else\n            try Date.FromText(\n                Texte,\n                [Format = \"yyyy-MM-dd\", Culture = \"en-US\"]\n            ),\n\n    DateLue =\n        if EstAbsent or not FormatAccepte then\n            null\n        else if Tentative[HasError] then\n            null\n        else\n            Tentative[Value],\n\n    // Deux barres obliques ne suffisent pas :\n    // 12/31/2026 a la forme française, mais pas de mois 31.\n    MoisApparentFR =\n        if EstFR then\n            try Number.FromText(Text.Middle(Texte, 3, 2), \"en-US\")\n        else\n            null,\n\n    ConventionNonAcceptee =\n        if not EstFR then\n            false\n        else if MoisApparentFR[HasError] then\n            false\n        else\n            MoisApparentFR[Value] > 12,\n\n    Etat =\n        if EstAbsent then\n            \"Absent\"\n        else if not FormatAccepte then\n            \"Format non accepté\"\n        else if ConventionNonAcceptee then\n            \"Format non accepté\"\n        else if Tentative[HasError] then\n            \"Date invalide\"\n        else if\n            DateLue < #date(2026, 5, 1)\n            or DateLue > #date(2026, 5, 31)\n        then\n            \"Hors période\"\n        else if EstFR then\n            \"Valide FR\"\n        else\n            \"Valide ISO\"\nin\n    [Date = DateLue, Controle = Etat]",
  chrono: 'if\n    [Date_Demande_Parsee] = null\n    or [Date_Intervention_Parsee] = null\nthen\n    "Non évaluable"\nelse if\n    [Date_Intervention_Parsee]\n        < [Date_Demande_Parsee]\nthen\n    "Intervention avant demande"\nelse\n    "Ordre compatible"',
  investDates: 'not List.Contains(\n    {"Valide FR", "Valide ISO"},\n    [Controle_Date_Demande]\n)\nor not List.Contains(\n    {"Valide FR", "Valide ISO"},\n    [Controle_Date_Intervention]\n)\nor [Controle_Chronologie]\n    <> "Ordre compatible"'
};
C.nullsSteps = () => [st('Source', 'ref', { of: 'q_struct' }),
  st('Personnalisée ajoutée', 'custom', { col: 'Technicien_Normalise', type: 'text', src: F.tech }),
  st('Personnalisée ajoutée1', 'custom', { col: 'Etat_Cout_HT', type: 'text', src: F.cout }),
  st('Personnalisée ajoutée2', 'custom', { col: 'Attraction_A_Renseigner', type: 'bool', src: F.attr }),
  st('Personnalisée ajoutée3', 'custom', { col: 'Technicien_A_Renseigner', type: 'bool', src: F.techA }),
  st('Personnalisée ajoutée4', 'custom', { col: 'Cout_HT_A_Confirmer', type: 'bool', src: F.coutA }),
  st('Personnalisée ajoutée5', 'custom', { col: 'Dossier_Incomplet', type: 'bool', src: F.dossier })];
C.nulls = () => ({ id: 'q_nulls', name: 'prep_Maintenance_Nulls', m2: true, load: false, refresh: true, group: 'Maintenance', steps: C.nullsSteps() });
C.dblSteps = () => [st('Source', 'ref', { of: 'q_nulls' }), st('Copie_Export_Confirmee_Retiree', 'filter', { cond: { kind: 'values', col: 'Ligne_Source', exclude: true, values: [907] } })];
C.dbl = () => ({ id: 'q_dbl', name: 'prep_Maintenance_Doublons', m2: true, load: false, refresh: true, group: 'Maintenance', steps: C.dblSteps() });
/* 205 : fonction de lecture des dates et préparation Dates (25 colonnes) */
C.fn = () => ({ id: 'q_fn', name: 'fn_LireDate', m2: true, blank: true, load: false, refresh: true, steps: [st('Source', 'mstep', { src: F.lireDate })] });
const lire = (src, k) => [st('Fonction personnalisée appelée' + k, 'custom', { col: 'Diagnostic_' + src, src: `fn_LireDate([Date_${src}])`, type: 'any', invoke: true }),
  st(`Diagnostic_${src} développé`, 'expand', { col: 'Diagnostic_' + src, fields: ['Date', 'Controle'], prefix: false, record: true }),
  st('Colonnes renommées' + k, 'rename', { pairs: [['Date', `Date_${src}_Parsee`], ['Controle', `Controle_Date_${src}`]] }),
  st('Type modifié' + k, 'type', { changes: [[`Date_${src}_Parsee`, 'date'], [`Controle_Date_${src}`, 'text']] })];
C.datesSteps = () => [st('Source', 'ref', { of: 'q_dbl' })].concat(lire('Demande', ''), lire('Intervention', '1'), [
  st('Personnalisée ajoutée', 'custom', { col: 'Controle_Chronologie', type: 'text', src: F.chrono }),
  st('Personnalisée ajoutée1', 'custom', { col: 'A_Investiguer_Dates', type: 'bool', src: F.investDates })]);
C.dates = () => ({ id: 'q_dates', name: 'prep_Maintenance_Dates', m2: true, load: false, refresh: true, group: 'Maintenance', steps: C.datesSteps() });
/* 206 : atelier de l’ancien logiciel (8 lignes, 5 → 16 colonnes) */
Object.assign(F, {"nb": "if [Equipement_Brut] = null then\n    0\nelse\n    List.Count(\n        Text.Split([Equipement_Brut], \"|\")\n    )", "nom": "let\n    Parties =\n        if [Technicien_Brut] = null then\n            {}\n        else\n            List.Transform(\n                Text.Split([Technicien_Brut], \",\"),\n                Text.Trim\n            ),\n    Conforme =\n        List.Count(Parties) = 2\n        and Parties{0} <> \"\"\n        and Parties{1} <> \"\"\nin\n    if Conforme then Parties{0} else null", "aff": "if\n    [Nom_Extrait] = null\n    or [Prenom_Extrait] = null\nthen\n    null\nelse\n    Text.Combine(\n        {\n            [Prenom_Extrait],\n            [Nom_Extrait]\n        },\n        \" \"\n    )", "ctlE": "if [Nb_Elements_Equipement] > 3 then\n    \"Élément supplémentaire\"\nelse if\n    [Nb_Elements_Equipement] < 3\n    or [Attraction_Extraite] = null\n    or [Zone_Extraite] = null\n    or [Type_Extrait] = null\nthen\n    \"Incomplet\"\nelse\n    \"Conforme\"", "ctlT": "if [Nom_Extrait] <> null and [Prenom_Extrait] <> null then\n    \"Conforme\"\nelse if\n    [Technicien_Brut] = null\n    or not Text.Contains([Technicien_Brut], \",\")\nthen\n    \"Séparateur absent\"\nelse\n    \"Structure à confirmer\"", "rev": "[Controle_Equipement] <> \"Conforme\"\nor [Controle_Technicien] <> \"Conforme\"", "recon": "if [Controle_Equipement] <> \"Conforme\" then\n    null\nelse\n    Text.Combine(\n        {\n            [Attraction_Extraite],\n            [Zone_Extraite],\n            [Type_Extrait]\n        },\n        \" | \"\n    ) = Text.Trim([Equipement_Brut])", "prenom": "let\n    Parties =\n        if [Technicien_Brut] = null then\n            {}\n        else\n            List.Transform(\n                Text.Split([Technicien_Brut], \",\"),\n                Text.Trim\n            ),\n    Conforme =\n        List.Count(Parties) = 2\n        and Parties{0} <> \"\"\n        and Parties{1} <> \"\"\nin\n    if Conforme then Parties{1} else null"});
const A206 = ['ID_Ligne', 'Equipement_Brut', 'Technicien_Brut', 'Reference_Brute', 'Commentaire'], CP = 'Equipement_Brut - Copier';
C.a206b = () => ({ id: 'q_a206b', name: 'atelier_M206_Brut', m2: true, load: false, refresh: true, steps: [st('Source', 'csv', { file: 'Maintenance_Wonderland_Colonnes_M206.csv', delim: ';', enc: 65001, columns: 5 }),
  st('En-têtes promus', 'promote', { auto: true }), st('Type modifié', 'type', { auto: true, changes: A206.map(c => [c, 'text']) })] });
C.a206cSteps = () => [st('Source', 'ref', { of: 'q_a206b' }),
  st('Personnalisée ajoutée', 'custom', { col: 'Nb_Elements_Equipement', type: 'int', src: F.nb }),
  st('Colonne dupliquée', 'dup', { col: 'Equipement_Brut', as: CP }),
  st('Fractionner la colonne par délimiteur', 'split', { col: CP, delim: '|', at: 'each', into: 'cols', n: 4 }),
  st('Type modifié', 'type', { auto: true, changes: [1, 2, 3, 4].map(i => [CP + '.' + i, 'text']) }),
  st('Colonnes renommées', 'rename', { pairs: [[CP + '.1', 'Attraction_Extraite'], [CP + '.2', 'Zone_Extraite'], [CP + '.3', 'Type_Extrait'], [CP + '.4', 'Complement_Equipement']] }),
  st('Texte découpé', 'fmt', { fn: 'trim', cols: ['Attraction_Extraite', 'Zone_Extraite', 'Type_Extrait', 'Complement_Equipement'] }),
  st('Personnalisée ajoutée1', 'custom', { col: 'Nom_Extrait', type: 'text', src: F.nom }),
  st('Personnalisée ajoutée2', 'custom', { col: 'Prenom_Extrait', type: 'text', src: F.prenom }),
  st('Personnalisée ajoutée3', 'custom', { col: 'Technicien_Affichage', type: 'text', src: F.aff }),
  st('Personnalisée ajoutée4', 'custom', { col: 'Controle_Equipement', type: 'text', src: F.ctlE }),
  st('Personnalisée ajoutée5', 'custom', { col: 'Controle_Technicien', type: 'text', src: F.ctlT }),
  st('Personnalisée ajoutée6', 'custom', { col: 'A_Revoir', type: 'bool', src: F.rev })];
C.a206c = () => ({ id: 'q_a206c', name: 'atelier_M206_Colonnes', m2: true, load: false, refresh: true, steps: C.a206cSteps() });
/* 207 : libellés normalisés par une fonction à référentiels */
Object.assign(F, {"norm1": "(Valeur as any, Champ as text) as nullable text =>\nlet\n    // Libellés officiels, par champ\n    Referentiels = [\n        Attraction = [\n            dragon = \"Dragon\",\n            pirates = \"Pirates\",\n            #\"wonder wheel\" = \"Wonder Wheel\",\n            #\"sky tower\" = \"Sky Tower\"\n        ],\n        Statut = [\n            terminee = \"Terminée\",\n            #\"terminée\" = \"Terminée\",\n            planifiee = \"Planifiée\",\n            #\"planifiée\" = \"Planifiée\"\n        ],\n        Type = [\n            preventive = \"Préventive\",\n            #\"préventive\" = \"Préventive\",\n            corrective = \"Corrective\",\n            inspection = \"Inspection\"\n        ]\n    ],\n\n    Referentiel = Record.Field(Referentiels, Champ),\n\n    // Clé de comparaison : nettoyée, sans espaces aux extrémités, en minuscules\n    Cle =\n        if Valeur = null then\n            null\n        else\n            Text.Lower(\n                Text.Trim(Text.Clean(Text.From(Valeur))),\n                \"fr-FR\"\n            )\nin\n    if Cle = null or Cle = \"\" then\n        null\n    else if Record.HasFields(Referentiel, Cle) then\n        Record.Field(Referentiel, Cle)\n    else\n        Text.From(Valeur)", "norm2": "(Valeur as any, Champ as text) as nullable text =>\nlet\n    // Libellés officiels, par champ\n    Referentiels = [\n        Attraction = [\n            dragon = \"Dragon\",\n            pirates = \"Pirates\",\n            #\"wonder wheel\" = \"Wonder Wheel\",\n            #\"sky tower\" = \"Sky Tower\"\n        ],\n        Statut = [\n            terminee = \"Terminée\",\n            #\"terminée\" = \"Terminée\",\n            planifiee = \"Planifiée\",\n            #\"planifiée\" = \"Planifiée\"\n        ],\n        Type = [\n            preventive = \"Préventive\",\n            #\"préventive\" = \"Préventive\",\n            corrective = \"Corrective\",\n            // NOM-M207-01, pièce pédagogique :\n            // dans cet export, Correctif = Corrective\n            correctif = \"Corrective\",\n            inspection = \"Inspection\"\n        ]\n    ],\n\n    Referentiel = Record.Field(Referentiels, Champ),\n\n    // Clé de comparaison : nettoyée, sans espaces aux extrémités, en minuscules\n    Cle =\n        if Valeur = null then\n            null\n        else\n            Text.Lower(\n                Text.Trim(Text.Clean(Text.From(Valeur))),\n                \"fr-FR\"\n            )\nin\n    if Cle = null or Cle = \"\" then\n        null\n    else if Record.HasFields(Referentiel, Cle) then\n        Record.Field(Referentiel, Cle)\n    else\n        Text.From(Valeur)", "ctlNorm": "let\n    Attractions = {\"Dragon\", \"Pirates\", \"Wonder Wheel\", \"Sky Tower\"},\n    Statuts = {\"Terminée\", \"Planifiée\"},\n    Types = {\"Préventive\", \"Corrective\", \"Inspection\"},\n\n    Absente =\n        [Attraction_Normalisee] = null\n        or [Statut_Normalise] = null\n        or [Type_Maintenance_Normalise] = null,\n\n    NonReconnue =\n        ([Attraction_Normalisee] <> null\n            and not List.Contains(Attractions, [Attraction_Normalisee]))\n        or ([Statut_Normalise] <> null\n            and not List.Contains(Statuts, [Statut_Normalise]))\n        or ([Type_Maintenance_Normalise] <> null\n            and not List.Contains(Types, [Type_Maintenance_Normalise])),\n\n    Modifiee =\n        [Attraction_Normalisee] <> [Attraction]\n        or [Statut_Normalise] <> [Statut]\n        or [Type_Maintenance_Normalise] <> [Type_Maintenance]\nin\n    if NonReconnue then\n        \"Valeur non reconnue\"\n    else if Absente then\n        \"Information absente\"\n    else if Modifiee then\n        \"Normalisation appliquée\"\n    else\n        \"Conforme sans changement\"", "test207": "let\n    Source = #table(\n        {\"Champ\", \"Valeur\"},\n        {\n            {\"Attraction\", \" DRAGON \"},\n            {\"Attraction\", \"Dragon Junior\"},\n            {\"Attraction\", null},\n            {\"Statut\", \"TERMINEE\"},\n            {\"Statut\", \"Non terminée\"},\n            {\"Type\", \"Correctif\"},\n            {\"Type\", \"Correctif urgent\"}\n        }\n    )\nin\n    Source", "cle": "if [Attraction] = null then\n    null\nelse\n    Text.Lower(\n        Text.Trim(\n            Text.Clean(\n                Text.From([Attraction])\n            )\n        ),\n        \"fr-FR\"\n    )"});
C.fnNorm = v => ({ id: 'q_fn207', name: 'fn_Normaliser', m2: true, blank: true, load: false, refresh: true, steps: [st('Source', 'mstep', { src: v === 1 ? F.norm1 : F.norm2 })] });
C.libSteps = () => [st('Source', 'ref', { of: 'q_dates' }),
  st('Personnalisée ajoutée', 'custom', { col: 'Attraction_Normalisee', type: 'text', src: 'fn_Normaliser([Attraction], "Attraction")' }),
  st('Personnalisée ajoutée1', 'custom', { col: 'Statut_Normalise', type: 'text', src: 'fn_Normaliser([Statut], "Statut")' }),
  st('Personnalisée ajoutée2', 'custom', { col: 'Type_Maintenance_Normalise', type: 'text', src: 'fn_Normaliser([Type_Maintenance], "Type")' }),
  st('Personnalisée ajoutée3', 'custom', { col: 'Controle_Normalisation', type: 'text', src: F.ctlNorm })];
C.lib = () => ({ id: 'q_lib', name: 'prep_Maintenance_Libelles', m2: true, load: false, refresh: true, group: 'Maintenance', steps: C.libSteps() });
/* 208 : douze exports mensuels 2025, empilés dans atelier_M208_Annuel (96 × 11) */
const MM = i => String(i).padStart(2, '0');
F.ctlLigne = 'Number.Abs(\n    [Cout_TTC] - [Cout_HT] * (1 + [TVA_Taux])\n) <= 0.01\nand Text.Start(\n    Date.ToText([Date_Intervention], "yyyy-MM-dd"),\n    7\n) = [Mois_Source]';
C.m208 = (i, stage, file) => {
  const f = file || `Maintenance_2025_${MM(i)}.csv`, n = /_11\.csv$/.test(f) ? 9 : 8;
  const steps = [st('Source', 'csv', { file: f, delim: ';', enc: 65001, columns: n }), st('En-têtes promus', 'promote', { auto: true })];
  if (stage >= 1 && i === 9) steps.push(st('Colonnes renommées', 'rename', { pairs: [['CoutHT', 'Cout_HT']] }));
  if (stage >= 2) steps.push(st('Personnalisée ajoutée', 'custom', { col: 'Fichier_Source', type: 'text', src: `"Maintenance_2025_${MM(i)}.csv"` }), st('Personnalisée ajoutée1', 'custom', { col: 'Mois_Source', type: 'text', src: `"2025-${MM(i)}"` }));
  return { id: file ? 'q_m208_' + MM(i) + 'x' : 'q_m208_' + MM(i), name: 'm208_' + MM(i), m2: true, load: false, refresh: true, group: 'Archives 2025', steps };
};
C.a208Types = () => [st('Type modifié', 'type', { changes: ['ID_Intervention', 'Attraction', 'Type_Maintenance', 'Note_Export', 'Fichier_Source', 'Mois_Source'].map(c => [c, 'text']) }),
  st('Type modifié avec paramètres régionaux', 'type', { loc: 'en-US', changes: [['Duree_Heures', 'dec'], ['TVA_Taux', 'dec'], ['Cout_HT', 'fixed'], ['Cout_TTC', 'fixed'], ['Date_Intervention', 'date']] })];
C.a208 = typed => ({ id: 'q_a208', name: 'atelier_M208_Annuel', m2: true, load: false, refresh: true, group: 'Archives 2025',
  steps: [st('Source', 'append', { base: false, with: Array.from({ length: 12 }, (_, k) => 'q_m208_' + MM(k + 1)) })].concat(typed ? C.a208Types() : []) });
/* 209 : interventions et référentiel d'équipements, rapprochés par une clé préparée */
const N209 = { ib: 'atelier_M209_Interventions_Brut', rb: 'atelier_M209_Referentiel_Brut', i: 'atelier_M209_Interventions', r: 'atelier_M209_Referentiel', d: 'atelier_M209_Diagnostic', e: 'atelier_M209_Enrichi', g: 'Atelier M209' };
F.cle209 = 'if [Code_Equipement] = null then\n    null\nelse\n    let\n        Texte =\n            Text.Upper(\n                Text.Trim(\n                    Text.Clean(\n                        Text.From([Code_Equipement])\n                    )\n                ),\n                "fr-FR"\n            )\n    in\n        if Texte = "" then null else Texte';
F.nb209 = 'Table.RowCount([Correspondances])';
F.statut209 = 'if [Cle_Equipement] = null then\n    "Clé absente"\nelse if [Nb_Correspondances] = 0 then\n    "Code inconnu"\nelse if [Nb_Correspondances] = 1 then\n    "Correspondance unique"\nelse\n    "Référentiel ambigu"';
F.desc209 = 'if\n    [Cle_Equipement] <> null\n    and [Nb_Correspondances] = 1\nthen\n    let\n        Ligne = [Correspondances]{0}\n    in\n        [\n            Attraction = Ligne[Attraction],\n            Zone = Ligne[Zone],\n            Responsable = Ligne[Responsable]\n        ]\nelse\n    [\n        Attraction = null,\n        Zone = null,\n        Responsable = null\n    ]';
const q209 = (id, name, steps) => ({ id, name, m2: true, load: false, refresh: true, group: N209.g, steps });
C.ib209 = () => q209('q_ib209', N209.ib, [st('Source', 'csv', { file: 'M209_Interventions.csv', delim: ';', enc: 65001, columns: 5 }), st('En-têtes promus', 'promote', { auto: true })]);
C.rb209 = () => q209('q_rb209', N209.rb, [st('Source', 'csv', { file: 'M209_Referentiel_Equipements.csv', delim: ';', enc: 65001, columns: 4 }), st('En-têtes promus', 'promote', { auto: true })]);
C.i209 = stage => q209('q_i209', N209.i, [st('Source', 'ref', { of: 'q_ib209' }), st('Type modifié', 'type', { changes: [['ID_Intervention', 'text'], ['Code_Equipement', 'text']] }),
  st('Type modifié avec paramètres régionaux', 'type', { loc: 'en-US', changes: [['Date_Intervention', 'date', 'en-US'], ['Duree_Heures', 'dec', 'en-US'], ['Cout_HT', 'fixed', 'en-US']] })]
  .concat(stage >= 2 ? [st('Personnalisée ajoutée', 'custom', { col: 'Cle_Equipement', type: 'text', src: F.cle209 })] : []));
C.r209 = stage => q209('q_r209', N209.r, [st('Source', 'ref', { of: 'q_rb209' }), st('Type modifié', 'type', { changes: ['Code_Equipement', 'Attraction', 'Zone', 'Responsable'].map(c => [c, 'text']) })]
  .concat(stage >= 2 ? [st('Personnalisée ajoutée', 'custom', { col: 'Cle_Equipement', type: 'text', src: F.cle209 })] : []));
C.d209 = stage => q209('q_d209', N209.d, [st('Source', 'merge', { from: 'q_i209', with: 'q_r209', left: ['Cle_Equipement'], right: ['Cle_Equipement'], kind: 'leftouter', as: N209.r }),
  st('Colonnes renommées', 'rename', { pairs: [[N209.r, 'Correspondances']] })]
  .concat(stage >= 4 ? [st('Personnalisée ajoutée', 'custom', { col: 'Nb_Correspondances', type: 'int', src: F.nb209 })] : [], stage >= 5 ? [st('Personnalisée ajoutée1', 'custom', { col: 'Statut_Rapprochement', type: 'text', src: F.statut209 })] : []));
C.e209 = () => q209('q_e209', N209.e, [st('Source', 'ref', { of: 'q_d209' }), st('Personnalisée ajoutée', 'custom', { col: 'Description', type: 'any', src: F.desc209 }),
  st('Description développé', 'expand', { col: 'Description', fields: ['Attraction', 'Zone', 'Responsable'], prefix: false, record: true }),
  st('Colonnes supprimées', 'removeCols', { cols: ['Correspondances'] }),
  st('Type modifié', 'type', { changes: ['Attraction', 'Zone', 'Responsable'].map(c => [c, 'text']) })]);
const K2 = { C, F, st, put, grp, N209 };
/* Simule l'ajout d'une étape en fin de requête, sans rien modifier */
K2.simulate = (x, q, step) => {
  const eng = x.pbi.engine(); q.steps.push(Object.assign({ id: 'sim', name: '__sim' }, step)); eng.touch();
  let r; try { r = eng.run(q); } finally { q.steps.pop(); eng.touch(); }
  return r;
};

/* ───────── Lecture de l'état ───────── */
K2.P = x => x.pbi.P;
K2.eng = x => x.pbi.engine();
K2.q = (x, name) => (x.P || x.pbi.P).queries.find(q => q.name === name || q.id === name) || null;
K2.T = (x, name, upto) => { const q = K2.q(x, name); if (!q) return null; return x.pbi.engine().table(q, upto); };
K2.run = (x, name, upto) => { const q = K2.q(x, name); return q ? x.pbi.engine().run(q, upto) : {}; };
K2.names = q => (q ? q.steps.map(s => s.name) : []);
K2.cols = T => (T ? T.cols.map(c => c.n) : []);
K2.find = (T, col, v) => (T ? T.rows.find(r => r[col] === v) : null);
K2.opIdx = (q, op, pred) => q ? q.steps.findIndex(s => s.op === op && (!pred || pred(s))) : -1;
K2.isRef = (q, of) => !!(q && q.steps[0] && q.steps[0].op === 'ref' && q.steps[0].of === of);
K2.loaded = P => P.queries.filter(q => q.m2 && q.load !== false);
K2.qsel = (x, q) => `[data-q="qsel:${q.id}"]`;
K2.qmenu = (x, q) => `.q2-qd [data-q="qmenu:${q.id}"]`;
K2.shown = (x, name) => { const pb = x.pbi; if (!pb.q2El) return false; const q = pb.q2q(); return !!q && (q.name === name || q.id === name); };
/* Valeur affichée d'un nombre en français */
K2.n = v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/* Consignes types */
K2.stepTodo = (q, i, name) => [`Renomme l’étape « ${q.steps[i].name} » en ${name} : Étapes appliquées, touche ⋯ à droite de l’étape, puis Renommer.`, ['[data-q="steps"]', `[data-q="stm:${i}"]`, '.menu [data-k="rename"]', '.q2-rs']];
K2.colTodo = (col, to) => [`Renomme la colonne ${col} en ${to} : sélectionne-la, puis Transformer › Renommer.`, [`[data-q="hd:${col}"]`, '[data-q="tab:Transformer"]', '[data-q="cmd:rename"]', '.dlg input', '[data-d="ok"]']];
K2.showTodo = (x, name) => [`Affiche la requête ${name} : touche Requêtes en haut à gauche, puis son nom.`, ['[data-q="qd"]', K2.q(x, name) ? `[data-q="qsel:${K2.q(x, name).id}"]` : null]];
/* Sélecteur de fichiers : suit le dossier ouvert, puis donne les cibles pour atteindre un dossier et un fichier */
K2.dirWatch = x => {
  const s = { dir: null };
  s.on = { 'q2.dialog': p => { if (p.kind === 'open') s.dir = x.pbi.q2dir || 'Maintenance'; }, 'q2.dir': p => { s.dir = p.dir; } };
  s.nav = (want, file) => {
    const cur = s.dir === null ? (x.pbi.q2dir || 'Maintenance') : s.dir;
    if (cur === want) return [`[data-f="${file}"]`, '[data-d="open"]'];
    const w = want.split('/'), c = cur ? cur.split('/') : [];
    if (c.length < w.length && c.every((p, i) => p === w[i])) return [`[data-sub="${w[c.length]}"]`];
    return [`.q2-crumbs [data-dir="${w[0]}"]`];
  };
  return s;
};
/* Renommage d'étape : seulement la cible, et exactement le nom attendu */
K2.renameRule = (x, p, targets) => {
  const want = targets.find(t => t.step === p.step);
  if (!want) return x.oops('', 'Garde le nom de cette étape.');
  if (p.name !== want.name) return x.oops('', `Écris exactement ${want.name}.`);
  return true;
};
/* Import CSV guidé pas à pas : origine, délimiteur, détection des types, puis OK */
K2.csvTodo = (x, want = {}) => {
  const w = Object.assign({ enc: 65001, delim: ';', detect: 'none' }, want), c = x.pbi.q2cst || {};
  if (c.enc !== w.enc) return ['Origine du fichier : 65001 : Unicode (UTF-8).', ['[data-x="enc"]', `.menu [data-k="${w.enc}"]`]];
  if (c.delim !== w.delim) return ['Délimiteur : Point-virgule.', ['[data-x="delim"]', `.menu [data-k="${w.delim}"]`]];
  if (c.detect !== w.detect) return ['Détection du type de données : Ne pas détecter.', ['[data-x="detect"]', `.menu [data-k="${w.detect}"]`]];
  return ['Valide avec OK.', ['[data-d="ok"]']];
};
/* Regrouper par, pas à pas. want = { col, tab, keys:[…], aggs:[{ as, op, col }] } */
const AGGN = { count: 'Nombre de lignes', countd: 'Nombre de lignes distinctes', sum: 'Somme', avg: 'Moyenne', min: 'Minimum', max: 'Maximum', all: 'Toutes les lignes' };
K2.groupTodo = (x, want) => {
  const pbi = x.pbi, tab = want.tab || 'Transformer', sel = (pbi.q2 && pbi.q2.sel) || [];
  if (pbi.dlgKind !== 'q2group') {
    if (want.col && !(sel.length === 1 && sel[0] === want.col)) return [`Touche l’en-tête de ${want.col}.`, [`[data-q="hd:${want.col}"]`]];
    return [`${tab} › Regrouper par.`, [`[data-q="tab:${tab}"]`, '[data-q="cmd:group"]']];
  }
  const g = pbi.q2gst || { keys: [], aggs: [] }, adv = want.keys.length > 1 || want.aggs.length > 1;
  if (adv && !g.adv) return ['Choisis Avancé.', ['input[name="gm"][value="a"]']];
  for (let i = 0; i < want.keys.length; i++) {
    if (g.keys.length <= i) return [`Ajouter un regroupement, puis ${want.keys[i]}.`, ['.q2-gk .chipb']];
    if (g.keys[i] !== want.keys[i]) return [`Regrouper par : ${want.keys[i]}.`, ['.q2-gk .sel-box']];
  }
  for (let i = 0; i < want.aggs.length; i++) {
    const w = want.aggs[i], a = g.aggs[i];
    if (!a) return ['Ajouter une agrégation.', ['.q2-ga .chipb']];
    if ((a.as || '').trim() !== w.as) return [`Nouveau nom de colonne : ${w.as}.`, ['.q2-agg input']];
    if (a.op !== w.op) return [`Opération : ${AGGN[w.op] || w.op}.`, ['.q2-agg [data-k="op"]']];
    if (w.col && a.col !== w.col) return [`Colonne : ${w.col}.`, ['.q2-agg [data-k="col"]']];
  }
  return ['Valide avec OK.', ['[data-d="ok"]']];
};
/* Ouvre l'éditeur sur une requête (reprise d'exercice) */
K2.open = (x, cur) => {
  const pbi = x.pbi; x.app('pbi'); pbi.closeDialog(true);
  const q = cur ? K2.q(x, cur) : null;
  if (!pbi.q2El) pbi.openQ2({ cur: q ? q.id : undefined });
  else if (q && pbi.q2.cur !== q.id) { pbi.q2select(q.id); pbi.q2render(); }
};

/* ───────── Boucle d'exercice ───────── */
const Q2EV = ['q2.adv', 'q2.cancel', 'q2.cell', 'q2.cmd', 'q2.col', 'q2.dialog', 'q2.drawer', 'q2.gear', 'q2.locale', 'q2.menu', 'q2.nocol', 'q2.paste', 'q2.query',
  'q2.refresh', 'q2.scope', 'q2.step', 'q2.steps', 'q2.tab', 'q2.view', 'q2.appendPick', 'q2.csvOk', 'q2.csvOpt', 'q2.deps', 'q2.depsClose', 'q2.depsNode', 'q2.dir',
  'q2.file', 'q2.filePick', 'q2.filterOpen', 'q2.formula', 'q2.loadMore', 'q2.mergeFuzzy', 'q2.mergeKey', 'q2.mergeKind', 'q2.mergeTable', 'q2.navCheck', 'q2.navFocus', 'q2.navOk'];
const REPORT_OK = ['tab', 'view', 'pane', 'page', 'visual', 'canvas', 'table.select', 'field', 'nav.page', 'file.menu', 'dialog.cancel', 'clip', 'col.select', 'row',
  'model.table', 'vis.focus', 'table.rowsel', 'chart.point', 'slicer', 'tab.start', 'page.renameStart', 'multi.mode', 'view.opt'];
const STEP_KINDS = ['add', 'edit', 'del', 'delEnd', 'moveStep', 'renameStep', 'code', 'type', 'renameCol', 'custom', 'merge', 'append', 'invoke'];
/* Garde commune : rapport du module 1, requêtes protégées, chargement */
K2.baseTry = (x, p, o) => {
  if (p.legacy) return x.oops('', 'Cette requête alimente le rapport du module 1 : elle reste intacte.');
  const q = p.target || p.q, qn = q && q.name;
  if (STEP_KINDS.includes(p.kind)) {
    const ok = o.edit && (o.edit === '*' || o.edit.includes(qn) || (o.editNew && o._new && o._new.includes(q && q.id)));
    if (!ok) return x.oops(o.wrongQuery || '', o.edit && o.edit !== '*' ? `Cette transformation se fait dans ${o.edit[0]}.` : 'Rien ne doit changer dans cette requête pour l’instant.');
    if (p.kind === 'add' && o.ops && !o.ops.includes(p.op)) return x.oops(o.offOp || '', o.offOpMsg || 'Cette transformation n’est pas demandée ici.');
    return;
  }
  if (p.kind === 'load') { if (p.on) return x.oops(o.loadErr || 'Chargement', 'Cette préparation ne doit pas devenir une table du modèle.'); if (o.load) return; return; }
  if (p.kind === 'delQuery') { if (o.delQuery && o.delQuery(p) !== false) return; return x.oops(o.delErr || '', `Garde ${qn} : la suite de la préparation en dépend.`); }
  if (p.kind === 'renameQuery') { if (o.rename && o.rename(p) !== false) return; return x.oops(o.renameErr || '', 'Garde le nom de cette requête.'); }
  if (p.kind === 'newQuery') { if (o.newQuery && o.newQuery(p) !== false) return; return x.oops(o.newErr || '', 'Aucune nouvelle requête n’est nécessaire ici.'); }
  if (p.kind === 'refreshFlag') return x.oops('', 'Garde l’actualisation telle qu’elle est.');
};
K2.work = async function (x, o) {
  const pbi = x.pbi, P = () => pbi.P;
  o._new = [];
  /* Un éditeur détaché par un nouveau rendu du rapport compte comme fermé */
  if (pbi.q2El && !pbi.q2El.isConnected) pbi.closeQ2(true);
  /* Power Query s'ouvre directement quand l'étape se fait dans l'éditeur */
  if ((o.open !== undefined ? o.open : o.editor !== false) && !pbi.q2El) K2.open(x, typeof o.cur === 'function' ? o.cur() : o.cur);
  const evalNow = () => {
    if (o.editor !== false && !pbi.q2El) { x.todo('Rouvre l’éditeur Power Query : Accueil, Transformer les données.'); x.guide(['[data-a="tab:Accueil"]', '[data-a="cmd:transform"]']); return; }
    const r = o.next();
    if (r === true) return true;
    if (!r) return;
    x.todo(r[0]); x.guide(r[1] || null);
  };
  if (evalNow() === true) { x.guide(); return; }
  const H = {
    'q2.try': p => {
      if (o.tries) { const r = o.tries(p); if (r === false) return false; if (r === true) return; }
      return K2.baseTry(x, p, o);
    },
    'q2.done': p => {
      if (p.kind === 'newQuery' && p.query) o._new.push(p.query.id);
      if (o.done) { const r = o.done(p); if (r === false) return false; }
      return evalNow();
    },
    'q2.apply': p => {
      if (!o.apply) return x.oops(o.applyErr || '', 'Pas encore : la préparation se poursuit dans l’éditeur.');
      const bad = K2.loaded(P());
      if (bad.length) return x.oops(o.loadErr || 'Chargement', `${bad[0].name} deviendrait une nouvelle table du modèle : désactive d’abord son chargement.`);
      pbi.q2applyModel(); pbi.closeQ2(); pbi.render(); o.applied = true;
      if (typeof o.apply === 'function') o.apply();
      return evalNow();
    },
    'q2.close': p => {
      if (o.close === false) return x.oops('', 'Garde l’éditeur Power Query ouvert pour cette étape.');
      pbi.closeQ2(); return evalNow();
    },
    cmd: c => {
      if (c === 'transform') { const q = o.cur ? K2.q(x, typeof o.cur === 'function' ? o.cur() : o.cur) : null; pbi.openQ2({ cur: q ? q.id : undefined }); return evalNow(); }
      if (o.cmd) { const r = o.cmd(c); if (r !== undefined) return r; }
      return x.oops('', 'Le rapport Wonderland_Pilotage reste protégé : passe par Transformer les données.');
    },
    file: k => {
      if (k === 'back') return;
      if (k === 'saveas' && o.saveAs) { pbi.closeBackstage(); pbi.saveAs({ name: P().name || 'Wonderland_Pilotage' }); return; }
      if (k === 'save' && o.saveAs) { pbi.closeBackstage(); if (P().name !== o.saveAs) { pbi.saveAs({ name: P().name || 'Wonderland_Pilotage' }); return; } P().saved = true; P().dirty = false; pbi.render(); return evalNow(); }
      return x.oops(o.fileErr || '', o.saveAs ? 'Utilise Enregistrer sous pour créer la copie de travail.' : 'Pas d’enregistrement pour l’instant : la mission se poursuit.');
    },
    save: () => {
      if (!o.saveAs) return x.oops('', 'Pas d’enregistrement pour l’instant : la mission se poursuit.');
      if (P().name !== o.saveAs) { pbi.saveAs({ name: P().name || 'Wonderland_Pilotage' }); return; }
      P().saved = true; P().dirty = false; pbi.render(); return evalNow();
    },
    saveas: ({ name, ext }) => {
      if (!o.saveAs) return x.oops('', 'Pas d’enregistrement pour l’instant.');
      if (ext !== 'pbix') return x.oops(o.extErr || '', 'Garde le format Fichiers Power BI (*.pbix).');
      if (name === 'Wonderland_Pilotage') return x.oops(o.overErr || '', `Le checkpoint 110 doit rester séparé : enregistre la copie sous ${o.saveAs}.`);
      if (name !== o.saveAs) return x.oops(o.nameErr || '', `Écris exactement ${o.saveAs}.`);
      pbi.closeDialog(); P().name = name; P().saved = true; P().dirty = false; pbi.render();
      return evalNow();
    },
    'dialog.cancel': () => { pbi.closeDialog(); }
  };
  for (const ev of Q2EV) H[ev] = H[ev] || (() => evalNow());
  for (const k in (o.on || {})) {
    const f = o.on[k], base = H[k];
    H[k] = p => { const r = f(p); if (r === false || r === true) return r; if (base) return base(p); return evalNow(); };
  }
  H['*'] = ({ type }) => {
    if (type.startsWith('q2.')) { evalNow(); tick(); return; }
    if (REPORT_OK.includes(type)) { tick(); return; }
    return x.oops('', 'Le rapport Wonderland_Pilotage reste protégé pendant ce module.');
  };
  /* Certains événements partent avant que l'état ne change : on revérifie juste après */
  let live = true, tickT = 0;
  const tick = () => { clearTimeout(tickT); tickT = setTimeout(() => { if (live) act('k2.tick', null); }, 40); };
  for (const k of Object.keys(H)) {
    if (k === '*') continue;
    const f = H[k];
    H[k] = p => { const r = f(p); if (r !== true && r !== false) tick(); return r; };
  }
  H['k2.tick'] = () => evalNow();
  try { await x.wait(H); } finally { live = false; clearTimeout(tickT); }
  x.guide();
};

/* ───────── Nouvelle branche de préparation : Référence, nom, chargement, dépendances ───────── */
K2.branch = async function (x, o) {
  const pbi = x.pbi, P = () => pbi.P, src = () => K2.q(x, o.src);
  const S = () => P().queries.find(q => q.m2 && q !== src() && K2.isRef(q, src().id) && (q.name === o.name || !P().queries.some(z => z.name === o.name)));
  const e = o.errs || {};
  let deps = !o.deps, depsOpen = false;
  await K2.work(x, {
    cur: o.src, editor: false, open: true, wrongQuery: e.edit || '',
    next: () => {
      const s = S();
      if (!pbi.q2El) return ['Ouvre l’éditeur Power Query : Accueil, Transformer les données.', ['[data-a="tab:Accueil"]', '[data-a="cmd:transform"]']];
      if (!s) return [`Volet Requêtes : touche ⋯ à côté de ${o.src}, puis Référence.`, ['[data-q="qd"]', K2.qmenu(x, src()), '.menu [data-k="ref"]']];
      if (s.name !== o.name) return [`Renomme la nouvelle requête ${o.name} : touche son nom en haut, puis Renommer.`, ['.q2-qname', '.menu [data-k="ren"]', '.dlg input', '[data-d="ok"]']];
      if (s.load !== false) return ['Désactive son chargement : touche son nom, puis Activer le chargement.', ['.q2-qname', '.menu [data-k="load"]']];
      if (!deps && depsOpen) return ['Observe le schéma, puis ferme-le.', ['[data-d="close"]']];
      if (!deps) return ['Vérifie ses dépendances : Affichage › Dépendances de requête.', ['[data-q="tab:Affichage"]', '[data-q="cmd:deps"]']];
      return true;
    },
    tries: p => {
      const s = S(), b = src();
      if (p.kind === 'newQuery') {
        if (s) return x.oops('', 'La référence existe déjà : poursuis avec elle.');
        if (p.how === 'ref') { if (p.src === b) return true; return x.oops(p.src && !p.src.m2 ? (e.legacy || '') : (e.wrongSrc && p.src ? e.wrongSrc(p.src) : '') || '', `Crée la référence à partir de ${o.src}.`); }
        if (p.how === 'dup') return x.oops(e.dup || '', 'Crée une référence : elle garde la dépendance à la préparation précédente.');
        if (p.how === 'excel' || p.how === 'csv') return x.oops(e.imp || '', 'Réutilise la chaîne de préparation existante.');
        return x.oops('', `Crée une référence de ${o.src}.`);
      }
      if (p.kind === 'renameQuery') {
        if (p.target !== s) return x.oops(!p.target.m2 ? (e.legacyName || '') : (e.edit || ''), 'Garde le nom de cette requête.');
        return p.name === o.name ? true : x.oops(e.name || '', `Écris exactement ${o.name}.`);
      }
      if (p.kind === 'load') { if (p.target !== s) return x.oops('', 'Ne change pas le chargement de cette requête.'); return p.on ? x.oops(e.load || 'Chargement', 'Cette préparation ne doit pas devenir une table du modèle.') : true; }
      if (p.kind === 'delQuery') return x.oops(e.del || '', 'Garde cette requête : la chaîne de préparation en dépend.');
      if (p.kind === 'group' || p.kind === 'newGroup') return true;
      if (['add', 'edit', 'del', 'delEnd', 'moveStep', 'renameStep', 'code', 'type'].includes(p.kind)) {
        const q = p.target || p.q;
        if (q && q.name === o.src) return x.oops(e.srcEdit || e.edit || '', `${o.src} reste le témoin de départ : ne la modifie pas.`);
        if (q && q !== s) return x.oops(e.edit || '', 'Ne modifie pas les préparations précédentes.');
        return x.oops('', 'Aucune transformation pour l’instant : règle d’abord la nouvelle requête.');
      }
    },
    on: { 'q2.deps': () => { depsOpen = true; }, 'q2.depsClose': () => { if (depsOpen) deps = true; } }
  });
  if (pbi.dlg) pbi.closeDialog();
};

/* ───────── Colonne personnalisée validée sur son résultat ───────── */
const TYN = { text: 'Texte', bool: 'Vrai/Faux', int: 'Nombre entier', dec: 'Nombre décimal', fixed: 'Nombre décimal fixe', date: 'Date', any: 'Tout' };
/* Colonne personnalisée, pas à pas : ruban, nom, type, formule collée, OK */
K2.customTodo = (x, col, type) => {
  const pbi = x.pbi;
  if (pbi.dlgKind !== 'q2custom') return ['Ajouter une colonne › Colonne personnalisée.', ['[data-q="tab:Ajouter une colonne"]', '[data-q="cmd:custom"]']];
  const c = pbi.q2cust || {};
  if (c.name !== col) return [`Nouveau nom de colonne : ${col}.`, ['[data-x="n"]']];
  if (c.type !== type) return [`Type de données : ${TYN[type]}.`, ['[data-x="t"]', `.menu [data-k="${type}"]`]];
  if (!c.src) return ['Touche Coller pour placer la formule.', ['[data-x="paste"]']];
  return ['Valide avec OK.', ['[data-d="ok"]']];
};
K2.custom = async function (x, o) {
  const pbi = x.pbi, Q = () => K2.q(x, o.q);
  const has = () => { const T = K2.T(x, o.q); return K2.cols(T).includes(o.col); };
  if (!has()) await x.formula(o.src, `Formule · ${o.col}`);
  await K2.work(x, Object.assign({
    cur: o.q, edit: [o.q], ops: ['custom'],
    next: () => {
      if (!K2.shown(x, o.q)) return K2.showTodo(x, o.q);
      if (!has()) return K2.customTodo(x, o.col, o.type);
      return true;
    },
    tries: p => {
      if (o.tries) { const r = o.tries(p); if (r === false || r === true) return r; }
      if (p.kind === 'custom' && p.syntax === false) return x.oops('', 'La formule contient une erreur de syntaxe : touche Effacer, puis Coller.');
      if (p.kind === 'add' && p.op === 'custom') {
        if (p.step.col !== o.col) return x.oops('', `Nomme la colonne exactement ${o.col}.`);
        if (p.step.type !== o.type) return x.oops(o.typeErr || '', `Choisis le type ${TYN[o.type]}.`);
        const r = K2.simulate(x, Q(), p.step);
        if (r.error) return x.oops('', 'Cette formule produit une erreur : touche Effacer, puis Coller.');
        if (r.table.rows.some(row => row[o.col] instanceof PQE.MErr)) return x.oops('', 'Certaines lignes produisent une erreur : vérifie la formule collée.');
        if (o.check) { const bad = o.check(r.table); if (bad !== true) return x.oops(bad[0] || '', bad[1]); }
        return true;
      }
    }
  }, o.work || {}));
};

/* Profil d'une colonne (ensemble des données au-delà de 1 000 lignes) */
K2.prof = (x, qn, col, todo) => K2.work(x, {
  cur: qn,
  next: () => {
    const s = x.pbi.q2, T = K2.T(x, qn);
    if (!K2.shown(x, qn)) return K2.showTodo(x, qn);
    if (s.qd) return ['Ferme le volet Requêtes pour retrouver l’aperçu.', ['[data-q="qdx"]']];
    if (s.scope !== 'all' && T && T.rows.length > 1000) return ['Barre d’état : profilage sur l’ensemble des données.', ['[data-q="scope"]', '.menu [data-k="all"]']];
    if (!(s.prof && s.sel.length === 1 && s.sel[0] === col)) return [todo || `Affiche le profil de ${col} : sélectionne la colonne, puis Affichage › Profil de colonne.`, s.prof ? [`[data-q="hd:${col}"]`] : [`[data-q="hd:${col}"]`, '[data-q="tab:Affichage"]', '[data-q="cmd:prof"]']];
    return true;
  },
  on: { 'q2.scope': p => { const T = K2.T(x, qn); if (p.scope === 'top' && T && T.rows.length > 1000) return x.oops('', 'Garde l’ensemble des données : les 1 000 premières lignes ne couvrent pas tout.'); } }
});
/* Conversion de types guidée, groupe par groupe : [[colonnes], type, paramètres régionaux éventuels].
   La consigne suit l'état réel de la sélection ; après chaque conversion, la sélection repart à zéro. */
K2.types = (x, o) => {
  const pbi = x.pbi, LOC = PQE.LOCALES;
  const ty = c => { const T = K2.T(x, o.q); const z = T && T.cols.find(k => k.n === c); return z ? z.t : null; };
  const hd = c => `[data-q="hd:${c}"]`, MULTI = ['[data-q="tab:Accueil"]', '[data-q="cmd:multi"]'];
  const want = {}; o.groups.forEach(([cols, t, loc]) => cols.forEach(c => { want[c] = [t, loc || null]; }));
  const pick = (cols, multi, sel) => {
    if (cols.length === 1) {
      const c = cols[0];
      if (sel.length === 1 && sel[0] === c) return { say: `Touche l’en-tête de ${c}`, t: [] };
      if (multi) return { say: `Désactive la sélection multiple (Accueil), puis touche ${c}`, t: MULTI.concat([hd(c)]) };
      return { say: `Touche l’en-tête de ${c}`, t: [hd(c)] };
    }
    const extra = sel.filter(c => !cols.includes(c)), miss = cols.filter(c => !(multi && sel.includes(c)));
    return { say: `${multi ? 'En sélection multiple' : 'Active la sélection multiple (Accueil)'}, touche ${cols.join(', ')}${extra.length ? `, et retire ${extra.join(', ')} de la sélection` : ''}`, t: (multi ? [] : MULTI).concat(extra.map(hd), miss.map(hd)) };
  };
  return K2.work(x, Object.assign({
    cur: o.q, edit: [o.q], ops: [],
    next: () => {
      if (!K2.shown(x, o.q)) return K2.showTodo(x, o.q);
      const multi = pbi.q2.multi, sel = pbi.q2.sel || [];
      for (const [cols, t, loc] of o.groups) {
        const left = cols.filter(c => ty(c) !== t);
        if (!left.length) continue;
        const k = pick(left, multi, sel), ribbon = ['[data-q="tab:Transformer"]', '[data-q="cmd:type"]'];
        if (pbi.dlgKind === 'q2locale' && loc) {
          const d = pbi.q2lst || {};
          if (d.type !== t) return [`Type de données : ${TYN[t]}.`, ['[data-x="t"]', `.menu [data-k="${t}"]`]];
          if (d.loc !== loc) return [`Paramètres régionaux : ${LOC[loc]}.`, ['[data-x="l"]', `.menu [data-k="${loc}"]`]];
          return ['Valide avec OK.', ['[data-d="ok"]']];
        }
        if (k.t.length) return [`${k.say}.`, k.t];
        if (!loc) return [`Transformer › Type de données › ${TYN[t]}.`, ribbon.concat([`.menu [data-k="${t}"]`])];
        return ['Transformer › Type de données › Utiliser les paramètres régionaux…', ribbon.concat(['.menu [data-k="locale"]'])];
      }
      return true;
    },
    tries: p => {
      if (o.tries) { const r = o.tries(p); if (r === false || r === true) return r; }
      if (p.kind !== 'type') return;
      for (const c of p.cols) {
        const w = want[c];
        if (!w) return x.oops('', `${c} garde son type pour l’instant.`);
        if (w[0] !== p.type) return x.oops('', `${c} attend le type ${TYN[w[0]]}.`);
        if (w[1] && !p.loc) return x.oops(o.implicitErr || '', `Précise la convention du fichier : Utiliser les paramètres régionaux…, ${LOC[w[1]]}.`);
        if (w[1] && p.loc !== w[1]) return x.oops('', `Le fichier utilise le point décimal et les dates ISO : ${LOC[w[1]]}.`);
      }
      return true;
    },
    done: p => { if (p.kind === 'type' && pbi.q2) { pbi.q2.sel = []; pbi.q2.multi = false; if (pbi.q2El) pbi.q2render(); } }
  }, o.work || {}));
};
/* Vue temporaire : référence non chargée, éventuellement filtrée */
K2.tmp = (x, o) => {
  const P = () => x.pbi.P, T1 = () => P().queries.find(q => q[o.flag] === o.kind);
  return K2.work(x, Object.assign({
    cur: o.src, edit: [], editNew: true, ops: o.ops || ['filter'],
    next: () => {
      const t = T1(), src = K2.q(x, o.src);
      if (!t) return [`Volet Requêtes : ⋯ à côté de ${o.src}, puis Référence.`, ['[data-q="qd"]', K2.qmenu(x, src), '.menu [data-k="ref"]']];
      if (t.load !== false) return ['Désactive le chargement de cette vue temporaire.', ['.q2-qname', '.menu [data-k="load"]']];
      if (!K2.shown(x, t.name)) return K2.showTodo(x, t.name);
      return o.next ? o.next(t) : true;
    },
    tries: p => {
      const t = T1();
      if (p.kind === 'newQuery') { if (t) return x.oops('', 'La vue temporaire existe déjà.'); if (p.how !== 'ref' || p.src !== K2.q(x, o.src)) return x.oops('', `Crée une référence de ${o.src}.`); p.query[o.flag] = o.kind; return true; }
      if (p.kind === 'load') { if (p.on) return x.oops(o.loadErr || '', 'Cette vue temporaire reste non chargée.'); return p.target === t ? true : x.oops('', 'Règle seulement la vue temporaire.'); }
      if (p.kind === 'renameQuery') return p.target === t ? true : x.oops('', 'Garde le nom de cette requête.');
      if ((p.kind === 'add' || p.kind === 'edit') && (!t || p.q !== t)) return x.oops(o.mainErr || '', t ? 'La préparation principale ne change pas : travaille dans la vue temporaire.' : `Crée d’abord la vue temporaire : une référence de ${o.src}.`);
      if (o.tries) return o.tries(p, t);
    }
  }, o.work || {}));
};
/* Requête vide + Éditeur avancé (code collé tel quel), renommée, chargement désactivé si ce n'est pas une fonction */
const normCode = s => String(s || '').replace(/\s+/g, '');
K2.blank = (x, o) => {
  const pbi = x.pbi, P = () => pbi.P, Q = () => P().queries.find(q => q.m2 && q[o.flag] === o.kind);
  const isFn = q => pbi.engine().value(q) instanceof PQE.MFn;
  return K2.work(x, Object.assign({
    cur: o.cur, edit: [], editNew: true,
    next: () => {
      const f = Q();
      if (!f) return ['Crée une requête vide : Accueil › Nouvelle source › Requête vide.', ['[data-q="tab:Accueil"]', '[data-q="cmd:newsource"]', '.menu [data-k="blank"]']];
      if (!f.codeOk) {
        if (pbi.dlgKind === 'q2adv') return [o.pasteTodo || 'Touche Coller, puis Terminé.', ['[data-x="paste"]', '[data-d="ok"]']];
        if (!K2.shown(x, f.name)) return K2.showTodo(x, f.name);
        return ['Ouvre l’éditeur avancé de la requête vide : Accueil › Éditeur avancé.', ['[data-q="tab:Accueil"]', '[data-q="cmd:adv"]']];
      }
      if (f.name !== o.name) { if (!K2.shown(x, f.name)) return K2.showTodo(x, f.name); return [`Renomme la requête ${o.name} : touche son nom en haut, puis Renommer.`, ['.q2-qname', '.menu [data-k="ren"]', '.dlg input', '[data-d="ok"]']]; }
      if (!isFn(f) && f.load !== false) { if (!K2.shown(x, f.name)) return K2.showTodo(x, f.name); return ['Désactive son chargement : touche son nom, puis Activer le chargement.', ['.q2-qname', '.menu [data-k="load"]']]; }
      return true;
    },
    tries: p => {
      const f = Q();
      if (p.kind === 'newQuery') { if (f) return x.oops('', 'La requête vide existe déjà : poursuis avec elle.'); if (p.how !== 'blank') return x.oops(o.newErr || '', 'Crée une requête vide : le code s’y colle entier.'); p.query[o.flag] = o.kind; return true; }
      if (p.kind === 'code') {
        if (p.target !== f) return x.oops(o.codeErr || '', 'Colle le code dans la requête vide.');
        if (p.syntax === false) return x.oops('', 'Le code contient une erreur : touche Coller pour reprendre le code fourni.');
        if (normCode(p.src) !== normCode(o.src)) return x.oops(o.diffErr || '', 'Touche Coller : le code doit être repris tel quel.');
        f.codeOk = true; return true;
      }
      if (p.kind === 'renameQuery') { if (p.target !== f) return x.oops('', 'Garde le nom de cette requête.'); return p.name === o.name ? true : x.oops('', `Écris exactement ${o.name}.`); }
      if (p.kind === 'load') { if (p.on) return x.oops(o.loadErr || '', 'Cette requête reste dans l’atelier Power Query.'); return p.target === f ? true : x.oops('', 'Règle seulement la nouvelle requête.'); }
      if (p.kind === 'delQuery' && p.target === f) return x.oops('', 'Garde cette requête : elle accueille le code.');
      if (o.tries) return o.tries(p, f);
    }
  }, o.work || {}));
};
/* ───────── Questions ───────── */
K2.ask = (x, q, opts) => x.ask(q, opts.map(o => typeof o === 'string' ? { t: o } : o));
K2.num = (x, q, fields, check, lbl) => x.inputs({ q, lbl, fields, check });

/* ───────── Contrôle du checkpoint 110 (rapport protégé) ───────── */
K2.check110 = P => {
  const vis = P.pages.reduce((a, p) => a + p.visuals.length, 0);
  const rows = id => { const t = P.tables.find(t => t.name === id || t.id === id); return t ? t.rows.length : 0; };
  const t = P.tables.map(t => t.name);
  return {
    tables: P.tables.length, pages: P.pages.length, objets: vis, relations: (P.relationships || []).length, mesures: (P.measures || []).length,
    ok: P.tables.length === 3 && P.pages.length === 3 && vis === 26 && !(P.relationships || []).length && !(P.measures || []).length,
    noms: t, rows
  };
};
K2.card110 = P => {
  const c = K2.check110(P);
  return `<div class="k2-check"><div><b>${c.tables}</b><span>tables</span></div><div><b>${c.pages}</b><span>pages</span></div><div><b>${c.objets}</b><span>objets</span></div><div><b>${c.relations}</b><span>relation</span></div><div><b>${c.mesures}</b><span>mesure DAX</span></div></div>`;
};

/* ───────── Exercice final de mission : chargement, Fermer et appliquer, copie de travail ───────── */
K2.final = async function (x, o) {
  const pbi = x.pbi, P = () => pbi.P;
  const w = Object.assign({ apply: true, saveAs: o.name, cur: o.cur, editor: false }, o.work || {});
  w.next = () => {
    if (o.pre) { const r = o.pre(); if (r !== true) return r; }
    const bad = K2.loaded(P());
    if (bad.length) {
      if (!pbi.q2El) return ['Ouvre Transformer les données pour vérifier les préparations.', ['[data-a="tab:Accueil"]', '[data-a="cmd:transform"]']];
      return [`Désactive le chargement de ${bad[0].name} : menu de la requête, Activer le chargement.`, ['[data-q="qd"]', K2.qmenu(x, bad[0]), '.menu [data-k="load"]']];
    }
    if (!w.applied) {
      if (!pbi.q2El) return ['Ouvre Transformer les données, puis valide avec Fermer et appliquer.', ['[data-a="tab:Accueil"]', '[data-a="cmd:transform"]']];
      if (pbi.q2.qd) return ['Ferme le volet Requêtes, puis valide avec Fermer et appliquer.', ['[data-q="qdx"]', '[data-q="tab:Accueil"]', '[data-q="cmd:apply"]', '.menu [data-k="apply"]']];
      return ['Valide la préparation avec Fermer et appliquer.', ['[data-q="tab:Accueil"]', '[data-q="cmd:apply"]', '.menu [data-k="apply"]']];
    }
    if (P().name !== o.name) return [`Enregistre une copie de travail sous ${o.name}.pbix : Fichier, Enregistrer sous.`, ['[data-a="file"]', '[data-b="saveas"]']];
    return true;
  };
  await K2.work(x, w);
};

/* ───────── Registre d'anomalies (mission 201, relu ensuite) ───────── */
K2.REG = [
  { id: 'R01', c: 'Structure', t: 'Titre, notes et ligne vide au-dessus des en-têtes', ids: [], m: 202, cert: true },
  { id: 'R02', c: 'Structure', t: 'Ligne COMMENTAIRE ATELIER au milieu des interventions', ids: [], m: 202, cert: true },
  { id: 'R03', c: 'Structure', t: 'Lignes TOTAL PROVISOIRE et FIN EXPORT en bas du fichier', ids: [], m: 202, cert: true },
  { id: 'R04', c: 'Absences', t: 'Technicien absent ou fait d’espaces', ids: ['M0012', 'M0400', 'M1090'], m: 203, cert: false },
  { id: 'R05', c: 'Absences', t: 'Attraction absente', ids: ['M0350'], m: 203, cert: false },
  { id: 'R06', c: 'Absences', t: 'Coût HT absent, N/A ou à confirmer', ids: ['M0025', 'M0450', 'M1050'], m: 203, cert: false },
  { id: 'R07', c: 'Répétitions', t: 'Identifiants présents deux fois', ids: ['M0899', 'M0949'], m: 204, cert: false },
  { id: 'R08', c: 'Dates', t: 'Dates impossibles (31/02, 29/02/2026)', ids: ['M0040', 'M1005'], m: 205, cert: true },
  { id: 'R09', c: 'Dates', t: 'Formats de date mélangés', ids: ['M0055', 'M0550'], m: 205, cert: true },
  { id: 'R10', c: 'Libellés', t: 'Écritures différentes d’un même libellé', ids: ['M0150', 'M0180', 'M0700'], m: 207, cert: true },
  { id: 'R11', c: 'Montants', t: 'Montants saisis en texte', ids: ['M0070', 'M0085'], m: 210, cert: true },
  { id: 'R12', c: 'Cohérence', t: 'Valeurs incohérentes à justifier : coût négatif, taux 20, TTC 9 999, durée négative ou nulle, statut Planifiée', ids: ['M0220', 'M0260', 'M0300', 'M0100', 'M0600', 'M0500'], m: 210, cert: false }
];

/* ───────── Petits composants ───────── */
/* Carte de constats chiffrés */
K2.facts = (items) => `<div class="k2-facts">${items.map(i => `<div><b>${esc(fr(String(i[0])))}</b><span>${esc(fr(i[1]))}</span></div>`).join('')}</div>`;
/* Planche de classement à deux choix par ligne, validée globalement. Émet k2.pick puis k2.check {values} */
K2.sorter = (spec) => {
  const el = h(`<div><div class="${spec.bare ? '' : 'board '}k2-sort">${spec.title ? `<h3>${esc(fr(spec.title))}</h3>` : ''}${spec.intro ? `<p>${esc(fr(spec.intro))}</p>` : ''}<div class="k2-rows"></div><button class="cta dark k2-go">${esc(spec.btn || 'Vérifier')}</button></div></div>`);
  const vals = {};
  const rows = $('.k2-rows', el);
  spec.rows.forEach(r => {
    const row = h(`<div class="k2-row" data-r="${r.id}"><div class="k2-t"><b>${esc(fr(r.t))}</b>${r.sub ? `<small>${esc(fr(r.sub))}</small>` : ''}</div><div class="seg k2-seg n${spec.options.length}">${spec.options.map(o => `<button data-v="${o[0]}">${esc(fr(o[1]))}</button>`).join('')}</div></div>`);
    $$('button', row).forEach(b => b.addEventListener('click', () => { vals[r.id] = b.dataset.v; $$('button', row).forEach(y => y.classList.toggle('on', y === b)); row.classList.remove('bad', 'ok'); act('k2.pick', { row: r.id, value: b.dataset.v }); }));
    rows.appendChild(row);
  });
  const go = $('.k2-go', el);
  go.addEventListener('click', () => { if (act('k2.check', { values: { ...vals } }) === 'no') shake(go); });
  const B = { el };
  B.mark = (bad) => $$('.k2-row', el).forEach(r => { r.classList.toggle('bad', bad.includes(r.dataset.r)); r.classList.toggle('ok', !bad.includes(r.dataset.r) && !!vals[r.dataset.r]); });
  B.lock = () => $$('button', el).forEach(b => b.disabled = true);
  B.vals = vals;
  window.K.typo(el);
  return B;
};

window.K2 = K2;
})();
