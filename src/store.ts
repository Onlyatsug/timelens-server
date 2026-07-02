// src/store.ts
import { db } from './firebaseAdmin';
import { v4 as uuid } from 'uuid';
import { User, CampusLocation, Post, Comment, Notification } from './types';

// ⚡ CACHE EM MEMÓRIA (Consome poucos MBs e evita leituras repetidas)
let usersCache: Map<string, User> = new Map();
let locationsCache: Map<string, CampusLocation> = new Map();
let postsCache: Map<string, Post> = new Map();
let commentsCache: Map<string, Comment> = new Map();
let notificationsCache: Map<string, Notification> = new Map();
let tagsCache: Set<string> = new Set();

// 🔥 FUNÇÃO DE INICIALIZAÇÃO (Roda apenas quando o servidor liga)
export async function initializeServerCache() {
  console.log('⚡ [Cache] Iniciando pré-carregamento de dados do Firestore...');
  try {
    const [usersSnap, locationsSnap, postsSnap, commentsSnap, notificationsSnap, tagsSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('locations').get(),
      db.collection('posts').get(),
      db.collection('comments').get(),
      db.collection('notifications').get(),
      db.collection('metadata').doc('tags').get()
    ]);

    usersSnap.docs.forEach(d => usersCache.set(d.id, d.data() as User));
    locationsSnap.docs.forEach(d => locationsCache.set(d.id, d.data() as CampusLocation));
    postsSnap.docs.forEach(d => postsCache.set(d.id, d.data() as Post));
    commentsSnap.docs.forEach(d => commentsCache.set(d.id, d.data() as Comment));
    notificationsSnap.docs.forEach(d => notificationsCache.set(d.id, d.data() as Notification));
    
    if (tagsSnap.exists) {
      (tagsSnap.data()?.all || []).forEach((t: string) => tagsCache.add(t));
    }

    console.log(`✅ [Cache] Pré-carregamento concluído com sucesso!`);
    console.log(`📊 Status: ${usersCache.size} Users | ${postsCache.size} Posts | ${locationsCache.size} Locations`);
  } catch (error) {
    console.error('❌ [Cache] Erro ao pré-carregar dados:', error);
  }
}

// ---------- Usuários (Otimizados) ----------
export async function getUsers(): Promise<User[]> {
  return Array.from(usersCache.values());
}

export async function getUserById(id: string): Promise<User | undefined> {
  return usersCache.get(id);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  return Array.from(usersCache.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
}

export async function createUser(data: Omit<User, 'id'> & { id?: string }): Promise<User> {
  const id = data.id ?? uuid();
  const newUser: User = { ...data, id };
  
  await db.collection('users').doc(id).set(newUser); // Salva no Firebase
  usersCache.set(id, newUser); // Atualiza o cache imediatamente
  return newUser;
}

export async function updateUser(id: string, data: Partial<Omit<User, 'id'>>): Promise<User | undefined> {
  const currentUser = usersCache.get(id);
  if (!currentUser) return undefined;

  const updatedUser = { ...currentUser, ...data };
  await db.collection('users').doc(id).update(data); // Firebase
  usersCache.set(id, updatedUser); // Cache
  return updatedUser;
}

// ---------- Locais (Otimizados) ----------
export async function createLocation(dto: any): Promise<CampusLocation> {
  const id = uuid(); // Gera um ID único para o novo local do campus
  
  const newLocation: CampusLocation = {
    id,
    name: dto.name,
    shortName: dto.shortName,
    description: dto.description ?? 'Local adicionado pela comunidade',
    lat: dto.lat,
    lng: dto.lng,
    x: dto.x ?? 100,
    y: dto.y ?? 100,
    width: dto.width ?? 50,
    height: dto.height ?? 50
  };

  // 1. Salva de forma permanente no Firestore
  await db.collection('locations').doc(id).set(newLocation);
  
  // 2. Atualiza o cache do servidor instantaneamente (0 leituras adicionais)
  locationsCache.set(id, newLocation);

  console.log(`📍 [Cache] Novo local criado e mapeado: ${newLocation.shortName}`);
  return newLocation;
}

export async function getLocations(): Promise<CampusLocation[]> {
  return Array.from(locationsCache.values());
}

export async function getLocationById(id: string): Promise<CampusLocation | undefined> {
  return locationsCache.get(id);
}

// ---------- Posts / Memórias (Otimizados) ----------
export interface PostFilters {
  tag?: string;
  locationId?: string;
  authorId?: string;
  type?: string;
  search?: string;
}
export async function getPostById(id: string): Promise<Post | undefined> {
  return postsCache.get(id);
}

// Seu método de getPosts antigo/atualizado para o cache
export async function getPosts(filters: PostFilters = {}): Promise<Post[]> {
  let results = Array.from(postsCache.values());

  if (filters.tag) {
    results = results.filter(p => p.tags.includes(filters.tag!));
  }
  if (filters.locationId) {
    results = results.filter(p => p.locationId === filters.locationId);
  }
  if (filters.authorId) {
    results = results.filter(p => p.authorId === filters.authorId);
  }
  if (filters.type) {
    results = results.filter(p => p.type === filters.type);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q));
  }

  return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createPost(dto: any): Promise<Post> {
  const id = uuid();
  const post: Post = {
    id,
    title: dto.title,
    content: dto.content,
    image: dto.image ?? '',
    eventDate: dto.eventDate,
    createdAt: new Date().toISOString(),
    authorId: dto.authorId,
    locationId: dto.locationId,
    tags: dto.tags ?? [],
    likes: 0,
    likedBy: [],
    type: dto.type,
  };

  await db.collection('posts').doc(id).set(post); // Firebase
  postsCache.set(id, post); // Cache

  if (post.tags.length > 0) {
    post.tags.forEach(t => tagsCache.add(t));
    await db.collection('metadata').doc('tags').set({ all: Array.from(tagsCache) });
  }

  return post;
}

export async function updatePost(id: string, dto: any): Promise<Post | undefined> {
  const currentPost = postsCache.get(id);
  if (!currentPost) return undefined;

  const updatedPost = { ...currentPost, ...dto };
  await db.collection('posts').doc(id).update(dto);
  postsCache.set(id, updatedPost);
  return updatedPost;
}

export async function deletePost(id: string): Promise<boolean> {
  if (!postsCache.has(id)) return false;

  await db.collection('posts').doc(id).delete();
  postsCache.delete(id);

  // Limpa comentários do post deletado
  const commentsArray = Array.from(commentsCache.values()).filter(c => c.postId === id);
  const batch = db.batch();
  commentsArray.forEach(c => {
    batch.delete(db.collection('comments').doc(c.id));
    commentsCache.delete(c.id);
  });
  await batch.commit();

  return true;
}

export async function toggleLike(postId: string, userId: string): Promise<Post | undefined> {
  const post = postsCache.get(postId);
  if (!post) return undefined;

  const alreadyLiked = post.likedBy.includes(userId);
  if (alreadyLiked) {
    post.likedBy = post.likedBy.filter(id => id !== userId);
    post.likes = Math.max(0, post.likes - 1);
  } else {
    post.likedBy.push(userId);
    post.likes += 1;
  }

  await db.collection('posts').doc(postId).set(post);
  postsCache.set(postId, post); // Atualiza a referência no cache
  return post;
}

// --- Compatibilidade das rotas anteriores ---
export async function getPostsByLocation(locationId: string): Promise<Post[]> {
  return getPosts({ locationId });
}

export async function getPostsByUser(userId: string): Promise<Post[]> {
  return getPosts({ authorId: userId });
}

// ---------- Comentários (Otimizados em Cache) ----------
export async function getCommentsByPost(postId: string): Promise<Comment[]> {
  const comments = Array.from(commentsCache.values()).filter(c => c.postId === postId);
  return comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function createComment(postId: string, dto: any): Promise<Comment | undefined> {
  const post = postsCache.get(postId);
  if (!post) return undefined;

  const id = uuid();
  const comment: Comment = {
    id,
    postId,
    authorId: dto.authorId,
    content: dto.content,
    createdAt: new Date().toISOString(),
  };

  

  await db.collection('comments').doc(id).set(comment); // Firebase
  commentsCache.set(id, comment); // Cache

  // Dispara notificação se não for o próprio autor comentando
  if (post.authorId !== dto.authorId) {
    const author = usersCache.get(dto.authorId);
    await createNotification({
      userId: post.authorId,
      type: 'comment',
      body: `${author?.name ?? 'Alguém'} comentou: "${dto.content.slice(0, 60)}"`,
      postId: post.id,
    });
  }

  return comment;
}

// Garanta que estes também estejam no arquivo caso o front peça dados específicos:

export async function getCommentById(id: string): Promise<Comment | undefined> {
  return commentsCache.get(id);
}



export async function deleteComment(id: string): Promise<boolean> {
  if (!commentsCache.has(id)) return false;

  await db.collection('comments').doc(id).delete();
  commentsCache.delete(id);
  return true;
}


// ---------- Notificações (Otimizadas em Cache) ----------

// 🔥 Essa é a função que a sua rota de notificações está sentindo falta!
export async function getNotificationsByUser(userId: string): Promise<Notification[]> {
  const notifications = Array.from(notificationsCache.values()).filter(n => n.userId === userId);
  return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// 🔥 Alias caso alguma rota antiga chame apenas por getNotifications
export async function getNotifications(userId: string): Promise<Notification[]> {
  return getNotificationsByUser(userId);
}

export async function getNotificationById(id: string): Promise<Notification | undefined> {
  return notificationsCache.get(id);
}

export async function createNotification(
  data: Omit<Notification, 'id' | 'createdAt' | 'read'>
): Promise<Notification> {
  const id = uuid();
  const notification: Notification = {
    id,
    createdAt: new Date().toISOString(),
    read: false,
    ...data,
  };

  await db.collection('notifications').doc(id).set(notification); // Firebase
  notificationsCache.set(id, notification); // Cache
  return notification;
}

export async function markNotificationRead(id: string): Promise<Notification | undefined> {
  const notification = notificationsCache.get(id);
  if (!notification) return undefined;

  notification.read = true;
  await db.collection('notifications').doc(id).update({ read: true }); // Firebase
  notificationsCache.set(id, notification); // Cache
  return notification;
}

// Alias caso a rota use o padrão snake-case ou camelCase diferente
export async function markNotificationAsRead(id: string): Promise<Notification | undefined> {
  return markNotificationRead(id);
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const userNotifications = Array.from(notificationsCache.values())
    .filter(n => n.userId === userId && !n.read);

  const batch = db.batch();
  userNotifications.forEach(n => {
    n.read = true;
    batch.update(db.collection('notifications').doc(n.id), { read: true });
    notificationsCache.set(n.id, n); // Atualiza cache individualmente
  });
  
  await batch.commit();
  return userNotifications.length;
}

// Alias para bater com a chamada antiga
export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  return markAllNotificationsRead(userId);
}

export async function getAllTags(): Promise<string[]> {
  // Converte o Set de tags em um array e ordena em ordem alfabética
  return Array.from(tagsCache).sort();
}