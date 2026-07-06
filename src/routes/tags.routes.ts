import { Router } from 'express';
import * as store from '../store';

const router = Router();

// GET /api/tags
router.get('/',  async (req, res) => {
  res.json(await store.getAllTags());
});

// GET /api/tags/:tag/posts
router.get('/:tag/posts', async  (req, res) => {
  res.json(await store.getPostsByTag(`#${req.params.tag.replace(/^#/, '')}`));
});

//to-do: ia-based tags

export default router;
