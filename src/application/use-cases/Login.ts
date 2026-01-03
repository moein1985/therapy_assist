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

    console.log('Login attempt for', email);
    const user = await this.userRepository.getUserByEmail(email);

    if (!user) {
      console.log('Login failed: user not found for', email);
      throw new Error('Invalid email or password');
    }

    console.log('User found, comparing password for', email);
    const isPasswordValid = await bcrypt.compare(password, user.password!);

    console.log('Password valid?', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Login failed: invalid password for', email);
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '1d',
    });

    return { token };
  }
}
