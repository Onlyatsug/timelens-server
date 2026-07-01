import { Router } from 'express';
import * as store from '../store';

const router = Router();

// GET /api/notifications?userId=u2
router.get('/', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId é obrigatório como query param' });
  res.json(store.getNotificationsByUser(userId as string));
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', (req, res) => {
  const notification = store.markNotificationRead(req.params.id);
  if (!notification) return res.status(404).json({ error: 'Notificação não encontrada' });
  res.json(notification);
});

// PATCH /api/notifications/read-all  { userId }
router.patch('/read-all', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId é obrigatório' });
  const count = store.markAllNotificationsRead(userId);
  res.json({ marked: count });
});

export default router;
