import { Router } from 'express';
import { handleWhatsappWebhook } from '../controllers/whatsappController';

const router = Router();

router.post('/webhook', handleWhatsappWebhook);
router.post('/simulate', handleWhatsappWebhook);

export default router;
