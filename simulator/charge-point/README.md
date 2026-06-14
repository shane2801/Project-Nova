# Simulateur de borne de recharge OCPP 1.6J

Simule une borne de recharge (charge point) qui se connecte au CSMS via OCPP 1.6J sur WebSocket. Utile pour tester le CSMS sans matériel réel.

## Prérequis

- Node.js ≥ 17.3
- Le CSMS doit tourner (`npm run dev` dans `csms/`)
- Un tag RFID autorisé doit exister en base (voir ci-dessous)

## Installation

```bash
cd simulator/charge-point
npm install
```

Les dépendances sont déjà installées — `ocpp-rpc` est référencé via `file:../ocpp-rpc`, aucun package externe n'est téléchargé.

## Utilisation rapide

```bash
npm start -- [options]
```

| Option | Défaut | Description |
|---|---|---|
| `--identity <id>` | `CP001` | Identifiant de la borne (doit être unique si plusieurs bornes tournent) |
| `--csms <url>` | `ws://localhost:9000` | URL WebSocket du CSMS |
| `--tag <rfid>` | `RFID001` | Tag RFID à présenter pour l'autorisation |
| `--duration <secondes>` | `60` | Durée totale de la charge |
| `--power <watts>` | `7400` | Puissance simulée (ex : 7 400 W ≈ 32A monophasé) |
| `--interval <secondes>` | `10` | Fréquence d'envoi des MeterValues |
| `--meter-start <Wh>` | `0` | Valeur initiale du compteur d'énergie |

## Exemples

```bash
# Test rapide : 30 secondes, relevé toutes les 5 secondes
npm start -- --duration 30 --interval 5

# Borne rapide 22 kW pendant 2 minutes
npm start -- --identity CP002 --tag RFID-ABC --power 22000 --duration 120

# Borne sur un CSMS distant
npm start -- --identity CP042 --csms ws://192.168.1.10:9000 --tag RFID001

# Compteur qui repart d'une valeur non nulle (borne redémarrée)
npm start -- --meter-start 84500 --duration 60
```

## Ce que fait le simulateur

Le simulateur reproduit le cycle de vie complet d'une session de charge OCPP 1.6J :

```
1. Connexion WebSocket au CSMS
2. BootNotification        → identifie la borne (vendor, model, serial)
3. StatusNotification      → connecteur passe en "Available"
4. Authorize {idTag}       → vérifie que le tag est autorisé
5. StatusNotification      → connecteur passe en "Preparing"
6. StartTransaction        → ouvre la session, reçoit un transactionId
7. StatusNotification      → connecteur passe en "Charging"
8. MeterValues (boucle)    → envoie l'énergie consommée à chaque intervalle
9. StopTransaction         → ferme la session avec le compteur final
10. StatusNotification     → connecteur repasse en "Available"
11. Déconnexion WebSocket
```

Sortie typique :

```
Connecting CP001 → ws://localhost:9000 …
CP001 connected.

[CP001] Status → Available
[CP001] Authorizing tag RFID001…
[CP001] Tag accepted
[CP001] Status → Preparing
[CP001] StartTransaction → id=1
[CP001] Status → Charging  (duration=30s  power=7400W  interval=5s)
[CP001] MeterValues: 10 Wh
[CP001] MeterValues: 20 Wh
[CP001] MeterValues: 30 Wh
[CP001] StopTransaction  meterStop=30 Wh
[CP001] Status → Available — session complete
```

## Pré-autoriser un tag RFID

Le CSMS vérifie chaque tag dans la table `authorized_tags`. Avant de lancer le simulateur, enregistrez le tag via l'API REST :

```bash
curl -X POST http://localhost:3000/api/auth/tags \
  -H "Content-Type: application/json" \
  -d '{
    "idTag":     "RFID001",
    "validFrom": "2026-04-28T08:00:00Z",
    "validTo":   "2026-04-28T08:59:00Z"
  }'
```

```bash
# Génère validFrom = maintenant, validTo = +1h (bash/MINGW)
curl -X POST http://localhost:3000/api/auth/tags \
  -H "Content-Type: application/json" \
  -d "{
    \"idTag\":     \"RFID001\",
    \"validFrom\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"validTo\":   \"$(date -u -d '+59 minutes' +%Y-%m-%dT%H:%M:%SZ)\"
  }"
```

> La fenêtre `validFrom`/`validTo` ne peut pas dépasser 1 heure (règle hackathon).

Pour lister les tags actifs :

```bash
curl http://localhost:3000/api/auth/tags
```

Pour révoquer un tag :

```bash
curl -X DELETE http://localhost:3000/api/auth/tags/RFID001
```

## Vérifier les données enregistrées

Après une simulation, les données sont accessibles via l'API REST du CSMS :

```bash
# Voir la borne connectée
curl http://localhost:3000/api/stations

# Toutes les sessions
curl http://localhost:3000/api/sessions

# Détail d'une session (avec les MeterValues)
curl http://localhost:3000/api/sessions/1
```

## Simuler plusieurs bornes en parallèle

Ouvrez plusieurs terminaux et lancez un simulateur par terminal avec des identités différentes :

```bash
# Terminal 1
npm start -- --identity CP001 --tag RFID001 --duration 60

# Terminal 2
npm start -- --identity CP002 --tag RFID002 --duration 120 --power 22000

# Terminal 3
npm start -- --identity CP003 --tag RFID003 --duration 45 --interval 15
```

Chaque borne crée sa propre session indépendante dans la base.

## Utiliser `ChargePoint` dans vos propres scripts

La classe `ChargePoint` est réutilisable dans n'importe quel script TypeScript :

```typescript
import { ChargePoint } from './src/ChargePoint';
import { runFullCharge } from './src/scenarios/full-charge';

const cp = new ChargePoint({
  identity: 'CP001',
  csmsUrl:  'ws://localhost:9000',
});

await cp.connect();

// Cycle de charge complet via le scénario fourni
await runFullCharge(cp, {
  idTag:      'RFID001',
  durationMs: 120_000,  // 2 minutes
  peakPowerW: 11_000,   // 11 kW (triphasé 16A)
  intervalMs: 15_000,   // MeterValues toutes les 15s
});

// Ou appels bas niveau pour des scénarios personnalisés
await cp.setStatus(1, 'Faulted');
await cp.sendHeartbeat();

// Réagir aux commandes du CSMS
cp.onRemoteStart((connectorId, idTag) => {
  console.log(`CSMS demande une charge sur connecteur ${connectorId} pour ${idTag}`);
});

cp.onRemoteStop((transactionId) => {
  console.log(`CSMS demande l'arrêt de la transaction ${transactionId}`);
});

await cp.disconnect();
```

## Structure des fichiers

```
simulator/charge-point/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts                  ← point d'entrée CLI
    ├── ChargePoint.ts            ← classe principale (wraps RPCClient)
    └── scenarios/
        └── full-charge.ts        ← cycle de charge complet
```
