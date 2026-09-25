# Sarcini — proiect pornit, de continuat în Claude Code

Acest folder e un schelet gata pregătit. Codul aplicației (`sarcini.html`, deja funcțional)
trebuie adus aici și conectat la Firebase pentru sincronizare reală + notificări push.
Tot ce urmează se face în **Claude Code** (are acces la internet și poate rula comenzi),
nu în chatul obișnuit.

## Ce obții la final
- Aceleași 6 secțiuni (Listă, Priorități, Planificare, Calendar, Proiecte, Statistici)
- Datele se sincronizează automat între telefonul tău și al ei (Firestore)
- Notificări push reale, chiar și cu telefonul blocat / aplicația închisă
- Instalabilă pe ecranul principal ca o aplicație adevărată (PWA)

## Pași

### 1. Cont Firebase (gratuit)
1. Mergi pe https://console.firebase.google.com → „Add project" → dă-i un nume (ex. `sarcini-app`).
2. În proiect: **Build → Firestore Database → Create database** (mod „production", regiune Europe).
3. **Build → Authentication → Sign-in method** → activează „Anonymous" (cel mai simplu — fiecare
   telefon primește un id unic fără parolă; dacă vrei login cu email/parolă mai târziu, se poate
   schimba ușor).
4. **Project settings → Cloud Messaging** → generează o „Web Push certificate" (cheie VAPID) —
   copiaz-o, o pui în `public/app.js` unde scrie `VAPID_KEY_AICI`.
5. **Project settings → General → Your apps → Web app** → copiază obiectul `firebaseConfig`
   (apiKey, projectId etc.) și pune-l în `public/firebase-config.js`.

### 2. Instalează uneltele (în terminalul din Claude Code)
```bash
npm install -g firebase-tools
firebase login
cd sarcini-app
firebase init hosting firestore functions messaging
# alege proiectul creat la pasul 1; public directory: "public"; single-page app: Yes
```

### 3. Adu codul aplicației aici
Copiază conținutul lui `sarcini.html` (cel publicat mai devreme) în `public/index.html`,
apoi cere-i lui Claude Code: *"înlocuiește funcțiile saveState/loadState din index.html
cu citire/scriere în Firestore, colecția `households/{householdId}`, ca în db-schema.md"* —
schema exactă e în `db-schema.md` din acest folder, ca să păstreze aceeași structură de date
(proiecte, sarcini, evenimente, obiective) dar sincronizată live prin `onSnapshot`.

### 4. Notificări push în fundal
`public/sw.js` e deja pregătit cu handler-ul de push. Trebuie doar completată funcția
Cloud Function din `functions/index.js` care, atunci când un task are `dueDate` = azi sau
un eveniment de calendar începe în &lt;15 min, trimite push prin `admin.messaging().send(...)`
către token-urile salvate în Firestore. Un scheduler simplu (`functions.pubsub.schedule('every 5 minutes')`)
e suficient.

### 5. Deploy
```bash
firebase deploy
```
Primești un link `https://sarcini-app.web.app` — acela e link-ul stabil pe care îl adaugă
amândoi pe ecranul principal (din browser: „Adaugă pe ecranul principal"). De atunci încolo
se deschide ca o aplicație reală, cu icon propriu, și primește notificări chiar din fundal.

### Cost
La doi utilizatori, tot ce faceți aici rămâne cu mult sub limita gratuită Firebase
(Spark plan) — Firestore, Hosting, Authentication anonim și Cloud Messaging sunt gratuite
la acest volum. Doar Cloud Functions cu scheduler ar putea cere planul „Blaze" (plată-la-uz),
dar tot rămâne, practic, câțiva cenți pe lună la acest volum de utilizare.
