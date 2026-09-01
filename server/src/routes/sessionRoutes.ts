import { Router } from 'express';
import { 
  handleCreateSession, 
  handleGetSessionInfo, 
  handleNotifyPhoneConnected, 
  handleRegenerateSession, 
  handleDeleteSession 
} from '../controllers/sessionController.ts';
import { handleUploadFiles, handleGetSessionFiles, handleDeleteAllSessionFiles } from '../controllers/fileController.ts';
import { sessionCreateLimiter, fileUploadLimiter } from '../middleware/rateLimiter.ts';
import { validateUploadSession, uploadMiddleware } from '../middleware/fileValidation.ts';

const router = Router();

router.post('/', sessionCreateLimiter, handleCreateSession);
router.get('/:token', handleGetSessionInfo);
router.post('/:token/notify-connected', handleNotifyPhoneConnected);
router.post('/:token/regenerate', handleRegenerateSession);
router.delete('/:token', handleDeleteSession);

// Session file routes
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
