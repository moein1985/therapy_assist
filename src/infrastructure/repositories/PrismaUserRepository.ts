import { UserRepository } from '../../domain/repositories/UserRepository';
import { User } from '../../domain/entities/User';
import prisma from '../database/prisma';

export class PrismaUserRepository implements UserRepository {
  async createUser(user: Omit<User, 'id'>): Promise<User> {
    return prisma.user.create({
      data: user,
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: {
        email,
      },
    });
  }
}
