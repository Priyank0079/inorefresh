import { Router } from 'express';
import { login, signupHoreca, signupRetailer } from '../controllers/authController';
import { uploadMultipleDocuments, handleUploadError } from '../middleware/upload';

const router = Router();

router.post('/login', login);
router.post('/signup-horeca', uploadMultipleDocuments.array('documents', 10), handleUploadError, signupHoreca);
router.post('/signup-retailer', uploadMultipleDocuments.array('documents', 10), handleUploadError, signupRetailer);

export default router;
