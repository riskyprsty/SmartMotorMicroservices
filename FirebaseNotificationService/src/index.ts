import { listenToSettings } from './services/firebaseListenerService.js';

const bootstrap = () => {
  console.log('[+] Service Firebase Listener started.....');
  listenToSettings();
};

bootstrap();
