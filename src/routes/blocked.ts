import express, { Router } from 'express';

import { requiresAuthentication } from '../middlewares/authenticationMiddleware';
import { getBlocklist, persistBlocklist } from '../service/dataService';

const router = Router();

router.delete('/:name', requiresAuthentication, (req: express.Request, res: express.Response) => {
    persistBlocklist(getBlocklist().filter(b => b != req.params.name));
    res.json({ status: 'success' });
});

export default router;
