import { Router } from 'express';
import * as store from '../store';
import { LoginDTO } from '../types';

const router = Router();

// POST /api/auth/login  { email }
// OBS: autenticação simplificada por e-mail, sem senha — adequada para o
// estágio atual (mock) do projeto. Trocar por JWT + hash de senha antes
// de qualquer uso em produção.
router.post('/login', (req, res) => {
  const { email }: LoginDTO = req.body;
  if (!email) return res.status(400).json({ error: 'email é obrigatório' });

  const user = store.getUserByEmail(email);
  if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });

  res.json(user);
});

export default router;
