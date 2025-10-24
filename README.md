# Itrix DApp

A decentralized social media application built on BSC.

## Database Setup

### Start PostgreSQL with Docker
```bash
# Start the PostgreSQL container
docker-compose up -d

# Stop the PostgreSQL container
docker-compose down

# View logs
docker-compose logs -f postgres
```

### Prisma Commands

```bash
# Generate Prisma Client (run after schema changes)
npx prisma generate

# Create a migration
npx prisma migrate dev --name <migration-name>

# Reset database (⚠️ Caution: This will delete all data)
npx prisma migrate reset

# View database in Prisma Studio (UI)
npx prisma studio

# Push schema changes directly to database (for development)
npx prisma db push

# Pull schema from existing database
npx prisma db pull

# Format schema file
npx prisma format
```

### Database Connection
The application uses the following connection string:
```
postgresql://postgres:postgres@localhost:5432/itrix_dapp
```

## Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## Environment Variables

Create a `.env` file in the project root:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/itrix_dapp?schema=public"
```

## Project Structure

```
itrix-dapp/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
├── src/
│   ├── app/            # Next.js app directory
│   ├── components/     # React components
│   └── lib/           # Utility functions and configurations
└── docker-compose.yml  # Docker configuration
```

## DB command
generate migration
npx prisma migrate dev --name init

npx prisma migrate dev --name add_description

## Deploy migration
npx prisma migrate deploy

## Command to regenrate prisma client
### Clear the TypeScript cache
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

### Reinstall dependencies
npm install

### Generate Prisma client
npx prisma generate
