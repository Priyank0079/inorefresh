import { Router } from 'express';
import { login, signupHoreca, signupRetailer } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/signup-horeca', signupHoreca);
router.post('/signup-retailer', signupRetailer);

export default router;
