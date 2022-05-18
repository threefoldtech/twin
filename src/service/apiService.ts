import axios, { ResponseType } from 'axios';

import Message from '../models/message';
import { MessageBodyTypeInterface, SOCIAL_POST, StatusUpdate } from '../types';
import { parseFullChat } from './chatService';
import { getFullIPv6ApiLocation } from './urlService';

export const sendMessageToApi = async (
    location: string,
    message: Message<MessageBodyTypeInterface>,
    requestResponseType?: ResponseType
) => {
    const url = getFullIPv6ApiLocation(location, '/v1/messages');
    try {
        return await axios.put(url, message, {
            responseType: requestResponseType || 'json',
        });
    } catch (e) {
        // console.error(`couldn't send message ${url}`, e);
    }
};

/**
 * Sends your status (on/offline) to given location.
 * @param {Object} obj - Object.
 * @param {string} obj.location - Location to send status to.
 * @param {StatusUpdate} obj.status - Updated status.
 */
export const sendStatusUpdate = async ({
    location,
    status,
    responseType,
}: {
    location: string;
    status: StatusUpdate;
    responseType?: ResponseType;
}) => {
    const url = getFullIPv6ApiLocation(location, '/v1/user/update-status');
    try {
        return await axios.put(url, status, {
            responseType: responseType || 'json',
        });
    } catch (error) {}
};

export const sendPostToApi = async (location: string, post: SOCIAL_POST) => {
    const url = getFullIPv6ApiLocation(location, '/v1/posts');
    try {
        return await axios.put(url, post);
    } catch (e) {
        // console.error('failed to send post', e);
    }
};

export const getPublicKey = async (location: string): Promise<string | undefined> => {
    const url = getFullIPv6ApiLocation(location, '/v1/user/publickey');
    try {
        const response = await axios.get(url);
        return response.data as string;
    } catch (e) {
        console.log(`couldn't get publickey ${url}`);
        return;
    }
};

export const getChatfromAdmin = async (adminLocation: string, chatId: string) => {
    const url = getFullIPv6ApiLocation(adminLocation, `/v1/messages/${chatId}`);

    try {
        console.log('getting chat from ', url);
        const chat = await axios.get(url);
        const parsedChat = parseFullChat(chat.data);
        return parsedChat;
    } catch {
        console.log('failed to get chat from admin');
        throw Error;
    }
    throw Error;
};
