import { Router } from 'express';
import { 
  handleCreateSession, 
  handleGetSessionInfo, 
  handleNotifyPhoneConnected, 
  handleRegenerateSession, 
  handleDeleteSession 
} from '../controllers/sessionController';
import { handleUploadFiles, handleGetSessionFiles, handleDeleteAllSessionFiles } from '../controllers/fileController';
import { sessionCreateLimiter, fileUploadLimiter } from '../middleware/rateLimiter';
import { validateUploadSession, uploadMiddleware } from '../middleware/fileValidation';

const router = Router();

router.post('/', sessionCreateLimiter, handleCreateSession);
router.get('/:token', handleGetSessionInfo);
router.post('/:token/notify-connected', handleNotifyPhoneConnected);
router.post('/:token/regenerate', handleRegenerateSession);
router.delete('/:token', handleDeleteSession);

router.post(
  '/:token/files',
  fileUploadLimiter,
  validateUploadSession,
  uploadMiddleware.array('files', 20),
  handleUploadFiles
);
router.get('/:token/files', handleGetSessionFiles);
router.delete('/:token/files', handleDeleteAllSessionFiles);

export default router;
