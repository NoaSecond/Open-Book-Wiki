// Type definitions for the Open Book Wiki application

export interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
  last_login?: string;
  avatar?: string;
  tags?: string[];
  bio?: string;
  contributions?: number;
  password_hash?: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  description?: string;
  created_at: string;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  description: string;
  category: string;
}

export interface TagPermission {
  tag_id: number;
  permission_id: number;
  granted: boolean;
}

export interface WikiSection {
  id: string;
  title: string;
  content: string;
  lastModified?: string;
  author?: string;
}

export interface WikiPage {
  id: string | number;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
  lastModified?: string; // Legacy property
  author?: string;
  author_username?: string;
  tags?: string[];
  is_protected?: boolean;
  isPrivate?: boolean; // Legacy property
  sections?: WikiSection[];
  version?: number; // Legacy property
}

export interface Activity {
  id: number;
  type: string;
  title?: string;
  description: string;
  user_id?: number;
  username?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface DatabaseActivity {
  id: number;
  username: string;
  action: string;
  target?: string;
  details?: string;
  timestamp: string;
}

export interface DatabaseStats {
  users: number;
  pages: number;
  activities: number;
  tags: number;
  last_activity?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface CategoryItem {
  id: string;
  title: string;
  type: 'page' | 'category';
  children?: CategoryItem[];
  icon?: string;
}

export interface NavigationItem {
  id: string;
  title: string;
  path: string;
  icon?: string;
  type: 'page' | 'category';
  children?: NavigationItem[];
}

export interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  type: 'page' | 'section';
  path: string;
}

export interface WikiConfig {
  title: string;
  description: string;
  version: string;
  environment: string;
  features: {
    auth: boolean;
    admin: boolean;
    search: boolean;
  };
}
