# Setup

## Technologies

### Mes choix

- Typescript : expressif, du typage, performance correct avec bun, très utilisé
- Bun : performant, moderne, avec le package manager, TS sans build et driver sqlite intégré.
- Biome + ultracite : linter moderne, règles suffisantes, formatter offert
- Sqlite : pour manipuler facilement des ensembles, in memory ou pas, lisible, agent friendly (voir recommendations)
- stream-json + stream-chain : si on a de gros fichiers JSON, streamer est obligatoire (et on peut passer sqlite sur disque facilement)
- Zod : pour rajouter un peu de type safety. Pas le plus moderne, mais le plus utilisé.
- Vercel AI SDK : boucle agentique lisible, standard, voir détail ci-après.
- Modèle Open AI : lancer OPENAI_API_KEY=sk-proj-... bun run dev
- Lefthook : bonnes habitudes, check pre commit, audit pre push

### Limites

- Go pour un cli simple c'est souvent mieux. Mais c'est un plus verbeux que TS et j'vais besoin d'aller vite. Coté stream c'était moins évident pour moi.
- Eslint permet des choses plus complexes que biome théoriquement, mais je suis resté pragmatique, biome travaille plus vite et 0 zero conf
- Zod plutot que typebox parce qu'il était déjà dans les dépendences d'un autre lib

## Implémentation

### Flow et vue d'ensemble

1. Vérifications des arguments en entrée
2. Setup mémoire
3. Ingestion streamé
4. Phase de calcul déterministe (aggregations des données)
5. Phase de calcul non déterministe (agent)
6. Perisistence sur le système de fichier

index.ts est la rcaien de l'app, qui instancie tous les noeuds, gère leurs dépendances et les coordonne.

L'aggregation est un gros morceau, elle est découpé dans plusieurs fichiers avec son dossier, avec un seul poitn d'entrée (aggregator.ts)

La recommendation est aussi un bon morceau, elle a son propre dossier, avec un fichier agent.ts et tools.ts, strtcure prête a recevori de nouvelels fonctionnaltiés de façon claire si besoin.

Le typage c'est important, un fichiers types.ts est dédié à ce sujet.

### Vérifications des arguments en entrée

Une fonction dédié, si le cli a besoin de plsu de fonctionnalité, la zone est déjà délimité.

### Setup mémoire
La manipulation d'une grande quantité de données se fait beaucoup plus facilement dans une logique ensembliste avec du sql. On raisonne mieux avec des fonction d'aggrégation plutot qu'avec des boucles imbriqués.
Ca permet aussi de voir plus facilement la différence entre le domaine algorithmique/et impératif de l'application et la partie un peu plus data.
Sqlite permet de manipuler les données inmemory pour quelques dizaines de go (selon la machine), et si on a besoin de plus on peut passer sur disque, c'est une seule variable à changer pour changer d'échelle.

### Ingestion streamé
Le cororolaire du point précédent, c'est que si on a beaucoup de données en entrée, si on les ingère de façon simple dans un seul bloc alors on va être limité par notre mémoire. Dans ce cas j'utilise des bibliothèques de stream json pour éviter de les refaire moi même. La complexité est limité (voir streamer.ts) et l'ajout est cohérent et propre. Petite subtilité avec la validation des données d'entrée dans le streamer, le système est renforcé au bon endroit ici dans le streamer en amont plutot que trop tard en aval en arrivant sur la base de données. Ca permet d'avoir une logique de buffer et de transaction plus simple coté store (pas de vérification de type, elle a été faite avant).
Cette vérification, on reste pragmatique, pose des contraintes raisonnables, et des commentaires ont été laissés aux endroits ou une implémentation plus complexes pouvaient être iamginé.

### Phase de calcul déterministe (aggregations des données)
Le système d'aggrégation est découpé par thème.
La structure est répétitive et c'est normal, quand il y a un pe ude complexité, on peut reposer le cerveau du développeur en gardant des patterns reconaissables et en découpant. Typiquement coté anomalies je pouvais aussi paramétré le nosm des tables et des champs, mais le potenciel manque de lisibiltié (et le temps) m'ont convaincu que c'était probablement pas l'idée la plsu pertinente immédiatement.
Les thresholds sont colocaliser a coté des reqtes sql pour une lisibilité rapide également.
2 points de détail important : 
- "anomalies : tableau d’objets décrivant chaque anomalie." => si je devais interpreter littéralement, je génèrerai énormément d'anomalie, mais ça n'est pas lisible et ça ne résout aucun problème. Donc je renvoei qu'un aggrégat MAX poru chaque type d'anomalie. De son coté l'agent à un tool query_db qui peut lui permettre de rentrer dans le détail, de cette façon l'agent gère so nniveau d'inforamtion prorgressivement. Voir ci-après.
- "service_status_summary : objet mappant chaque statut à un tableau de
chaînes." => j'ai 3 statuts et un tableau de chaine, qui j'imagine est un tableau de chaine des services ? Mais du coup si je mets mes services ici, je les prend à quelles dates ? Selon moi les dernières. Sans plsu dde détail, c'est la justification à mon implémentation.

### Phase de calcul non déterministe (agent)
Le pattern qui emerge de façon de plus en plus clair ces derniers mois est d'avoir, au moins en premiere approche, le non-déterministe (agent) qui pilote le déterministe (les tools, le programme).
De cette façon, au fur et a mesure des run, on découvre des patterns que l'agent mets en place et qui marchent parfois très bien, puis dans uen seconde phase, on va contraindre l'execution de ce workflow pour stabiliser la qualité des résultats.
Ici pas d'éval ou de boucles compliquées, mais justement cette première approche : l'agent est prompté comme un spécialiste SRE, on lui mets à disposition diverses informatiosn et u naccès aux inforamtiosn brutes via la base de données, et selon son niveau d'intelligence, il mettera en place des stratègies qui pourront être review plus tard et mis dans un workflow plus rigide.
Point important de l'implémentation : la phase 1 est un boucle agentique qui génère un rapport au format libre pour maximiser la qualité de la productio nde l'agent, la phase 2 est dédié à la transformation en données structuré par le llm, phase dédié poru le pas polluer la phase précédente. Ca a un cout (cache miss notamment), mais c'est mon choxi "qualitatif" ici.

### Perisistence sur le système de fichier
Aucun surprise, le rapport a été construit au fur et a mesure, on l'écrit au bon endroit et on est bon.


## Détails supplémentaires de mise en place
- minimumReleaseAge pour Bun afin d'éviter les attaques de supply chain qui sont un peu devenues la mode en ce moment.
