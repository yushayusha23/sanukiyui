// ビルド時にPrismaスキーマをPostgreSQLに切り替えるスクリプト
// (VercelなどのデプロイではDATABASE_URLがpostgresql://で始まる)
const fs = require('fs')
const path = require('path')

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma')
let schema = fs.readFileSync(schemaPath, 'utf8')

const dbUrl = process.env.DATABASE_URL || ''
if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
  schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"')
  fs.writeFileSync(schemaPath, schema)
  console.log('✅ Prisma provider: postgresql')
} else {
  console.log('ℹ️  Prisma provider: sqlite (local dev)')
}
