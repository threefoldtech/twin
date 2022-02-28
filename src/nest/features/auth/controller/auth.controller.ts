import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

import { AuthService } from '../service/auth.service';
import { SignInQuery } from '../types/queries';

@Controller('auth')
export class AuthController {
    constructor(private readonly _authService: AuthService) {}

    @Get('signin')
    async signIn(@Req() req: Request, @Res() res: Response, @Query() query: SignInQuery): Promise<void> {
        const appLogin = await this._authService.getAppLogin(`/api/auth/callback`);
        req.session.state = appLogin.loginState;
        const loginUrl = (appLogin.loginUrl += `&username=${query.username}`);
        res.redirect(loginUrl);
    }

    @Get('callback')
    async authCallback(@Req() req: Request): Promise<void> {
        const appLogin = await this._authService.getAppLogin();
        const redirectUrl = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
        const profileData = await this._authService.getProfileData({ redirectUrl, sessionState: appLogin.loginState });

        delete req.session.state;
    }
}
