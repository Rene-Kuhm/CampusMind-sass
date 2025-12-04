/**
 * User & Authentication Types
 */

export type StudyStyle = 'FORMAL' | 'PRACTICAL' | 'BALANCED';
export type ContentDepth = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  career: string | null;
  year: number | null;
  university: string | null;
  studyStyle: StudyStyle;
  contentDepth: ContentDepth;
  preferredLang: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  profile: UserProfile | null;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: Omit<UserProfile, 'userId' | 'createdAt' | 'updatedAt'> | null;
}

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}
