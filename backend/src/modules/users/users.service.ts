import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, SystemRole } from './entities/user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findByActivationToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { activationToken: token },
    });
  }

  async findByResetPasswordToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { resetPasswordToken: token },
    });
  }

  async findByOAuthId(provider: string, oauthId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { oauthProvider: provider as any, oauthId },
    });
  }

  async createOAuthUser(data: Partial<User>): Promise<User> {
    const count = await this.usersRepository.count();
    const user = this.usersRepository.create({
      ...data,
      email: data.email ? data.email.toLowerCase().trim() : '',
      systemRole: count === 0 ? SystemRole.ADMIN : SystemRole.USER,
      isActivated: true,
    });
    return this.usersRepository.save(user);
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create({
      ...userData,
      email: userData.email ? userData.email.toLowerCase().trim() : '',
    });
    return this.usersRepository.save(user);
  }

  async update(id: number, updateData: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, updateData);
    const updated = await this.findById(id);
    if (!updated) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return updated;
  }

  /**
   * Blocks user account (SDSecurity Task 4: Admin controls).
   */
  async blockUser(id: number): Promise<User> {
    return this.update(id, { isBlocked: true });
  }

  /**
   * Unblocks user account and resets lockout counters (SDSecurity Task 4: Admin controls).
   */
  async unblockUser(id: number): Promise<User> {
    return this.update(id, {
      isBlocked: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
  }

  /**
   * Returns list of all users for administrator (SDSecurity Task 4 & RBAC).
   */
  async findAll(page = 1, limit = 50): Promise<{ items: Partial<User>[]; total: number }> {
    const [users, total] = await this.usersRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        fullName: true,
        email: true,
        systemRole: true,
        isActivated: true,
        isBlocked: true,
        twoFactorEnabled: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        oauthProvider: true,
        createdAt: true,
      },
    });
    return { items: users, total };
  }
}
