import app from './app';
import { ensureCacheReady } from './store';

// ⚠️ Este arquivo só é usado em desenvolvimento local (npm run dev / npm start).
// Na Vercel, o entrypoint é api/index.ts, que exporta o `app` diretamente
// como serverless function — o app.listen() abaixo nunca é chamado lá.
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(PORT, async () => {
  console.log(`🔭 Timelens backend rodando em http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);

  await ensureCacheReady();
});
