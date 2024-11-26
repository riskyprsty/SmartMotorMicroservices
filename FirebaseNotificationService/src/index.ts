import { initializeKafkaProducer } from './lib/kafkaProducer.js';
import { listenToSettings } from './services/firebaseListenerService.js';
import { listenToVehicleLocations } from './services/locationListenerService.js';
import { listenToElectricity } from './services/voltageListenerService.js';

const bootstrap = async () => {
  console.log('[+] Starting Firebase Listeners...');

  try {
    listenToSettings();
    console.log('[✓] Settings Listener initialized successfully.');
  } catch (error) {
    console.error('[X] Failed to initialize Settings Listener:', error);
  }

  try {
    listenToVehicleLocations();
    console.log('[✓] Vehicle Location Listener initialized successfully.');
    listenToElectricity();
    console.log('[✓] Vehicle Electricity Listener initialized successfully.');
  } catch (error) {
    console.error('[X] Failed to initialize Vehicle Location Listener:', error);
  }

  try {
    await initializeKafkaProducer();
    console.log('[✓] Kafka Production initialized successfully.');
  } catch (error) {
    console.error('[X] Failed to initialize Kafka Producer', error);
  }

  console.log('[+] All listeners are up and running...');
};

bootstrap();
