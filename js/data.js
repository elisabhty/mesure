/* Power BI Quest — données du module 1 */
(function () {
'use strict';
const P = (nom, role, img) => ({ nom, role, img: img ? 'img/p-' + img + '.webp' : null });

const ventes = [
  ['B001','2026-06-01','2026-06-01','Adulte','Web',2,40,80],
  ['B002','2026-06-01','2026-06-01','Enfant','Guichet',1,28,28],
  ['B003','2026-06-01','2026-06-03','Senior','Web',1,32,32],
  ['B004','2026-06-01','2026-06-02','Étudiant','Partenaire',2,30,60],
  ['B005','2026-06-02','2026-06-02','Adulte','Guichet',3,40,120],
  ['B006','2026-06-02','2026-06-04','Enfant','Web',2,28,56],
  ['B007','2026-06-02','2026-06-02','Senior','Guichet',1,32,32],
  ['B008','2026-06-02','2026-06-05','Étudiant','Partenaire',1,30,30],
  ['B009','2026-06-03','2026-06-03','Adulte','Guichet',1,40,40],
  ['B010','2026-06-03','2026-06-05','Enfant','Web',3,28,84],
  ['B011','2026-06-03','2026-06-03','Senior','Guichet',2,32,64],
  ['B012','2026-06-03','2026-06-06','Étudiant','Web',2,30,60],
  ['B013','2026-06-04','2026-06-04','Adulte','Web',4,40,160],
  ['B014','2026-06-04','2026-06-04','Enfant','Guichet',2,28,56],
  ['B015','2026-06-04','2026-06-06','Senior','Web',1,32,32],
  ['B016','2026-06-04','2026-06-07','Étudiant','Partenaire',3,30,90],
  ['B017','2026-06-05','2026-06-05','Adulte','Guichet',2,40,80],
  ['B018','2026-06-05','2026-06-05','Enfant','Web',4,28,112],
  ['B019','2026-06-05','2026-06-06','Senior','Guichet',2,32,64],
  ['B020','2026-06-05','2026-06-07','Étudiant','Web',1,30,30]
].map(r => ({ ID_Vente:r[0], Date_Achat:r[1], Date_Visite:r[2], Type_Billet:r[3], Canal:r[4], Quantite:r[5], Prix_Unitaire:r[6], Montant_TTC:r[7] }));

const entreesCsv = `ID_Entree;ID_Billet;ID_Vente;Date_Entree;Heure_Entree;Portique;Zone_Entree
E001;B001-01;B001;2026-06-01;09:05:12;P01;Entrée Nord
E002;B001-02;B001;2026-06-01;09:05:18;P01;Entrée Nord
E003;B002-01;B002;2026-06-01;10:14:32;P02;Entrée Sud
E004;B004-01;B004;2026-06-02;09:12:08;P03;Entrée Est
E005;B005-01;B005;2026-06-02;09:35:10;P01;Entrée Nord
E006;B005-02;B005;2026-06-02;09:35:16;P01;Entrée Nord
E007;B005-03;B005;2026-06-02;09:35:22;P01;Entrée Nord
E008;B007-01;B007;2026-06-02;11:02:45;P02;Entrée Sud
E009;B003-01;B003;2026-06-03;09:20:14;P02;Entrée Sud
E010;B009-01;B009;2026-06-03;10:05:36;P03;Entrée Est
E011;B011-01;B011;2026-06-03;10:48:11;P01;Entrée Nord
E012;B011-02;B011;2026-06-03;10:48:18;P01;Entrée Nord
E013;B006-01;B006;2026-06-04;09:10:20;P02;Entrée Sud
E014;B006-02;B006;2026-06-04;09:10:27;P02;Entrée Sud
E015;B013-01;B013;2026-06-04;09:42:03;P01;Entrée Nord
E016;B013-02;B013;2026-06-04;09:42:10;P01;Entrée Nord
E017;B013-03;B013;2026-06-04;09:42:16;P01;Entrée Nord
E018;B014-01;B014;2026-06-04;11:15:22;P03;Entrée Est
E019;B014-02;B014;2026-06-04;11:15:29;P03;Entrée Est
E020;B008-01;B008;2026-06-05;09:02:11;P03;Entrée Est
E021;B010-01;B010;2026-06-05;09:25:14;P02;Entrée Sud
E022;B010-02;B010;2026-06-05;09:25:20;P02;Entrée Sud
E023;B017-01;B017;2026-06-05;10:12:03;P01;Entrée Nord
E024;B017-02;B017;2026-06-05;10:12:09;P01;Entrée Nord
E025;B018-01;B018;2026-06-05;10:45:12;P02;Entrée Sud
E026;B018-02;B018;2026-06-05;10:45:19;P02;Entrée Sud
E027;B018-03;B018;2026-06-05;10:45:25;P02;Entrée Sud`;
const csvLines = entreesCsv.split('\n');
const csvHead = csvLines[0].split(';');
const entrees = csvLines.slice(1).map(l => { const v = l.split(';'); const o = {}; csvHead.forEach((h, i) => o[h] = v[i]); return o; });

window.PBQ_DATA = {
  people: {
    pixel: P('Pixel', 'Ton assistant', 'pixel'),
    victoria: P('Victoria', 'Directrice de Wonderland', 'victoria'),
    gabriel: P('Gabriel', 'Directeur financier', 'gabriel'),
    oscar: P('Oscar', 'Service exploitation', 'oscar'),
    lola: P('Lola', 'Service marketing', 'lola'),
    camille: P('Camille', 'Service administratif', 'camille'),
    employe: P('Employé', 'Poste d’accueil', null)
  },
  ventes, entrees, entreesCsv,
  colsVentes: ['ID_Vente','Date_Achat','Date_Visite','Type_Billet','Canal','Quantite','Prix_Unitaire','Montant_TTC'],
  colsEntrees: csvHead,
  tarifs: [['T01','Adulte',40],['T02','Enfant',28],['T03','Senior',32],['T04','Étudiant',30]].map(r => ({ Code_Tarif:r[0], Type_Billet:r[1], Prix_TTC:r[2] })),
  lisezmoi: [
    ['Producteur','Service billetterie Wonderland'], ['Responsable','Lola'], ["Date d'extraction simulée",'06/06/2026'],
    ['Période des achats','Du 01/06/2026 au 05/06/2026'], ['Devise','EUR'], ['Périmètre','Ventes de billets'],
    ['Remboursements','Aucun dans cet échantillon'], ['Remises','Aucune dans cet échantillon'], ['Nombre de lignes de vente','20'], ['Confidentialité','Données pédagogiques fictives']
  ],
  /* Les dix missions du module 1 : lieu, image, position sur la carte (en % de l'image) */
  missions: [
    { id:101, titre:'Ton premier jour', lieu:'Le bâtiment administratif', scene:'parc', duree:'15 à 20 min', pin:[53.5,74.4] },
    { id:102, titre:'Les billets d’entrée', lieu:'La billetterie', scene:'billetterie', duree:'20 à 25 min', pin:[47.2,65.6] },
    { id:103, titre:'Le registre des visiteurs', lieu:'Les portiques d’entrée', scene:'portiques', duree:'25 à 30 min', pin:[46.4,57.2] },
    { id:104, titre:'Les portes du parc', lieu:'Le centre de contrôle des entrées', scene:'controle', duree:'30 à 35 min', pin:[68.4,50.0] },
    { id:105, titre:'Les premières statistiques', lieu:'La salle de pilotage', scene:'pilotage', duree:'30 à 35 min', pin:[58.5,42.8] },
    { id:106, titre:'Une journée mouvementée', lieu:'Le bureau des opérations commerciales', scene:'matinee', duree:'30 à 35 min', pin:[45.8,35.9] },
    { id:107, titre:'Les attractions populaires', lieu:'Le centre de supervision des attractions', scene:'dragon', duree:'35 à 40 min', pin:[62.7,30.9] },
    { id:108, titre:'Les visiteurs du week-end', lieu:'Le bureau des prévisions et de l’accueil', scene:'samedi', duree:'35 à 40 min', pin:[56.7,22.2] },
    { id:109, titre:'Le rapport de Victoria', lieu:'Le studio de présentation', scene:'studio', duree:'40 à 45 min', pin:[50.4,17.2] },
    { id:110, titre:'La première présentation', lieu:'La salle du conseil d’administration', scene:'conseil', duree:'45 à 60 min', pin:[61.1,10.3] }
  ],
  objets: {
    plante:'Plante de bureau', lampe:'Lampe de bureau articulée', 'grande-roue':'Maquette de la grande roue', 'tableau-qualite':'Tableau de contrôle qualité',
    'second-ecran':'Deuxième écran', clavier:'Clavier rétroéclairé', dragon:'Maquette lumineuse de Dragon', calendrier:'Calendrier interactif',
    'ecran-panoramique':'Écran panoramique', certificat:'Certificat des fondamentaux'
  },
  services: ['Billetterie','Fréquentation','Attractions','Maintenance','Finances','Satisfaction']
};
})();
