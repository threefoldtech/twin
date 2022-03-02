export interface Message<T> {
    chatId: string;
    from: string;
    to: string;
    body: T;
    timestamp: string;
    type: MessageType;
    subject: string;
    signatures: string[];
    replies: Message<T>[];
}

export enum MessageType {
    STRING,
    SYSTEM,
    GIF,
    MESSAGE,
    FILE,
    FILE_UPLOAD,
    FILE_SHARE,
    FILE_SHARE_UPDATE,
    FILE_SHARE_REQUEST,
    FILE_SHARE_INTENT,
    EDIT,
    READ,
    CONTACT_REQUEST,
    DELETE,
    GROUP_UPDATE,
    QUOTE,
    DOWNLOAD_ATTACHMENT,
}
