import { Router } from 'express';
import * as store from '../store';

const router = Router();

// GET /api/locations
router.get('/', (req, res) => {
  res.json(store.getLocations());
});

// GET /api/locations/:id
router.get('/:id', (req, res) => {
  const location = store.getLocationById(req.params.id);
  if (!location) return res.status(404).json({ error: 'Local não encontrado' });
  res.json(location);
});

// GET /api/locations/:id/posts
router.get('/:id/posts', (req, res) => {
  const location = store.getLocationById(req.params.id);
  if (!location) return res.status(404).json({ error: 'Local não encontrado' });
  res.json(store.getPostsByLocation(req.params.id));
});

export default router;
