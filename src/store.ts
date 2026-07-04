// src/store.ts
import { db } from './firebaseAdmin';
import { v4 as uuid } from 'uuid';
import { User, CampusLocation, Post, Comment, Notification } from './types';

// Sem cache em memória: cada função lê/escreve direto no Firestore.
// (Cache será reintroduzido futuramente via Redis.)

// ---------- Usuários ----------
export async function getUsers(): Promise<User[]> {
  const snap = await db.collection('users').get();
  return snap.docs.map(d => d.data() as User);
}

export async function getUserById(id: string): Promise<User | undefined> {
  const doc = await db.collection('users').doc(id).get();
  return doc.exists ? (doc.data() as User) : undefined;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const snap = await db.collection('users')
    .where('email', '==', email.toLowerCase())
    .limit(1)
    .get();

  if (!snap.empty) {
    return snap.docs[0].data() as User;
  }

  // Fallback: caso o e-mail salvo não esteja normalizado em minúsculas
  const allSnap = await db.collection('users').get();
  const found = allSnap.docs.find(d => (d.data() as User).email.toLowerCase() === email.toLowerCase());
  return found ? (found.data() as User) : undefined;
}

export async function createUser(data: Omit<User, 'id'> & { id?: string }): Promise<User> {
  const id = data.id ?? uuid();
  const newUser: User = { ...data, id };

  await db.collection('users').doc(id).set(newUser);
  return newUser;
}

export async function updateUser(id: string, data: Partial<Omit<User, 'id'>>): Promise<User | undefined> {
  const ref = db.collection('users').doc(id);
  const doc = await ref.get();
  if (!doc.exists) return undefined;

  const currentUser = doc.data() as User;
  const updatedUser = { ...currentUser, ...data };
  await ref.update(data);
  return updatedUser;
}

// ---------- Locais ----------
export async function createLocation(dto: any): Promise<CampusLocation> {
  const id = uuid();

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

  await db.collection('locations').doc(id).set(newLocation);

  console.log(`📍 Novo local criado: ${newLocation.shortName}`);
  return newLocation;
}

export async function getLocations(): Promise<CampusLocation[]> {
  const snap = await db.collection('locations').get();
  return snap.docs.map(d => d.data() as CampusLocation);
}

export async function getLocationById(id: string): Promise<CampusLocation | undefined> {
  const doc = await db.collection('locations').doc(id).get();
  return doc.exists ? (doc.data() as CampusLocation) : undefined;
}

// ---------- Posts / Memórias ----------
export interface PostFilters {
  tag?: string;
  locationId?: string;
  authorId?: string;
  type?: string;
  search?: string;
}

export async function getPostById(id: string): Promise<Post | undefined> {
  const doc = await db.collection('posts').doc(id).get();
  return doc.exists ? (doc.data() as Post) : undefined;
}

export async function getPosts(filters: PostFilters = {}): Promise<Post[]> {
  const snap = await db.collection('posts').get();
  let results = snap.docs.map(d => d.data() as Post);

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

  await db.collection('posts').doc(id).set(post);

  if (post.tags.length > 0) {
    const tagsRef = db.collection('metadata').doc('tags');
    const tagsDoc = await tagsRef.get();
    const existingTags: string[] = tagsDoc.exists ? (tagsDoc.data()?.all || []) : [];
    const mergedTags = Array.from(new Set([...existingTags, ...post.tags]));
    await tagsRef.set({ all: mergedTags });
  }

  return post;
}

export async function updatePost(id: string, dto: any): Promise<Post | undefined> {
  const ref = db.collection('posts').doc(id);
  const doc = await ref.get();
  if (!doc.exists) return undefined;

  const currentPost = doc.data() as Post;
  const updatedPost = { ...currentPost, ...dto };
  await ref.update(dto);
  return updatedPost;
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  return getPosts({ tag });
}

export async function deletePost(id: string): Promise<boolean> {
  const ref = db.collection('posts').doc(id);
  const doc = await ref.get();
  if (!doc.exists) return false;

  await ref.delete();

  // Limpa comentários do post deletado
  const commentsSnap = await db.collection('comments').where('postId', '==', id).get();
  if (!commentsSnap.empty) {
    const batch = db.batch();
    commentsSnap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }

  return true;
}

export async function toggleLike(postId: string, userId: string): Promise<Post | undefined> {
  const ref = db.collection('posts').doc(postId);
  const doc = await ref.get();
  if (!doc.exists) return undefined;

  const post = doc.data() as Post;

  const alreadyLiked = post.likedBy.includes(userId);
  if (alreadyLiked) {
    post.likedBy = post.likedBy.filter(id => id !== userId);
    post.likes = Math.max(0, post.likes - 1);
  } else {
    post.likedBy.push(userId);
    post.likes += 1;
  }

  await ref.set(post);
  return post;
}

// --- Compatibilidade das rotas anteriores ---
export async function getPostsByLocation(locationId: string): Promise<Post[]> {
  return getPosts({ locationId });
}

export async function getPostsByUser(userId: string): Promise<Post[]> {
  return getPosts({ authorId: userId });
}

// ---------- Comentários ----------
export async function getCommentsByPost(postId: string): Promise<Comment[]> {
  const snap = await db.collection('comments').where('postId', '==', postId).get();
  const comments = snap.docs.map(d => d.data() as Comment);
  return comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function createComment(postId: string, dto: any): Promise<Comment | undefined> {
  const postRef = db.collection('posts').doc(postId);
  const postDoc = await postRef.get();
  if (!postDoc.exists) return undefined;

  const post = postDoc.data() as Post;

  const id = uuid();
  const comment: Comment = {
    id,
    postId,
    authorId: dto.authorId,
    content: dto.content,
    createdAt: new Date().toISOString(),
  };

  await db.collection('comments').doc(id).set(comment);

  // Dispara notificação se não for o próprio autor comentando
  if (post.authorId !== dto.authorId) {
    const author = await getUserById(dto.authorId);
    await createNotification({
      userId: post.authorId,
      type: 'comment',
      body: `${author?.name ?? 'Alguém'} comentou: "${dto.content.slice(0, 60)}"`,
      postId: post.id,
    });
  }

  return comment;
}

export async function getCommentById(id: string): Promise<Comment | undefined> {
  const doc = await db.collection('comments').doc(id).get();
  return doc.exists ? (doc.data() as Comment) : undefined;
}

export async function deleteComment(id: string): Promise<boolean> {
  const ref = db.collection('comments').doc(id);
  const doc = await ref.get();
  if (!doc.exists) return false;

  await ref.delete();
  return true;
}

// ---------- Notificações ----------
export async function getNotificationsByUser(userId: string): Promise<Notification[]> {
  const snap = await db.collection('notifications').where('userId', '==', userId).get();
  const notifications = snap.docs.map(d => d.data() as Notification);
  return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Alias caso alguma rota antiga chame apenas por getNotifications
export async function getNotifications(userId: string): Promise<Notification[]> {
  return getNotificationsByUser(userId);
}

export async function getNotificationById(id: string): Promise<Notification | undefined> {
  const doc = await db.collection('notifications').doc(id).get();
  return doc.exists ? (doc.data() as Notification) : undefined;
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

  await db.collection('notifications').doc(id).set(notification);
  return notification;
}

export async function markNotificationRead(id: string): Promise<Notification | undefined> {
  const ref = db.collection('notifications').doc(id);
  const doc = await ref.get();
  if (!doc.exists) return undefined;

  const notification = { ...(doc.data() as Notification), read: true };
  await ref.update({ read: true });
  return notification;
}

// Alias caso a rota use o padrão snake-case ou camelCase diferente
export async function markNotificationAsRead(id: string): Promise<Notification | undefined> {
  return markNotificationRead(id);
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const snap = await db.collection('notifications')
    .where('userId', '==', userId)
    .where('read', '==', false)
    .get();

  if (snap.empty) return 0;

  const batch = db.batch();
  snap.docs.forEach(d => batch.update(d.ref, { read: true }));
  await batch.commit();

  return snap.size;
}

// Alias para bater com a chamada antiga
export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  return markAllNotificationsRead(userId);
}

export async function getAllTags(): Promise<string[]> {
  const doc = await db.collection('metadata').doc('tags').get();
  const tags: string[] = doc.exists ? (doc.data()?.all || []) : [];
  return Array.from(new Set(tags)).sort();
}
