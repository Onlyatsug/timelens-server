// este arquivo só é usado em desenvolvimento local (npm run dev / npm start).

import app from './app';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(PORT, () => {
  console.log(` Timelens backend rodando em http://localhost:${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
});
