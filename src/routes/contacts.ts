import { ContactRequest, DtIdInterface, MessageInterface, MessageTypes } from '../types/index';
import { parseMessage } from './../service/messageService';
import express, { Router } from 'express';
import Contact from '../models/contact';
import Message from '../models/message';
import { config } from '../config/config';
import { contacts } from '../store/contacts';
import { sendMessageToApi } from '../service/apiService';
import { MessageBodyTypeInterface } from '../types';
import { addChat } from '../service/chatService';
import { uuidv4 } from '../common';
import { sendEventToConnectedSockets } from '../service/socketService';
import { getMyLocation } from '../service/locationService';
import { appendSignatureToMessage } from '../service/keyService';
import { requiresAuthentication } from '../middlewares/authenticationMiddleware';

const router = Router();

export default router;
