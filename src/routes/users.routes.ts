import { Router } from 'express';
import * as store from '../store';

const router = Router();

// GET /api/users
router.get('/',  async (req, res) => {
  res.json(await store.getUsers());
});

// GET /api/users/:id
 router.get('/:id',  async (req, res) =>  {
  const user = await store.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(user);
});

// GET /api/users/:id/posts
router.get('/:id/posts',  async (req, res) => {
  const posts = await store.getPosts({ authorId: req.params.id });
  res.json(posts);
});

export default router;
