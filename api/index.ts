// api/index.ts
//
// Entrypoint usado pela Vercel. Diferente do server.ts (que sobe um servidor
// HTTP tradicional com app.listen), a Vercel espera que cada arquivo dentro
// de /api exporte um handler no formato (req, res). Um app Express já tem
// essa assinatura, então basta reexportá-lo por aqui.
//
// vercel.json redireciona todas as rotas (/api/*, e opcionalmente /*) para
// esta função, que internamente já tem as rotas /api/users, /api/posts etc.
import app from '../src/app';

export default app;
