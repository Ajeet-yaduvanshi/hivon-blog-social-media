export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type UserRole = 'viewer' | 'author' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Post {
  id: string;
  title: string;
  body: string;
  image_url?: string | null;
  author_id: string;
  summary?: string | null;
  slug: string;
  published?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  comment_text: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export type PostWithAuthor = Post & {
  author?: Pick<User, 'id' | 'name' | 'email' | 'avatar_url'> | null;
};

export type CommentWithUser = Comment & {
  user?: Pick<User, 'id' | 'name'> | null;
};

export type PostWithRelations = Post & {
  author?: Pick<User, 'id' | 'name' | 'email'> | null;
  comments?: CommentWithUser[];
};
