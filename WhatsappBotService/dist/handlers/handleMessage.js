import { sendMessageWTyping } from '../utils/messageUtils.js';
import { isUserInitialized, initializeUser, getUserVehicleId, } from '../services/firebaseService.js';
import { formatVehicleLocation, formatVehicleStatusMessage, helpMessage, initializeExampleMessage, successInitializeMessage, unitializedMessage, } from '../messages/messageComposer.js';
// Command handlers
const commands = {
    init: async (sock, jid, senderName, args) => {
        const vehicleId = args[0];
        if (!vehicleId) {
            await sendMessageWTyping(sock, {
                text: initializeExampleMessage(),
            }, jid);
            return;
        }
        await initializeUser(jid, vehicleId);
        const message = await successInitializeMessage(senderName, vehicleId);
        await sendMessageWTyping(sock, {
            text: message,
        }, jid);
    },
    help: async (sock, jid, username) => {
        const [context, formattedMessage] = await helpMessage(username);
        await sendMessageWTyping(sock, {
            text: formattedMessage,
            contextInfo: context,
        }, jid);
    },
    test: async (sock, jid) => {
        await sendMessageWTyping(sock, { text: 'Hello test!' }, jid);
    },
    cik: async (sock, jid) => {
        await sendMessageWTyping(sock, { text: 'Hello cak!' }, jid);
    },
    location: async (sock, jid) => {
        const vehicleId = await getUserVehicleId(jid);
        await sendMessageWTyping(sock, { location: await formatVehicleLocation(vehicleId) }, jid);
    },
    status: async (sock, jid) => {
        const vehicleId = await getUserVehicleId(jid);
        await sendMessageWTyping(sock, { text: await formatVehicleStatusMessage(vehicleId) }, jid);
    },
};
export const commandMiddleware = async (sock, jid, command, username, args, handler) => {
    if (command !== 'init') {
        const isInitialized = await isUserInitialized(jid);
        if (!isInitialized) {
            await sendMessageWTyping(sock, {
                text: unitializedMessage(),
            }, jid);
            return;
        }
    }
    await handler(sock, jid, username, args);
};
export const handleMessage = async (body, username, jid, sock) => {
    try {
        const prefix = body[0];
        if (!['/', '!', '#', '.'].includes(prefix))
            return;
        const [command, ...args] = body.slice(1).trim().split(/ +/);
        const handler = commands[command?.toLowerCase()];
        if (handler) {
            await commandMiddleware(sock, jid, command, username, args, handler);
        }
        else {
            await sendMessageWTyping(sock, { text: 'Ketikkan /help untuk melihat commands.' }, jid);
        }
    }
    catch (error) {
        console.error('Error handling message:', { body, jid, error });
    }
};
