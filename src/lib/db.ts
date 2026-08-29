import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createDb() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  const adapter = new PrismaLibSql({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  })
  return new PrismaClient({ adapter, log: ['query'] })
}

// Lazily instantiate the client so importing this module during builds
// (without DATABASE_URL) does not attempt a connection.
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = globalForPrisma.prisma ?? createDb()
    const value = Reflect.get(client as object, prop, client)
    return typeof value === 'function' ? value.bind(client) : value
  },
})