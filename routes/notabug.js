import express from 'express';
const router = express.Router();

import { NotabugMiddleware } from '../controllers/notabug/NotabugMiddleware.js';
import { AuthController } from '../controllers/notabug/AuthController.js';
import { DashboardController } from '../controllers/notabug/DashboardController.js';
import { BugController } from '../controllers/notabug/BugController.js';
import { ReportController } from '../controllers/notabug/ReportController.js';
import { ProfileController } from '../controllers/notabug/ProfileController.js';
import { SystemController } from '../controllers/notabug/SystemController.js';

router.use(NotabugMiddleware.loadUser);

router.get('/', DashboardController.getDashboard);

router.get('/register', AuthController.getRegister);
router.post('/register', AuthController.postRegister);

router.get('/login', AuthController.getLogin);
router.post('/login', AuthController.postLogin);

router.get('/logout', AuthController.logout);

router.get('/bug/:id', BugController.getBug);
router.post('/bug/:id/claim', BugController.postClaim);
router.post('/bug/:id/fix', BugController.postFix);

router.get('/report', ReportController.getReport);
router.post('/report', ReportController.postReport);

router.get('/profile/:username', ProfileController.getProfile);

router.post('/system/tick', SystemController.tick);

export default router;