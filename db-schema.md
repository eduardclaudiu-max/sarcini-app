# Schema Firestore — households/{householdId}

Păstrează aceeași formă de date pe care o are deja `sarcini.html` (localStorage), doar
mutată în Firestore, ca ambele telefoane să vadă aceleași date live.

households/{householdId}
  ├─ projects/{projectId}        { name, categories: [{id, name}] }
  ├─ tasks/{taskId}              { projectId, categoryId, text, done, dueDate,
  │                                important, urgent, subtasks: [{id,text,done}],
  │                                scheduledDate, completedAt }
  ├─ events/{eventId}            { date, title, start, end }
  ├─ notes/{noteId}              { text }
  ├─ meta/settings               { freeNotes, weekGoals: {weekKey: [...]}, longtermGoals: [...] }
  └─ members/{uid}               { fcmToken, displayName }

`householdId` = un id fix ales de voi doi (ex. un cuvânt cod), scris manual în
`public/firebase-config.js` ca `HOUSEHOLD_ID`, ca amândoi să scrieți în același loc.

Fiecare listă (`projects`, `tasks`, `events`, `notes`) se ascultă cu
`onSnapshot(collection(db, 'households/'+HOUSEHOLD_ID+'/tasks'), ...)` — orice modificare
de pe un telefon apare automat pe celălalt, fără refresh.

`members/{uid}/fcmToken` se scrie o singură dată, când utilizatorul acceptă notificările
(`getToken(messaging, {vapidKey})`), ca funcția din backend să știe cui să trimită push.
