import { getVehicleStatus } from '../services/firebaseService.js';

export const helpMessage = async (
   senderName: string,
): Promise<[object, string]> => {
   const thumbnailUrl =
      'https://cdn.jsdelivr.net/gh/riskyprsty/SmartMotorMicroservices@refs/heads/master/WhatsappBotService/src/docs/media/thumbnail.png';
   const sourceUrl = 'https://tribone.my.id';
   const message = `Halo, ${senderName}! 🔖\nAku adalah bot *Smart Motor Monitoring* 🔥\nApa yang dapat saya lakukan?\n\n*🌡 Monitoring 🌡*\n🔍 */status*\n\t*/location* \n\t*/modem*\n\n*⚙️ Control ⚙️*\n🔑 */<on/off>* (kontrol switch)\n\t*/warn <radius>* `;
   const context = {
      externalAdReply: {
         title: new Date().toLocaleString(),
         body: '© SmartMotorcycleMonitoring',
         mediaType: 1,
         thumbnailUrl: thumbnailUrl,
         sourceUrl: sourceUrl,
         containsAutoReply: false,
         renderLargerThumbnail: true,
         showAdAttribution: false,
      },
   };

   return [context, message];
};

export const initializeExampleMessage = () => {
   const message =
      '🔖 Silahkan masukkan *VehicleID*. Format */init <vehicleid>*\n\nContoh: /init Satria_123456';
   return message;
};

export const unitializedMessage = () => {
   const message =
      'Halo, silahkan daftarkan motor anda dengan memasukkan *VehicleID* terlebih dahulu\n*/init <vehicleId>*';
   return message;
};

export const successInitializeMessage = async (
   senderName: string,
   vehicleId: string,
): Promise<string> => {
   const message = `Halo, ${senderName} 🔥\nMotor dengan VehicleID *${vehicleId}* telah berhasil diregister 🎉. \n\n🛵 Ketikkan /help atau /status untuk melihat status motor`;
   return message;
};

export const formatVehicleLocation = async (
   vehicleId: string,
): Promise<object> => {
   try {
      const vehicleLocation = await getVehicleStatus(vehicleId);
      const lat = vehicleLocation.location.lat;
      const long = vehicleLocation.location.lng;
      const locationformat = {
         degreesLatitude: lat,
         degreesLongitude: long,
      };

      return locationformat;
   } catch (e) {
      console.log(e);
      return [];
   }
};

export const formatVehicleStatusMessage = async (
   vehicleId: string,
): Promise<string> => {
   try {
      const vehicleStatus = await getVehicleStatus(vehicleId);
      const relayStatus = vehicleStatus.master_switch.value ? 'nyala' : 'mati';
      const locationTimestamp = new Date(
         vehicleStatus.location.timestamp * 1000,
      );
      const locationParseTimestamp = `_Terakhir diupdate: ${locationTimestamp.toLocaleString('id-ID')}_`;

      const message = `Halo, status perangkat untuk motor *${vehicleId}*\n\n*--- Electricity ---*\n*Voltase*: ${vehicleStatus.electricity.voltage}V\n\n*---- Modem ---*\n*Operator*: ${vehicleStatus.modem.operator}\n*Kekuatan Signal*: ${vehicleStatus.modem.signal_strength} dBm\n*IP Address*: ${vehicleStatus.modem.ip_address}\n*IMEI*: ${vehicleStatus.modem.IMEI}\n*IMSI*: ${vehicleStatus.modem.IMSI}\n\n*--- Status Relay ---*\n*Switch Kontak*: ${relayStatus.toUpperCase()}\n\n*---- Status GPS ----*\n*Latitude*: ${vehicleStatus.location.lat}\n*Longitude*: ${vehicleStatus.location.lng}\n- ${locationParseTimestamp}`;

      return message;
   } catch (e) {
      console.log(e);
      return 'Error when getting Vehicle Status';
   }
};
