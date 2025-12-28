import { PrismaClient } from '@prisma/client';

// Ensures a single instance of PrismaClient is used.
const prisma = new PrismaClient();

export default prisma;
