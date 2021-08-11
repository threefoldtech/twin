import { getShareConfig, persistShareConfig } from './dataService';
import { uuidv4 } from '../common';
import { createJwtToken } from './jwtService';
import { Permission, TokenData } from '../store/tokenStore';
import { ShareError, ShareErrorType } from '../types/errors/shareError';
import { log } from 'winston';
import { FileShareMessageType } from '../types';
import Message from '../models/message';

export enum ShareStatus {
    Shared = 'Shared',
    SharedWithMe = 'SharedWithMe'
}

enum SharePermission {
    Read = 'r',
    Write = 'w'
}
export interface SharePermissionInterface {
    userId: string | undefined;
    types: SharePermission[]
}

export interface SharedFileInterface {
    id: string
    path: string;
    name:string | undefined
    isFolder: Boolean;
    size: number | undefined;
    lastModified: number | undefined;
    permissions: SharePermissionInterface[];
}

export interface SharesInterface {
    Shared: SharedFileInterface[]
    SharedWithMe: SharedFileInterface[]
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

export const updateSharePath = (oldPath: string, newPath: string) => {
    const allShares = getShareConfig()
    const share = allShares.Shared.find(share => share.path == oldPath)
    if (!share) throw new Error(`Share doesn't exist`);
    console.log("check update", allShares)
    share.path = newPath
    console.log("has changed?", allShares)
    persistShareConfig(allShares)
};

export const removeShare = (path: string) => {
    const allShares = getShareConfig()
    const shareIndex = allShares.Shared.findIndex(share => share.path === path)
    if (!shareIndex) throw new Error(`Share doesn't exist`);
    allShares.Shared.splice(shareIndex,1)
    persistShareConfig(allShares)
};

// NOT used anymore?
// export const initFileShares = () => {
//     let config = getShareConfig();
//     // removeExpiredShares(config);
//     persistShareConfig(config);
// };

export const getShareByPath = (path: string, shareStatus: ShareStatus): SharedFileInterface => {
    const allShares = getShareConfig()
    const share = allShares[shareStatus].find(share => share.path === path);
    return share
};

// @todo rename to getShareByUserId
export const getShare = (path: string, userId: string, shareStatus: ShareStatus) => {
    const allShares = getShareConfig()
    const share = allShares[shareStatus].find(share => share.path === path);
    if (!share) throw new Error(`Share doesn't exist`);
    const userPermissions = share.permissions.find(permission => permission.userId === userId)
    return userPermissions
};
export const getShareWithId = (id: string, shareStatus: ShareStatus): SharedFileInterface => {
    const allShares = getShareConfig()
    return allShares[shareStatus].find(share => share.id === id);
};

export const appendShare = (status: ShareStatus, path: string,
    name:string | undefined,
    isFolder: Boolean,
    size: number | undefined,
    lastModified: number | undefined,
    permissions: SharePermissionInterface[]):SharedFileInterface => {
    
    const allShares = getShareConfig()
    let share = getShareByPath(path, status);
    if (!share) {
        allShares[status].push({
            id: uuidv4(),
            path,
            name,
            size,
            lastModified,
            isFolder,
            permissions,
        });
        persistShareConfig(allShares)
        return share
    }  

    share.path = path
    share.name = name
    share.isFolder = isFolder
    share.size = size
    share.lastModified = lastModified
    share.permissions = permissions
    
    persistShareConfig(allShares)
    return share
};

// export const updateShare = (config: SharedFileInterface, path: string, userId: string | undefined, expiration?: number, writable?: boolean) => {
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

// export const deleteShare = (config: SharedFileInterface, path: string, userId?: string) => {
//     let index = getPathId(config, path);
//     if (!index)
//         return;
//
//     config[index].shares = config[index].shares.filter(x => !userId ? !x.isPublic : x.userId !== userId);
// };

export const createShare = (path: string, name: string | undefined, isFolder: boolean, size: number | undefined, lastModified: number | undefined, userId: string | undefined, writable: boolean, shareStatus: ShareStatus, sharePermissions: SharePermissionInterface[]) => {
    const config = getShareConfig();
    const types = <SharePermission[]> [SharePermission.Read]
    if(writable) types.push(SharePermission.Write)
    
    const share = appendShare(shareStatus, path,name, isFolder, size, lastModified, sharePermissions)
    return share
};

// @todo tokens are not used anymore 
// export const getShareFromToken = (tokenData: ShareTokenData) => {
//     const config = getShareConfig();
//     const shareConfig = config['Shared'][tokenData.id];
//     if (!shareConfig)
//         throw new ShareError(ShareErrorType.ShareNotFound);

//     const share = shareConfig.permissions.find(x => x.userId === tokenData.userId);
//     if (!share)
//         throw new ShareError(ShareErrorType.ShareNotFound);

//     return {
//         ...share,
//         id: tokenData.id,
//         path: shareConfig.path,
//     };
// };

export const getSharesWithme = (status: ShareStatus) => {
    const config = getShareConfig();
    return config[status];
};

export const handleIncommingFileShare = (message: Message<FileShareMessageType>) => {
    const shareConfig = message.body
    appendShare(ShareStatus.SharedWithMe,shareConfig.path,shareConfig.name,shareConfig.isFolder,shareConfig.size,shareConfig.lastModified,shareConfig.permissions)
}