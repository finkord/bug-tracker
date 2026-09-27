# API DTO Symmetry & TypeORM Guidelines

1. **Strict DTO Property Symmetry**:
   - When creating or modifying backend DTOs with NestJS `ValidationPipe` (`forbidNonWhitelisted: true`), always verify that frontend API client request bodies serialize exact matching property names (e.g., `newPassword` vs `password`).
   - Implement defensive property aliasing in backend DTOs where appropriate to handle historical or alias parameter names gracefully.

2. **TypeORM Batch Operations**:
   - Never use `repository.delete({})` with empty object criteria, as modern TypeORM rejects empty criteria objects.
   - Always use `repository.createQueryBuilder().delete().from(Entity).execute()` or explicit criteria for bulk table purges.
