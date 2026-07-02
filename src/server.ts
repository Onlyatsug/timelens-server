import app from './app';
import { initializeServerCache } from './store';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(PORT, async () => {
  console.log(`🔭 Timelens backend rodando em http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);

  await initializeServerCache();
});
