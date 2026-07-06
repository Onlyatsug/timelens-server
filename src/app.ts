import express from 'express';
import cors from 'cors';

// routes
import usersRoutes from './routes/users.routes';
import locationsRoutes from './routes/locations.routes';
import postsRoutes from './routes/posts.routes';
import commentsRoutes from './routes/comments.routes';
import notificationsRoutes from './routes/notifications.routes';
import tagsRoutes from './routes/tags.routes';
import authRoutes from './routes/auth.routes';

// mdwares
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import dotenv from 'dotenv';

const app = express();
dotenv.config(); 

app.use(cors());
app.use(express.json());

// upload limitation
app.use(express.json({ limit: '14mb' }));
app.use(express.urlencoded({ limit: '14mb', extended: true }));

// check de saúde
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'timelens-backend' });
});

app.use('/api/users', usersRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/auth', authRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
