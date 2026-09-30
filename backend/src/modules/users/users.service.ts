import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, SystemRole, OAuthProvider } from './entities/user.entity.js';
import { SavedFilter } from './entities/saved-filter.entity.js';
import { Group } from '../rbac/entities/group.entity.js';
import { UserGroup } from '../rbac/entities/user-group.entity.js';
import { RedisService } from '../redis/redis.service.js';
import { SeaweedFsService, type UploadedFileInput } from '../storage/services/seaweedfs.service.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(SavedFilter)
    private readonly savedFilterRepository: Repository<SavedFilter>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(UserGroup)
    private readonly userGroupRepository: Repository<UserGroup>,
    @Optional()
    private readonly redisService?: RedisService,
    @Optional()
    private readonly seaweedFsService?: SeaweedFsService,
  ) {}

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async getUserGroups(userId: number): Promise<string[]> {
    const userGroups = await this.userGroupRepository.find({
      where: { userId },
      relations: { group: true },
    });
    return userGroups.map((ug) => ug.group?.name).filter(Boolean);
  }

  /**
   * Checks whether the user is a member of any directory administrator group.
   */
  async isMemberOfAdminGroup(userId: number): Promise<boolean> {
    try {
      return await this.userGroupRepository
        .createQueryBuilder('ug')
        .innerJoin('ug.group', 'g')
        .where('ug.userId = :userId', { userId })
        .andWhere('LOWER(g.name) IN (:...names)', {
          names: ['administrators', 'admin', 'admins'],
        })
        .getExists();
    } catch {
      return false;
    }
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

  async findByOAuthId(provider: OAuthProvider | string, oauthId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { oauthProvider: provider as OAuthProvider, oauthId },
    });
  }

  async createOAuthUser(data: Partial<User>): Promise<User> {
    const count = await this.usersRepository.count();
    const systemRole = count === 0 ? SystemRole.ADMIN : SystemRole.USER;
    const user = this.usersRepository.create({
      ...data,
      email: data.email ? data.email.toLowerCase().trim() : '',
      systemRole,
      isActivated: true,
    });
    const saved = await this.usersRepository.save(user);
    await this.syncUserGroupsWithRole(saved.id, systemRole);
    return saved;
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create({
      ...userData,
      email: userData.email ? userData.email.toLowerCase().trim() : '',
    });
    const saved = await this.usersRepository.save(user);
    if (saved.systemRole) {
      await this.syncUserGroupsWithRole(saved.id, saved.systemRole);
    }
    return saved;
  }

  async update(id: number, updateData: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, updateData as any);
    if (this.redisService) {
      await this.redisService.del(`user:session:${id}`);
    }
    const updated = await this.findById(id);
    if (!updated) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return updated;
  }

  /**
   * Synchronizes user's group memberships with system role (RBAC directory sync).
   */
  async syncUserGroupsWithRole(userId: number, role: SystemRole): Promise<void> {
    try {
      // 1. Ensure user belongs to 'all-users' group
      const allUsersGroup = await this.groupRepository.findOne({ where: { name: 'all-users' } });
      if (allUsersGroup) {
        const hasAllUsers = await this.userGroupRepository.findOne({
          where: { groupId: allUsersGroup.id, userId },
        });
        if (!hasAllUsers) {
          await this.userGroupRepository.save(
            this.userGroupRepository.create({ groupId: allUsersGroup.id, userId }),
          );
        }
      }

      // 2. Sync 'administrators' group membership
      const adminGroup = await this.groupRepository.findOne({
        where: { name: 'administrators' },
      });

      if (adminGroup) {
        const existingMembership = await this.userGroupRepository.findOne({
          where: { groupId: adminGroup.id, userId },
        });

        if (role === SystemRole.ADMIN) {
          if (!existingMembership) {
            await this.userGroupRepository.save(
              this.userGroupRepository.create({ groupId: adminGroup.id, userId }),
            );
          }
        } else {
          if (existingMembership) {
            await this.userGroupRepository.delete({ groupId: adminGroup.id, userId });
          }
        }
      }
    } catch {
      // Graceful fallback if tables are not initialized yet during bootstrap
    }
  }

  /**
   * Determines whether a user is the designated primary root administrator.
   */
  isRootUser(user: User): boolean {
    const rootAdminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@bugtracker.local').toLowerCase();
    return user.isRoot === true || user.email.toLowerCase() === rootAdminEmail;
  }

  /**
   * Updates user avatar URL or preset identifier.
   */
  /**
   * Updates user avatar URL or preset identifier.
   */
  async updateAvatar(id: number, avatarUrl: string): Promise<User> {
    const updated = await this.update(id, { avatarUrl });
    await this.invalidateSystemStatsCache();
    return updated;
  }

  /**
   * Uploads avatar image file directly to SeaweedFS distributed object storage.
   */
  async uploadAvatarFile(userId: number, file: UploadedFileInput): Promise<User> {
    if (!this.seaweedFsService) {
      throw new BadRequestException('Object storage service unavailable');
    }
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
      throw new BadRequestException(
        `Unsupported image format "${file.mimetype}". Allowed formats: PNG, JPEG, WEBP, GIF, SVG.`,
      );
    }

    const { fid } = await this.seaweedFsService.uploadFile(file);
    const avatarUrl = `/api/v1/users/avatar/${fid}`;
    return this.update(userId, { avatarUrl });
  }

  /**
   * Streams avatar file binary buffer from SeaweedFS.
   */
  async getAvatarBuffer(fid: string): Promise<{ buffer: Buffer; contentType: string }> {
    if (!this.seaweedFsService) {
      throw new BadRequestException('Object storage service unavailable');
    }
    return this.seaweedFsService.getFileBuffer(fid);
  }

  /**
   * Retrieves cross-device persisted preferences for the user.
   */
  async getPreferences(userId: number): Promise<Record<string, unknown>> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID #${userId} not found`);
    }
    return user.preferences || {};
  }

  /**
   * Updates cross-device preferences atomically in PostgreSQL.
   */
  async updatePreferences(
    userId: number,
    patch: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID #${userId} not found`);
    }
    const current = user.preferences || {};
    const updated = { ...current, ...patch };
    await this.usersRepository.update(userId, { preferences: updated as any });
    return updated;
  }

  /**
   * Invalidates cached admin dashboard metrics in Redis.
   */
  async invalidateSystemStatsCache(): Promise<void> {
    if (this.redisService) {
      await this.redisService.del('admin:system_stats');
    }
  }

  /**
   * Blocks user account (Admin controls).
   * Root administrator accounts cannot be blocked.
   */
  async blockUser(id: number): Promise<User> {
    const targetUser = await this.findById(id);
    if (!targetUser) {
      throw new NotFoundException(`User with ID #${id} not found`);
    }

    if (this.isRootUser(targetUser)) {
      throw new ForbiddenException('Root administrator accounts cannot be blocked');
    }

    const updated = await this.update(id, { isBlocked: true });
    await this.invalidateSystemStatsCache();
    return updated;
  }

  /**
   * Deletes a user account (Admin controls).
   * Root administrator accounts cannot be deleted.
   */
  async deleteUser(id: number): Promise<{ message: string }> {
    const targetUser = await this.findById(id);
    if (!targetUser) {
      throw new NotFoundException(`User with ID #${id} not found`);
    }

    if (this.isRootUser(targetUser)) {
      throw new ForbiddenException('Root administrator accounts cannot be deleted');
    }

    await this.usersRepository.delete(id);
    if (this.redisService) {
      await this.redisService.del(`user:session:${id}`);
    }
    await this.invalidateSystemStatsCache();
    return { message: `User #${id} has been deleted` };
  }

  /**
   * Unblocks user account and resets lockout counters in PostgreSQL and Redis (Admin controls).
   */
  async unblockUser(id: number): Promise<User> {
    const targetUser = await this.findById(id);
    if (!targetUser) {
      throw new NotFoundException(`User with ID #${id} not found`);
    }

    if (this.redisService) {
      const emailKey = targetUser.email.toLowerCase().trim();
      await this.redisService.del(
        `auth:attempts:${emailKey}`,
        `auth:lockout:${emailKey}`,
        `user:session:${id}`,
      );
    }

    return this.update(id, {
      isBlocked: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
  }

  /**
   * Updates user system role with root admin protections.
   * Root administrator accounts cannot be demoted.
   */
  async updateRole(id: number, role: SystemRole, currentUserId: number, jobTitle?: string): Promise<User> {
    const targetUser = await this.findById(id);
    if (!targetUser) {
      throw new NotFoundException(`User with ID #${id} not found`);
    }

    // Protect root administrator accounts from demotion
    if (this.isRootUser(targetUser) && role !== SystemRole.ADMIN) {
      throw new ForbiddenException('Root administrator accounts cannot be demoted');
    }

    // Protect against self-demotion lockout
    if (id === currentUserId && role !== SystemRole.ADMIN) {
      throw new BadRequestException('Cannot demote your own administrator account');
    }

    const updates: Partial<User> = { systemRole: role };
    if (jobTitle !== undefined) {
      updates.jobTitle = jobTitle.trim();
    }

    const updatedUser = await this.update(id, updates);
    await this.syncUserGroupsWithRole(id, role);
    return updatedUser;
  }

  /**
   * Updates user profile (Job Title / Work Role label and Full Name).
   */
  async updateProfile(userId: number, dto: { fullName?: string; jobTitle?: string }): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const updates: Partial<User> = {};
    if (dto.fullName) updates.fullName = dto.fullName.trim();
    if (dto.jobTitle !== undefined) updates.jobTitle = dto.jobTitle.trim();
    return this.update(userId, updates);
  }

  /**
   * Activates user account directly without email link (Admin action).
   */
  async activateUser(id: number): Promise<User> {
    return this.update(id, {
      isActivated: true,
      activationToken: null,
      activationTokenExpiresAt: null,
    });
  }

  /**
   * Resets 2FA secret and disables 2FA for an account (Admin action).
   */
  async reset2Fa(id: number): Promise<User> {
    return this.update(id, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });
  }

  /**
   * Retrieves high-level security and user statistics for the Admin Dashboard.
   * Utilizes a single PostgreSQL SQL aggregation and caches results in Redis with a 60s TTL.
   */
  async getSystemStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    twoFactorAdoptionCount: number;
    twoFactorPercentage: number;
    roleBreakdown: Record<string, number>;
  }> {
    const cacheKey = 'admin:system_stats';
    if (this.redisService) {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // ignore cache parse errors
        }
      }
    }

    const raw = await this.usersRepository.query(`
      SELECT
        COUNT(*)::int AS "totalUsers",
        COUNT(CASE WHEN is_activated AND NOT is_blocked THEN 1 END)::int AS "activeUsers",
        COUNT(CASE WHEN is_blocked THEN 1 END)::int AS "blockedUsers",
        COUNT(CASE WHEN two_factor_enabled THEN 1 END)::int AS "twoFactorAdoptionCount",
        COUNT(CASE WHEN system_role = 'ADMIN' THEN 1 END)::int AS "adminCount",
        COUNT(CASE WHEN system_role = 'USER' THEN 1 END)::int AS "userCount"
      FROM users
    `);

    const row = raw && raw[0] ? raw[0] : {};
    const totalUsers = Number(row.totalUsers) || 0;
    const activeUsers = Number(row.activeUsers) || 0;
    const blockedUsers = Number(row.blockedUsers) || 0;
    const twoFactorAdoptionCount = Number(row.twoFactorAdoptionCount) || 0;
    const twoFactorPercentage = totalUsers > 0 ? Math.round((twoFactorAdoptionCount / totalUsers) * 100) : 0;
    const roleBreakdown: Record<string, number> = {
      [SystemRole.ADMIN]: Number(row.adminCount) || 0,
      [SystemRole.USER]: Number(row.userCount) || 0,
    };

    const stats = {
      totalUsers,
      activeUsers,
      blockedUsers,
      twoFactorAdoptionCount,
      twoFactorPercentage,
      roleBreakdown,
    };

    if (this.redisService) {
      await this.redisService.set(cacheKey, JSON.stringify(stats), 60);
    }

    return stats;
  }

  /**
   * Returns list of all users with search and filtering for administrator (Extended RBAC).
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
        'user.jobTitle',
        'user.isRoot',
        'user.avatarUrl',
        'user.isActivated',
        'user.isBlocked',
        'user.twoFactorEnabled',
        'user.failedLoginAttempts',
        'user.lockedUntil',
        'user.oauthProvider',
        'user.createdAt',
      ]);

    const [users, total] = await qb.getManyAndCount();

    const items = users.map((u) => {
      u.isRoot = this.isRootUser(u);
      return u;
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Returns active, unblocked users for assignment selectors with avatars.
   */
  async findAssignees(): Promise<Array<{ id: number; fullName: string; email: string; avatarUrl: string | null; systemRole: SystemRole; jobTitle?: string | null }>> {
    return this.usersRepository.find({
      where: { isBlocked: false },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        systemRole: true,
        jobTitle: true,
      },
      order: { fullName: 'ASC' },
    });
  }

  /**
   * Retrieves saved search filters for a given user ordered by favorite first then recency.
   */
  async getSavedFilters(userId: number): Promise<SavedFilter[]> {
    return this.savedFilterRepository.find({
      where: { userId },
      order: { isFavorite: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Creates a new saved search filter for a given user.
   */
  async createSavedFilter(
    userId: number,
    dto: { name: string; criteria: string; description?: string; isFavorite?: boolean },
  ): Promise<SavedFilter> {
    const filter = this.savedFilterRepository.create({
      userId,
      name: dto.name.trim(),
      criteria: dto.criteria.trim(),
      description: dto.description ? dto.description.trim() : null,
      isFavorite: Boolean(dto.isFavorite),
    });
    return this.savedFilterRepository.save(filter);
  }

  /**
   * Updates an existing saved search filter owned by the user.
   */
  async updateSavedFilter(
    userId: number,
    filterId: number,
    dto: { name?: string; criteria?: string; description?: string; isFavorite?: boolean },
  ): Promise<SavedFilter> {
    const filter = await this.savedFilterRepository.findOne({
      where: { id: filterId, userId },
    });
    if (!filter) {
      throw new NotFoundException(`Saved filter #${filterId} not found or unauthorized`);
    }

    if (dto.name !== undefined) filter.name = dto.name.trim();
    if (dto.criteria !== undefined) filter.criteria = dto.criteria.trim();
    if (dto.description !== undefined) filter.description = dto.description ? dto.description.trim() : null;
    if (dto.isFavorite !== undefined) filter.isFavorite = Boolean(dto.isFavorite);

    return this.savedFilterRepository.save(filter);
  }

  /**
   * Deletes a saved search filter owned by a user.
   */
  async deleteSavedFilter(userId: number, filterId: number): Promise<void> {
    const filter = await this.savedFilterRepository.findOne({
      where: { id: filterId, userId },
    });
    if (!filter) {
      throw new NotFoundException(`Saved filter #${filterId} not found or unauthorized`);
    }
    await this.savedFilterRepository.remove(filter);
  }
}
