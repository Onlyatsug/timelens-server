import { Router } from 'express';
import * as store from '../store';
import { CreatePostDTO, UpdatePostDTO, CreateCommentDTO, ToggleLikeDTO } from '../types';

const router = Router();

// GET /api/posts?tag=&locationId=&authorId=&type=&search=
router.get('/', (req, res) => {
  const { tag, locationId, authorId, type, search } = req.query;
  const posts = store.getPosts({
    tag: tag as string | undefined,
    locationId: locationId as string | undefined,
    authorId: authorId as string | undefined,
    type: type as string | undefined,
    search: search as string | undefined,
  });
  res.json(posts);
});

// GET /api/posts/:id
router.get('/:id', (req, res) => {
  const post = store.getPostById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Memória não encontrada' });
  res.json(post);
});

// POST /api/posts
router.post('/', (req, res) => {
  const dto: CreatePostDTO = req.body;

  if (!dto.title || !dto.content || !dto.authorId || !dto.locationId || !dto.eventDate || !dto.type) {
    return res.status(400).json({
      error: 'Campos obrigatórios: title, content, authorId, locationId, eventDate, type',
    });
  }
  if (!store.getUserById(dto.authorId)) {
    return res.status(400).json({ error: 'authorId inválido' });
  }
  if (!store.getLocationById(dto.locationId)) {
    return res.status(400).json({ error: 'locationId inválido' });
  }

  const post = store.createPost(dto);
  res.status(201).json(post);
});

// PUT /api/posts/:id
router.put('/:id', (req, res) => {
  const dto: UpdatePostDTO = req.body;
  const updated = store.updatePost(req.params.id, dto);
  if (!updated) return res.status(404).json({ error: 'Memória não encontrada' });
  res.json(updated);
});

// DELETE /api/posts/:id
router.delete('/:id', (req, res) => {
  const deleted = store.deletePost(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Memória não encontrada' });
  res.status(204).send();
});

// POST /api/posts/:id/like  { userId }
router.post('/:id/like', (req, res) => {
  const { userId }: ToggleLikeDTO = req.body;
  if (!userId) return res.status(400).json({ error: 'userId é obrigatório' });
  if (!store.getUserById(userId)) return res.status(400).json({ error: 'userId inválido' });

  const post = store.toggleLike(req.params.id, userId);
  if (!post) return res.status(404).json({ error: 'Memória não encontrada' });
  res.json(post);
});

// GET /api/posts/:id/comments
router.get('/:id/comments', (req, res) => {
  const post = store.getPostById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Memória não encontrada' });
  res.json(store.getCommentsByPost(req.params.id));
});

// POST /api/posts/:id/comments  { authorId, content }
router.post('/:id/comments', (req, res) => {
  const dto: CreateCommentDTO = req.body;
  if (!dto.authorId || !dto.content) {
    return res.status(400).json({ error: 'Campos obrigatórios: authorId, content' });
  }
  if (!store.getUserById(dto.authorId)) {
    return res.status(400).json({ error: 'authorId inválido' });
  }

  const comment = store.createComment(req.params.id, dto);
  if (!comment) return res.status(404).json({ error: 'Memória não encontrada' });
  res.status(201).json(comment);
});

export default router;
