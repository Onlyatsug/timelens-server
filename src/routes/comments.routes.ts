import { Router } from 'express';
import * as store from '../store';

const router = Router();

// DELETE /api/comments/:id
router.delete('/:id', (req, res) => {
  const deleted = store.deleteComment(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Comentário não encontrado' });
  res.status(204).send();
});

export default router;
