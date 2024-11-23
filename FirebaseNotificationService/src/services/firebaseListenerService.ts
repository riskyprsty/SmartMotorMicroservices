import { db } from '../lib/firebase.js';

export const listenToSettings = () => {
  const ref = db.ref('settings');

  ref.on('child_changed', (snapshot) => {
    const vehicleId = snapshot.key!;
    const settings = snapshot.val();

    console.log(`Ada setting yang diupdate untuk motor ${vehicleId}`, settings);

    if (settings.enabled) {
      console.log(`Warning diaktifkan untuk ${vehicleId}`);
    }
  });

  console.log('Listening ke perubahan setting...');
};
