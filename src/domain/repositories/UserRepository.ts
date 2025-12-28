import { User } from '../entities/User';

export interface UserRepository {
  createUser(user: Omit<User, 'id'>): Promise<User>;
  getUserByEmail(email: string): Promise<User | null>;
}
