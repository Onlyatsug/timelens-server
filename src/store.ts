import { v4 as uuid } from 'uuid';
import { USERS, LOCATIONS, POSTS, COMMENTS, NOTIFICATIONS, ALL_TAGS } from './data/seed';
import {
  User,
  CampusLocation,
  Post,
  Comment,
  Notification,
  CreatePostDTO,
  UpdatePostDTO,
  CreateCommentDTO,
} from './types';

// Estado em memória (reinicia toda vez que o servidor sobe).
// Para persistência real, troque estes arrays por chamadas a um banco de dados.
const db = {
  users: [...USERS],
  locations: [...LOCATIONS],
  posts: [...POSTS],
  comments: [...COMMENTS],
  notifications: [...NOTIFICATIONS],
  tags: new Set(ALL_TAGS),
};

// ---------- Usuários ----------
export function getUsers(): User[] {
  return db.users;
}

export function getUserById(id: string): User | undefined {
  return db.users.find((u) => u.id === id);
}

export function getUserByEmail(email: string): User | undefined {
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

// ---------- Locais ----------
export function getLocations(): CampusLocation[] {
  return db.locations;
}

export function getLocationById(id: string): CampusLocation | undefined {
  return db.locations.find((l) => l.id === id);
}

export function createLocation(data: Omit<CampusLocation, 'id'>): CampusLocation {
  const newLocation: CampusLocation = {
    ...data,
    id: `loc${Date.now()}` // Gera um ID único baseado no timestamp
  };
  
  // CORREÇÃO AQUI: Salvar no db.locations em vez de LOCATIONS
  db.locations.push(newLocation); 
  
  return newLocation;
}

// ---------- Posts ----------
export interface PostFilters {
  tag?: string;
  locationId?: string;
  authorId?: string;
  type?: string;
  search?: string;
}

export function getPosts(filters: PostFilters = {}): Post[] {
  let result = [...db.posts];

  if (filters.tag) {
    result = result.filter((p) => p.tags.includes(filters.tag!));
  }
  if (filters.locationId) {
    result = result.filter((p) => p.locationId === filters.locationId);
  }
  if (filters.authorId) {
    result = result.filter((p) => p.authorId === filters.authorId);
  }
  if (filters.type) {
    result = result.filter((p) => p.type === filters.type);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (p) => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)
    );
  }

  return result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getPostById(id: string): Post | undefined {
  return db.posts.find((p) => p.id === id);
}

export function getPostsByLocation(locationId: string): Post[] {
  return db.posts.filter((p) => p.locationId === locationId);
}

export function getPostsByTag(tag: string): Post[] {
  return db.posts.filter((p) => p.tags.includes(tag));
}

export function createPost(dto: CreatePostDTO): Post {
  const post: Post = {
    id: uuid(),
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
  db.posts.unshift(post);
  post.tags.forEach((t) => db.tags.add(t));
  return post;
}

export function updatePost(id: string, dto: UpdatePostDTO): Post | undefined {
  const post = getPostById(id);
  if (!post) return undefined;

  Object.assign(post, dto);
  if (dto.tags) {
    dto.tags.forEach((t) => db.tags.add(t));
  }
  return post;
}

export function deletePost(id: string): boolean {
  const index = db.posts.findIndex((p) => p.id === id);
  if (index === -1) return false;
  db.posts.splice(index, 1);
  // remove comentários órfãos
  db.comments = db.comments.filter((c) => c.postId !== id);
  return true;
}

export function toggleLike(postId: string, userId: string): Post | undefined {
  const post = getPostById(postId);
  if (!post) return undefined;

  const alreadyLiked = post.likedBy.includes(userId);
  if (alreadyLiked) {
    post.likedBy = post.likedBy.filter((id) => id !== userId);
    post.likes = Math.max(0, post.likes - 1);
  } else {
    post.likedBy.push(userId);
    post.likes += 1;
    // gera notificação de curtida para o autor do post (se não for o próprio usuário)
    if (post.authorId !== userId) {
      const liker = getUserById(userId);
      createNotification({
        userId: post.authorId,
        type: 'like',
        body: `${liker?.name ?? 'Alguém'} curtiu sua memória "${post.title}".`,
        postId: post.id,
      });
    }
  }
  return post;
}

// ---------- Comentários ----------
export function getCommentsByPost(postId: string): Comment[] {
  return db.comments
    .filter((c) => c.postId === postId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function createComment(postId: string, dto: CreateCommentDTO): Comment | undefined {
  const post = getPostById(postId);
  if (!post) return undefined;

  const comment: Comment = {
    id: uuid(),
    postId,
    authorId: dto.authorId,
    content: dto.content,
    createdAt: new Date().toISOString(),
  };
  db.comments.push(comment);

  if (post.authorId !== dto.authorId) {
    const author = getUserById(dto.authorId);
    createNotification({
      userId: post.authorId,
      type: 'comment',
      body: `${author?.name ?? 'Alguém'} comentou: "${dto.content.slice(0, 60)}"`,
      postId: post.id,
    });
  }

  return comment;
}

export function deleteComment(id: string): boolean {
  const index = db.comments.findIndex((c) => c.id === id);
  if (index === -1) return false;
  db.comments.splice(index, 1);
  return true;
}

// ---------- Notificações ----------
export function getNotificationsByUser(userId: string): Notification[] {
  return db.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createNotification(
  data: Omit<Notification, 'id' | 'createdAt' | 'read'>
): Notification {
  const notification: Notification = {
    id: uuid(),
    createdAt: new Date().toISOString(),
    read: false,
    ...data,
  };
  db.notifications.unshift(notification);
  return notification;
}

export function markNotificationRead(id: string): Notification | undefined {
  const notification = db.notifications.find((n) => n.id === id);
  if (!notification) return undefined;
  notification.read = true;
  return notification;
}

export function markAllNotificationsRead(userId: string): number {
  let count = 0;
  db.notifications.forEach((n) => {
    if (n.userId === userId && !n.read) {
      n.read = true;
      count += 1;
    }
  });
  return count;
}

// ---------- Tags ----------
export function getAllTags(): string[] {
  return Array.from(db.tags).sort();
}