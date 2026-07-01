import { Router } from 'express';
import * as store from '../store';

const router = Router();

// GET /api/tags
router.get('/', (req, res) => {
  res.json(store.getAllTags());
});

// GET /api/tags/:tag/posts
router.get('/:tag/posts', (req, res) => {
  res.json(store.getPostsByTag(`#${req.params.tag.replace(/^#/, '')}`));
});

export default router;
