export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  course: string;
  bio: string;
  role: UserRole;
  joinDate: string;
}

export interface CampusLocation {
  id: string;
  name: string;
  shortName: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  lat: number;
  lng: number;
}

export type PostType = 'event' | 'project' | 'collective' | 'general';

export interface Post {
  id: string;
  title: string;
  content: string;
  image: string;
  eventDate: string;
  createdAt: string;
  authorId: string;
  locationId: string;
  tags: string[];
  likes: number;
  likedBy: string[];
  type: PostType;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export type NotificationType = 'like' | 'comment' | 'mention' | 'proximity';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  body: string;
  postId?: string;
  createdAt: string;
  read: boolean;
}

export interface CreatePostDTO {
  title: string;
  content: string;
  image?: string;
  eventDate: string;
  authorId: string;
  locationId: string;
  tags?: string[];
  type: PostType;
}

export type UpdatePostDTO = Partial<Omit<CreatePostDTO, 'authorId'>>;

export interface CreateCommentDTO {
  authorId: string;
  content: string;
}

export interface ToggleLikeDTO {
  userId: string;
}

export interface LoginDTO {
  email: string;
}
