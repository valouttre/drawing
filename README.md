# 🎨 Dessine & Vote

Jeu de dessin multijoueur en ligne : l'hôte crée une partie et partage le **code** (ou le **lien**), chacun choisit son pseudo et son icône, tout le monde dessine le même thème dans le temps imparti, puis on **vote** (impossible de voter pour son propre dessin).

- Taille du canvas choisie par chaque joueur pendant le dessin (px, pouces, cm, mm)
- 19 outils : crayon, pinceau doux, calligraphie, marqueur, surligneur, arc-en-ciel, spray, gomme, ligne, flèche, rectangle, arrondi, ellipse, triangle, losange, étoile, pot de peinture, texte, pipette
- Palettes (Classique, 48 teintes, Pastel, Néon, Terre, Peaux, Gris), 2 couleurs, code hexa, couleurs récentes, taille/opacité/dureté, miroir (symétrie), lissage, zoom, retournement, export PNG, raccourcis (Ctrl+Z/Y, [ ])
- Jusqu'à 12 joueurs, manches multiples, classement et podium

## Fonctionnement technique
Site 100 % statique (HTML/CSS/JS). Le temps réel passe par [PeerJS](https://peerjs.com) (WebRTC) : l'hôte joue le rôle de serveur, les autres joueurs se connectent à lui. **Aucun backend, aucune clé d'API.**
Limites : si l'hôte quitte, la partie s'arrête ; certains réseaux très restrictifs (pas de TURN) peuvent bloquer la connexion.

## Déployer
**GitHub Pages** : pousse le dossier sur un dépôt → *Settings → Pages* → branche `main`, dossier `/ (root)`.
**Vercel** : importe le dépôt sur vercel.com (framework « Other », aucun build), ou `npx vercel --prod` dans le dossier.

## Tester en local
`npx serve .` (ou `python3 -m http.server`) puis ouvre deux onglets.
