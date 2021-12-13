import axios, { AxiosRequestConfig, ResponseType } from 'axios';
import { config } from '../config/config';
import Message from '../models/message';
import { MessageBodyTypeInterface } from '../types';
import { parseFullChat } from './chatService';
import { getFullIPv6ApiLocation } from './urlService';
import { response } from 'express';

export const sendMessageToApi = async (
    location: string,
    message: Message<MessageBodyTypeInterface>,
    requestResponseType?: ResponseType
) => {
    //console.log('Location: ', location);
    //if (message.type !== 'READ') console.log('newMessage: ', message);
    const url = getFullIPv6ApiLocation(location, '/messages');
    try {
        return await axios.put(url, message, {
            responseType: requestResponseType || 'json',
        });
    } catch (e) {
        console.error(`couldn't send message ${url}`);
    }
};

export const getPublicKey = async (location: string): Promise<string | undefined> => {
    const url = getFullIPv6ApiLocation(location, '/user/publickey');
    try {
        const response = await axios.get(url);
        return response.data as string;
    } catch (e) {
        console.log(`couldn't get publickey ${url}`);
        return;
    }
};

export const getChatfromAdmin = async (adminLocation: string, chatId: string) => {
    const url = getFullIPv6ApiLocation(adminLocation, `/messages/${chatId}`);

    try {
        console.log('getting chat from ', url);
        const chat = await axios.get(url);
        const parsedChat = parseFullChat(chat.data);
        console.log(parsedChat);
        return parsedChat;
    } catch {
        console.log('failed to get chat from admin');
        throw Error;
    }
    throw Error;
};
