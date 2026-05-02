
const firebase = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount)
});

const db = firebase.firestore();

async function checkCollections() {
  const collections = ['Eserler', 'Klasikler', 'Kullanicilar'];
  for (const col of collections) {
    const snap = await db.collection(col).get();
    console.log(`${col}: ${snap.size} documents`);
  }
}

checkCollections();
