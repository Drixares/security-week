## Security Week Project

### Installation

```sh
bun install
```

### Database Setup

1. Start the PostgreSQL database:
```sh
docker-compose up -d
```

2. Push the schema to the database:
```sh
bun db:push
```

3. Seed the database with initial roles:
```sh
bun run src/db/seed.ts
```

### Running the Application

```sh
bun run dev
```

Then open http://localhost:3000

### Database Management

#### Available Commands
- `bun db:push` - Push schema changes to database (⚠️ see note below)
- `bun db:generate` - Generate migration files from schema changes
- `bun db:migrate` - Apply pending migrations
- `bun dev:db` - Open Drizzle Studio for database management

#### Known Issue with `drizzle-kit push`

Due to a bug in drizzle-kit 0.31.5, running `bun db:push` multiple times may fail with:
```
error: column "id" is in a primary key
```

This happens because drizzle-kit creates explicit NOT NULL constraints and then tries to remove them on subsequent runs.

**Workaround:** Use the migration workflow instead:
```sh
# 1. Generate migration after schema changes
bun db:generate

# 2. Apply the migration
bun db:migrate
```

Alternatively, if you encounter this issue, the database is likely already in sync with your schema and no action is needed.
