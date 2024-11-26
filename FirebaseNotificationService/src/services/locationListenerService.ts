import { db } from '../lib/firebase.js';
import { haversineDistance } from '../utils/utils.js';
import { produceMessage } from '../lib/kafkaProducer.js';

interface Location {
  lat: number;
  lng: number;
}

interface VehicleSettings {
  value: number;
  enabled: boolean;
  lat: number;
  lng: number;
  takeover: boolean;
  notificationInterval: number;
}

interface KafkaNotificationMessage extends Record<string, unknown> {
  vehicleId: string;
  message: string;
  number: string;
}

const KAFKA_TOPIC = 'whatsapp-notifications';
const lastNotificationMap = new Map<string, number>();

// const notificationTimestamps: Record<string, number> = {}; 
// const NOTIFICATION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const shouldSendNotification = (
  vehicleId: string,
  interval: number,
): boolean => {
  const now = Date.now();
  const lastSentTime = lastNotificationMap.get(vehicleId) || 0;
  const elapsedMinutes = (now - lastSentTime) / 1000 / 60;

  if (elapsedMinutes >= interval) {
    lastNotificationMap.set(vehicleId, now); 
    return true;
  }

  return false;
};

export const listenToVehicleLocations = () => {
  const vehicleLocationRef = db.ref('vehicle');

  vehicleLocationRef.on('child_changed', async (snapshot) => {
    const vehicleId = snapshot.key!;
    const location: Location | null = snapshot.val()?.location;

    if (!isValidLocation(location)) {
      console.log(`[.] Invalid location for vehicle ${vehicleId}:`, location);
      return;
    }

    try {
      const settings = await getVehicleSettings(vehicleId);
      if (!settings || !settings.enabled) {
        console.log(`[.] Settings disabled for vehicle ${vehicleId}.`);
        return;
      }

      const distance = haversineDistance(
        { lat: location.lat, lng: location.lng },
        { lat: settings.lat, lng: settings.lng },
      );

      console.log(
        `[.] Vehicle ${vehicleId} is ${distance.toFixed(2)} km from the base.`,
      );

      if (distance > settings.value) {
        console.log(
          `[!] Vehicle ${vehicleId} exceeded the radius (${settings.value} km).`,
        );

        const number = await getWhatsAppNumber(vehicleId);
        if (!number) {
          console.log(`[X] No WhatsApp number found for vehicle ${vehicleId}`);
          return;
        }

        if (shouldSendNotification(vehicleId, settings.notificationInterval)) {
          const kafkaMessage: KafkaNotificationMessage = {
            vehicleId,
            message: `🚨🚨🚨 *ᴀʟᴇʀᴛ* 🚨🚨🚨\n*Motor anda dengan ID ${vehicleId}* keluar dari radius sejauh *${distance.toFixed(
              2,
            )}* km dari lokasi awal.\n\n🛎️ Notifikasi akan kembali dikirimkan dalam interval ${settings.notificationInterval} menit kedepan\n\n*/ɴᴏᴛɪꜰʏ ᴏꜰꜰ* untuk mematikan notifikasi\n*/sᴇᴛɪɴᴛᴇʀᴠᴀʟ <ᴍɪɴ>* untuk merubah interval`,
            number,
          };
          await sendNotification(kafkaMessage);

          if (settings.takeover) {
            console.log(
              `[!] Takeover mode enabled. Turning off motor with ID ${vehicleId}.`,
            );
            const masterSwitchRef = db.ref(
              `vehicle/${vehicleId}/master_switch`,
            );
            await masterSwitchRef.update({ value: false });
            const kafkaMessage: KafkaNotificationMessage = {
              vehicleId,
              message: `🚨🚨🚨 *sᴇᴄᴜʀɪᴛʏ ᴍᴏᴅᴇ* 🚨🚨🚨\n*Motor anda dengan ID ${vehicleId}* dimatikan secara otomatis karena security mode diset ke *HIGH*`,
              number,
            };
            await sendNotification(kafkaMessage);

            console.log(`[✓] Motor with ID ${vehicleId} has been turned off.`);
          }
        } else {
          console.log(
            `[.] Skipping notification for vehicle ${vehicleId} due to interval.`,
          );
        }
      }
    } catch (error) {
      console.error(`[X] Error processing vehicle ${vehicleId}:`, error);
    }
  });

  console.log('[+] Listening to vehicle location updates...');
};

const isValidLocation = (location: unknown): location is Location =>
  typeof location === 'object' &&
  location !== null &&
  'lat' in location &&
  'lng' in location &&
  typeof (location as Location).lat === 'number' &&
  typeof (location as Location).lng === 'number';

const getVehicleSettings = async (
  vehicleId: string,
): Promise<VehicleSettings | null> => {
  const settingsRef = db.ref(`settings/${vehicleId}`);
  const snapshot = await settingsRef.once('value');
  const settings = snapshot.val();

  if (!settings) return null;

  return {
    value: settings.radius?.value || 0,
    enabled: settings.radius?.enabled || false,
    lat: settings.radius?.lat || 0,
    lng: settings.radius?.lng || 0,
    takeover: settings.radius?.takeover || false,
    notificationInterval: settings.notification_interval || 30, 
  };
};

const getWhatsAppNumber = async (vehicleId: string): Promise<string | null> => {
  const wausersRef = db.ref('wausers');
  const snapshot = await wausersRef.once('value');
  const wausers = snapshot.val() as Record<
    string,
    { vehicleId: string }
  > | null;

  if (!wausers) return null;

  for (const [key, value] of Object.entries(wausers)) {
    if (value.vehicleId === vehicleId) return key;
  }

  return null;
};

const sendNotification = async (message: KafkaNotificationMessage) => {
  try {
    await produceMessage(KAFKA_TOPIC, message);
    console.log(
      `[✓] Notification sent to Kafka for vehicle ${message.vehicleId} and number ${message.number}.`,
    );
  } catch (error) {
    console.error(`[X] Failed to send Kafka notification:`, error);
  }
};
