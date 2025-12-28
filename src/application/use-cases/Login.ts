import { UserRepository } from '../../domain/repositories/UserRepository';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class Login {
  constructor(private userRepository: UserRepository) {}

  async execute(input: { email: string; password?: string }): Promise<{ token: string }> {
    const { email, password } = input;

    if (!password) {
      throw new Error('Password is required');
    }

    const user = await this.userRepository.getUserByEmail(email);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password!);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '1d',
    });

    return { token };
  }
}
