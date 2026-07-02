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

// POST /api/locations (Nova rota para criar local)
router.post('/', (req, res) => {
  const { name, shortName, description, lat, lng, x, y, width, height } = req.body;

  // Validação básica
  if (!name || !shortName || !lat || !lng) {
    return res.status(400).json({ error: 'Campos name, shortName, lat e lng são obrigatórios.' });
  }

  // Cria o novo local usando o store
  const newLocation = store.createLocation({
    name,
    shortName,
    description: description || '',
    lat,
    lng,
    x: x || 0,
    y: y || 0,
    width: width || 50,
    height: height || 50
  });

  res.status(201).json(newLocation);
});

export default router;