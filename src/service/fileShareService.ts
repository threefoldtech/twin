import { getShareConfig, persistShareConfig } from './dataService';
import { uuidv4 } from '../common';
import { createJwtToken } from './jwtService';
import { Permission, TokenData } from '../store/tokenStore';
import { ShareError, ShareErrorType } from '../types/errors/shareError';
import { shareStatus } from '../routes/filebrowser';
import { log } from 'winston';

interface ShareInterface {
    isPublic: boolean;
    userId: string | undefined;
    token: string | undefined,
    expiration?: number;
}

export interface FileSharesInterface {
    Shared: {
        [id: string]: {
            path: string;
            filename: string | undefined;
            size: number | undefined;
            shares: ShareInterface[];
        }
    }
    SharedWithMe: {
        [id: string]: {
            path: string | undefined;
            filename: string | undefined;
            size: number | undefined;
            shares: ShareInterface[];
        }
    }
}

export interface ShareTokenData extends TokenData {
    id: string;
    userId: string;
}

export interface ShareWithIdInterface extends ShareInterface {
    id: string;
}

function epoch(date: Date = new Date()) {
    return (new Date(date)).getTime();
}

function epochToDate(epoch: number) {
    if (epoch < 10000000000)
        epoch *= 1000; // convert to milliseconds (Epoch is usually expressed in seconds, but Javascript uses Milliseconds)
    epoch = epoch + (new Date().getTimezoneOffset() * -1); //for timeZone
    return new Date(epoch);
}

export const removeExpiredShares = (config: FileSharesInterface) => {
    for (const key in config[shareStatus.Shared]) {
        const value = config[shareStatus.Shared][key];
        value.shares = value.shares.filter(s => !s.expiration || (s.expiration && s.expiration < epoch()));
    }
    for (const key in config[shareStatus.SharedWithMe]) {
        const value = config[shareStatus.SharedWithMe][key];
        value.shares = value.shares.filter(s => !s.expiration || (s.expiration && s.expiration < epoch()));
    }
};
export const updateSharePath = (config: FileSharesInterface, path: string, newPath: string) => {
    for (const key in config[shareStatus.Shared]) {
        if (config[shareStatus.Shared][key].path === path) {

            config[shareStatus.Shared][key].path = newPath;
            persistShareConfig(config)
        }
    }
};

export const removeShare = (config: FileSharesInterface, path: string) => {
    for (const key in config[shareStatus.Shared]) {
        if(config[shareStatus.Shared][key].path === path){
            delete config[shareStatus.Shared][key]
            persistShareConfig(config)
        }
    }
};

export const initFileShares = () => {
    let config = getShareConfig();
    removeExpiredShares(config);
    persistShareConfig(config);
};

export const getPathId = (config: FileSharesInterface, path: string, shareStatus: shareStatus): string => {
    return Object.keys(config[shareStatus]).find(x => {
        const share = config[shareStatus][x];
        return share.path === path;
    });
};

export const getShare = (config: FileSharesInterface, path: string, userId: string, shareStatus: shareStatus): ShareWithIdInterface => {
    let index = getPathId(config, path, shareStatus);
    if (!index) return;
    return {
        id: index,
        ...config[shareStatus][index].shares.find(x => !userId ? x.isPublic : x.userId === userId),
    } as ShareWithIdInterface;
};
export const getShareWithId = (config: FileSharesInterface, id: string, shareStatus: shareStatus): { path: string; shares: ShareInterface[] } => {
    let index = id;
    if (!config[shareStatus][index])
        throw new Error(`Share no longer exists`);
    return config[shareStatus][index];

};
export const shareExists = (config: FileSharesInterface, id: string, shareStatus: shareStatus): string => {
    let index = id;
    if (!config[shareStatus][index])
        return;
    return index;

};

export const appendShare = (config: FileSharesInterface, path: string, filename: string, size: number, shareStatus: shareStatus, givenIndex: string, share: ShareInterface): ShareWithIdInterface => {
    let index = shareExists(config, path, shareStatus);
    if (!index) {
        givenIndex === undefined ? index = uuidv4() : index = givenIndex;
        config[shareStatus][index] = {
            path: path,
            filename: filename,
            size: size,
            shares: [share],
        };
    } else {
        const shares = config[shareStatus][index].shares;
        const alreadyExists = shares.some(x => x.userId === share.userId);
        if (alreadyExists)
            throw new Error(`Share for user ${share.userId ?? 'public'} already exists`);
    }
    return {
        id: index,
        ...share,
    } as ShareWithIdInterface;
};

// export const updateShare = (config: FileSharesInterface, path: string, userId: string | undefined, expiration?: number, writable?: boolean) => {
//     let index = getPathId(config, path);
//     if (!index)
//         throw new Error(`Share for user ${userId ?? 'public'} does not exists`);
//     const share = config[index].shares.find(x => !userId ? x.isPublic : x.userId === userId);
//
//     if (expiration !== undefined)
//         share.expiration = expiration === 0 ? undefined : expiration;
//
//     if (writable !== undefined)
//         share.writable = writable;
//
//     return {
//         id: index,
//         ...share,
//     };
// };

// export const deleteShare = (config: FileSharesInterface, path: string, userId?: string) => {
//     let index = getPathId(config, path);
//     if (!index)
//         return;
//
//     config[index].shares = config[index].shares.filter(x => !userId ? !x.isPublic : x.userId !== userId);
// };

export const createShare = (path: string, filename: string | undefined, size: number | undefined, userId: string | undefined, token: string | undefined, isPublic: boolean, writable: boolean, shareStatus: shareStatus) => {
    const config = getShareConfig();
    let share = getShare(config, path, undefined, shareStatus);
    if (!share)
        share = appendShare(config, path, filename, size, shareStatus, undefined, {
            isPublic: isPublic,
            token: token,
            expiration: isPublic ? epoch() + (15 * 60 * 1000) : undefined,
            userId: userId,
        });
    if (share)
        share = {
            id: share.id,
            isPublic: isPublic,
            token: token,
            expiration: isPublic ? epoch() + (15 * 60 * 1000) : undefined,
            userId: userId,
        };
    const permissions = [Permission.FileBrowserRead];
    if (writable)
        permissions.push(Permission.FileBrowserWrite);
    persistShareConfig(config);
    return createJwtToken({
        id: share.id,
        userId: share.userId,
        permissions: permissions,
    } as ShareTokenData);
};

export const getShareFromToken = (tokenData: ShareTokenData) => {
    const config = getShareConfig();
    const shareConfig = config['Shared'][tokenData.id];
    if (!shareConfig)
        throw new ShareError(ShareErrorType.ShareNotFound);

    const share = shareConfig.shares.find(x => x.userId === tokenData.userId);
    if (!share)
        throw new ShareError(ShareErrorType.ShareNotFound);

    if (share.expiration && share.expiration < epoch())
        throw new ShareError(ShareErrorType.ShareExpired);

    return {
        ...share,
        id: tokenData.id,
        path: shareConfig.path,
    };
};

export const getSharesWithme = (shareStatus: shareStatus) => {
    const config = getShareConfig();
    return config[shareStatus];
};