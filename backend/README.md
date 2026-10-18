# Backend

NestJS API cho Task Manager. Hướng dẫn đầy đủ về project, frontend, Docker,
environment variables, database, API và CI nằm tại:

- [README.md](../README.md)

## Chạy nhanh

```powershell
cd C:\nestjs-task-manager\backend
docker compose up -d
npm install
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

Backend chạy tại `http://localhost:3001`.

- Swagger UI: `http://localhost:3001/api`
- OpenAPI JSON: `http://localhost:3001/api-json`
- Prisma Studio: chạy `npx prisma studio`, sau đó mở `http://localhost:5555`

## Kiểm tra

```powershell
npm run lint
npm run build
npm run test:unit
npm run test:e2e
```
