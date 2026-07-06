import { Router } from 'express';
import * as store from '../store';
import { firebaseAuth } from '../firebaseAdmin';

const router = Router();

const ALLOWED_DOMAINS = ['sou.ufmt.br'];

function isAllowedEmail(email?: string | null): boolean {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
}

// POST /api/auth/sync  { idToken, name? }
// Verifica o ID token e sincroniza o usuário com o banco local: se já existe,
// retorna o perfil existente; se é o primeiro acesso, cria um perfil novo.
router.post('/sync', async (req, res) => {
  const { idToken, name } = req.body as { idToken?: string; name?: string };
  if (!idToken) return res.status(400).json({ error: 'idToken é obrigatório' });

  let decoded;
  try {
    decoded = await firebaseAuth.verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }

  if (!isAllowedEmail(decoded.email)) {
    return res.status(403).json({ error: 'Use um e-mail institucional (@sou.ufmt.br)' });
  }

  let user = await store.getUserByEmail(decoded.email!);

  if (!user) {
    user = await store.createUser({
      id: decoded.uid,
      name: name || decoded.name || decoded.email!.split('@')[0],
      email: decoded.email!,
      avatar: decoded.picture || '',
      course: 'Ciência da Computação',
      bio: 'Olá pessoal, eu estou aqui no Timelens!',
      role: 'user',
      joinDate: new Date().toISOString(),
    });
  }

  res.json(user);
});

export default router;