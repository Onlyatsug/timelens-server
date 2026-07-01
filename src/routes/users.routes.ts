import { Router } from 'express';
import * as store from '../store';

const router = Router();

// GET /api/users
router.get('/', (req, res) => {
  res.json(store.getUsers());
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
  const user = store.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(user);
});

// GET /api/users/:id/posts
router.get('/:id/posts', (req, res) => {
  const posts = store.getPosts({ authorId: req.params.id });
  res.json(posts);
});

export default router;
