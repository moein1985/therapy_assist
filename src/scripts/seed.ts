import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import { PrismaClient, Role, SenderType, ConversationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupUserByEmail(email: string) {
  const u = await prisma.user.findUnique({ where: { email } });
  if (!u) return;

  // delete related records safely
  await prisma.tokenLog.deleteMany({ where: { userId: u.id } });
  await prisma.chatMessage.deleteMany({ where: { conversation: { userId: u.id } } });
  await prisma.conversation.deleteMany({ where: { userId: u.id } });
  await prisma.journalEntry.deleteMany({ where: { userId: u.id } });
  await prisma.moodLog.deleteMany({ where: { userId: u.id } });
  await prisma.user.delete({ where: { id: u.id } });
}

async function run() {
  try {
    console.log('Seeding database for V2...');

    // Clean existing test users if present
    await cleanupUserByEmail('dr.fate@example.com');
    await cleanupUserByEmail('patient@example.com');

    // Create Therapist
    const therapistPassword = await bcrypt.hash('password123', 10);
    const therapist = await prisma.user.create({
      data: {
        email: 'dr.fate@example.com',
        name: 'Dr. Fate',
        password: therapistPassword,
        role: Role.THERAPIST,
        metadata: { license: 'THER-12345' } as any,
      },
    });

    console.log('Created therapist:', therapist.email);

    // Create Patient and link to therapist
    const patientPassword = await bcrypt.hash('password123', 10);
    const patient = await prisma.user.create({
      data: {
        email: 'patient@example.com',
        name: 'Patient Example',
        password: patientPassword,
        role: Role.PATIENT,
        therapistId: therapist.id,
        metadata: { diagnosis: 'Generalized anxiety' } as any,
      },
    });

    console.log('Created patient:', patient.email, 'linked to therapist:', therapist.email);

    // Create an ACTIVE conversation for patient
    const conversation = await prisma.conversation.create({
      data: {
        userId: patient.id,
        status: ConversationStatus.ACTIVE,
        summary: null,
      },
    });

    console.log('Created conversation for patient:', conversation.id);

    // Add one welcome AI message
    const welcome = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        text: 'سلام! من یک درمانگر هوش مصنوعی هستم. خوشحالم که اینجا هستید — اگر دوست دارید می‌توانیم حرف بزنیم.',
        sender: SenderType.AI,
      },
    });

    console.log('Inserted welcome message id:', welcome.id);

    console.log('Seed completed successfully.');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

run();
