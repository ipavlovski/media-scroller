import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'

const db = drizzle(new Database('sqlite.db'))
migrate(db, { migrationsFolder: 'drizzle' })
