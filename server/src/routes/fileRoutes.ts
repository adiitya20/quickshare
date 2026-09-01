import { Router } from 'express';
import { handleGetFileContent, handleDeleteSingleFile } from '../controllers/fileController';

const router = Router();

router.get('/:fileId', handleGetFileContent);
router.delete('/:fileId', handleDeleteSingleFile);

export default router;
