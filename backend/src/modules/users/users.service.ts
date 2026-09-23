import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
   * Updates user system role with self-demote protection (PPofSE Tier 1 RBAC).
   */
  async updateRole(id: number, role: SystemRole, currentUserId: number): Promise<User> {
    const targetUser = await this.findById(id);
    if (!targetUser) {
      throw new NotFoundException(`User with ID #${id} not found`);
    }

    // Protect against self-demotion lockout
    if (id === currentUserId && role !== SystemRole.ADMIN) {
      throw new BadRequestException('Cannot demote your own administrator account');
    }

    return this.update(id, { systemRole: role });
  }

  /**
   * Activates user account directly without email link (SDSecurity Task 3 / Admin action).
   */
  async activateUser(id: number): Promise<User> {
    return this.update(id, {
      isActivated: true,
      activationToken: null,
      activationTokenExpiresAt: null,
    });
  }

  /**
   * Resets 2FA secret and disables 2FA for an account (SDSecurity Task 5 / Admin action).
   */
  async reset2Fa(id: number): Promise<User> {
    return this.update(id, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });
  }

  /**
   * Retrieves high-level security and user statistics for the Admin Dashboard.
   */
  async getSystemStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    twoFactorAdoptionCount: number;
    twoFactorPercentage: number;
  }> {
    const totalUsers = await this.usersRepository.count();
    const activeUsers = await this.usersRepository.count({
      where: { isActivated: true, isBlocked: false },
    });
    const blockedUsers = await this.usersRepository.count({
      where: { isBlocked: true },
    });
    const twoFactorAdoptionCount = await this.usersRepository.count({
      where: { twoFactorEnabled: true },
    });
    const twoFactorPercentage = totalUsers > 0 ? Math.round((twoFactorAdoptionCount / totalUsers) * 100) : 0;

    return {
      totalUsers,
      activeUsers,
      blockedUsers,
      twoFactorAdoptionCount,
      twoFactorPercentage,
    };
  }

  /**
   * Returns list of all users with search and filtering for administrator (SDSecurity Task 4 & RBAC).
   */
  async findAll(
    page = 1,
    limit = 50,
    search?: string,
    role?: SystemRole,
    isBlocked?: boolean,
    isActivated?: boolean,
  ): Promise<{
    items: Partial<User>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const qb = this.usersRepository.createQueryBuilder('user');

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      qb.andWhere('(LOWER(user.fullName) LIKE :term OR LOWER(user.email) LIKE :term)', { term });
    }

    if (role) {
      qb.andWhere('user.systemRole = :role', { role });
    }

    if (typeof isBlocked === 'boolean') {
      qb.andWhere('user.isBlocked = :isBlocked', { isBlocked });
    }

    if (typeof isActivated === 'boolean') {
      qb.andWhere('user.isActivated = :isActivated', { isActivated });
    }

    qb.orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .select([
        'user.id',
        'user.fullName',
        'user.email',
        'user.systemRole',
        'user.isActivated',
        'user.isBlocked',
        'user.twoFactorEnabled',
        'user.failedLoginAttempts',
        'user.lockedUntil',
        'user.oauthProvider',
        'user.createdAt',
      ]);

    const [users, total] = await qb.getManyAndCount();

    return {
      items: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

