# Contributing Guide

Panduan untuk berkontribusi ke BeritaKarya.

## Getting Started

1. Fork repository
2. Clone ke local machine
3. Buat branch baru untuk fitur/fix
4. Ikuti setup guide di [docs/setup.md](docs/setup.md)

## Development Workflow

### Branch Naming

```
feat/nama-fitur      # Fitur baru
fix/nama-bug         # Bug fix
chore/nama-task      # Maintenance
docs/nama-docs       # Documentation
```

### Commit Messages

Gunakan format conventional commits:

```
type: description

feat: add user profile page
fix: resolve login redirect issue
chore: update dependencies
docs: add API documentation
```

### Code Style

- **TypeScript**: Strict mode, gunakan types yang tepat
- **ESLint**: Jalankan `pnpm lint` sebelum commit
- **Naming**: camelCase untuk variables/functions, PascalCase untuk components/classes
- **Comments**: Gunakan bahasa Inggris untuk code comments

### Testing

```bash
# Run semua tests
pnpm test

# Run specific test
pnpm --filter @beritakarya/api test -- path/to/test.test.ts

# Run E2E tests
pnpm --filter @beritakarya/web exec playwright test
```

### Pull Request Checklist

- [ ] Code berjalan tanpa error
- [ ] Tests pass (`pnpm test`)
- [ ] Lint pass (`pnpm lint`)
- [ ] Type-check pass (`pnpm type-check`)
- [ ] Build pass (`pnpm build`)
- [ ] Documentation diupdate jika perlu
- [ ] Commit messages mengikuti conventional commits

## Architecture Guidelines

### Backend

- Gunakan module pattern: controller → service → repository
- Validasi input dengan Zod schemas
- Handle errors dengan AppError class
- Gunakan asyncHandler untuk route handlers

### Frontend

- Gunakan Container component untuk layout
- Multi-site routing: `app/[site]/...`
- State management: Zustand stores
- API calls: gunakan axios instance dari `lib/api`

### Database

- Gunakan Prisma ORM untuk semua database operations
- Buat migration untuk schema changes: `pnpm --filter @beritakarya/api run db:migrate`
- Soft delete dengan `deletedAt` field

## Reporting Issues

1. Cek existing issues terlebih dahulu
2. Buat issue baru dengan:
   - Deskripsi jelas
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment info (OS, Node version, etc.)

## Code Review

- Semua PR memerlukan review sebelum merge
- Address review comments dengan commit baru
- Squash commits sebelum merge jika diminta

## Questions?

Hubungi team development untuk pertanyaan lebih lanjut.
