const admin = require('firebase-admin');

const HOUSEHOLD_ID = 'tita';
const TIMEZONE = 'Europe/Bucharest';
const REMINDER_WINDOW_MIN = 15;

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
});
const db = admin.firestore();

function nowInTimezone() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type).value;
  return {
    dateStr: `${get('year')}-${get('month')}-${get('day')}`,
    minutesOfDay: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

async function main() {
  const { dateStr: today, minutesOfDay: nowMin } = nowInTimezone();
  const base = db.collection('households').doc(HOUSEHOLD_ID);

  const notifiedRef = base.collection('meta').doc('notified');
  const notifiedSnap = await notifiedRef.get();
  const prevKeys = notifiedSnap.exists ? (notifiedSnap.data().keys || []) : [];
  const notifiedToday = new Set(prevKeys.filter((k) => k.endsWith(today)));

  const toSend = [];

  const tasksSnap = await base.collection('tasks').where('done', '==', false).where('dueDate', '==', today).get();
  tasksSnap.forEach((doc) => {
    const key = `task_${doc.id}_${today}`;
    if (notifiedToday.has(key)) return;
    notifiedToday.add(key);
    const t = doc.data();
    toSend.push({ title: 'Sarcini', body: `Scadent azi: ${t.text}` });
  });

  const eventsSnap = await base.collection('events').where('date', '==', today).get();
  eventsSnap.forEach((doc) => {
    const ev = doc.data();
    const [sh, sm] = (ev.start || '').split(':').map(Number);
    if (Number.isNaN(sh) || Number.isNaN(sm)) return;
    const evMin = sh * 60 + sm;
    const diff = evMin - nowMin;
    if (diff < 0 || diff > REMINDER_WINDOW_MIN) return;
    const key = `ev_${doc.id}_${today}`;
    if (notifiedToday.has(key)) return;
    notifiedToday.add(key);
    toSend.push({ title: 'Sarcini', body: `${ev.title} începe la ${ev.start}` });
  });

  if (toSend.length === 0) {
    console.log('Nimic de notificat.');
    return;
  }

  const membersSnap = await base.collection('members').get();
  const tokens = [];
  membersSnap.forEach((doc) => {
    const token = doc.data().fcmToken;
    if (token) tokens.push(token);
  });

  if (tokens.length === 0) {
    console.log('Nu există niciun token FCM salvat; nimic de trimis.');
  } else {
    for (const msg of toSend) {
      const res = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title: msg.title, body: msg.body },
      });
      console.log(`Trimis "${msg.body}" către ${res.successCount}/${tokens.length} dispozitive.`);
    }
  }

  await notifiedRef.set({ keys: Array.from(notifiedToday) });
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
