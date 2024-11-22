import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get } from 'firebase/database';
import firebaseConfig from '../../firebaseConfig.json' with { type: 'json' };

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export const getVehicleStatus = async (vehicleId: string) => {
  try {
    const dbRef = ref(db, 'vehicle/' + vehicleId);
    const snapshot = await get(dbRef);

    if (snapshot.exists()) {
      // console.log(snapshot.val());
      return snapshot.val();
    } else {
      console.log('snapshot null');
      return null;
    }
  } catch (e) {
    console.log('Error retrieving motor status from firebase RTDB', e);
  }
};

export const isUserInitialized = async (jid: string): Promise<boolean> => {
  const number = jid.split('@')[0];
  const userRef = ref(db, `wausers/${number}`);
  const snapshot = await get(userRef);

  return snapshot.exists() && snapshot.val().initialized === true;
};

export const initializeUser = async (
  jid: string,
  vehicleId: string,
): Promise<void> => {
  const number = jid.split('@')[0];
  const userRef = ref(db, `wausers/${number}`);
  await set(userRef, { initialized: true, vehicleId });
};

export const getUserVehicleId = async (jid: string): Promise<string | null> => {
  const number = jid.split('@')[0];
  const userRef = ref(db, `wausers/${number}/vehicleId`);
  const snapshot = await get(userRef);
  return snapshot.exists() ? snapshot.val() : null;
};
