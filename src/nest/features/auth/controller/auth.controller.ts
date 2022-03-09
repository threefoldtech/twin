import { Controller, Get, Query, Req, Res, Session, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';

import { AuthGuard } from '../../../guards/auth.guard';
import { LocationService } from '../../location/service/location.service';
import { YggdrasilService } from '../../yggdrasil/service/yggdrasil.service';
import { AuthService } from '../service/auth.service';
import { SignInQuery } from '../types/queries';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly _authService: AuthService,
        private readonly _yggdrasilService: YggdrasilService,
        private readonly _locationService: LocationService
    ) {}

    @Get('authenticated')
    @UseGuards(AuthGuard)
    async isLoggedIn(@Req() req: Request, @Res() res: Response) {
        return res.json({
            status: !!req.session.userId,
        });
    }

    @Get('signin')
    async signIn(@Session() session: Record<string, unknown>, @Res() res: Response, @Query() query: SignInQuery) {
        const appLogin = await this._authService.getAppLogin('/api/auth/callback');
        session.state = appLogin.loginState;
        const loginUrl = (appLogin.loginUrl += `&username=${query.username}`);
        res.redirect(loginUrl);
    }

    @Get('callback')
    async authCallback(@Req() req: Request, @Res() res: Response) {
        const appLogin = await this._authService.getAppLogin();
        const redirectUrl = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
        const profileData = await this._authService.getProfileData({ redirectUrl, sessionState: appLogin.loginState });

        delete req.session.state;

        if (!this._yggdrasilService.isInitialised())
            await this._yggdrasilService.setupYggdrasil(profileData.derivedSeed);

        const yggdrasilAddress = await this._locationService.getOwnLocation();
        await this._locationService.registerDigitalTwin({
            doubleName: profileData.doubleName,
            derivedSeed: profileData.derivedSeed,
            yggdrasilAddress: <string>yggdrasilAddress,
        });

        req.session.userId = profileData.userId;
        req.session.save(() => {
            res.redirect('/callback');
        });
    }
}
