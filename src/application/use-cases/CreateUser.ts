import { User } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';
import bcrypt from 'bcrypt';

export class CreateUser {
  constructor(private userRepository: UserRepository) {}

  async execute(input: { email: string; name?: string, password?: string }): Promise<Omit<User, 'password'>> {
    const { email, name, password } = input;

    if (!password) {
      throw new Error('Password is required');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user: Omit<User, 'id'> = {
      email,
      name: name || null,
      password: hashedPassword,
    };
    
    const createdUser = await this.userRepository.createUser(user);

    const { password: _, ...userWithoutPassword } = createdUser;

    return userWithoutPassword;
  }
}
