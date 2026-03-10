import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

// Load production env if specified
const envFile = process.env.USE_PRODUCTION === 'true' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // ========================================
  // 0. SEED ADMIN USER
  // ========================================
  console.log('👤 Seeding Admin User...');
  const adminPassword = 'Admin@123456'; // Change this in production
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@edukids.com' },
    update: {},
    create: {
      email: 'admin@edukids.com',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'EduKids',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`✅ Created admin user: ${adminUser.email}`);
  console.log(`   📧 Email: admin@edukids.com`);
  console.log(`   🔑 Password: ${adminPassword}`);
  console.log('');

  // ========================================
  // 1. SEED TOPICS
  // ========================================
  console.log('📚 Seeding Topics...');
  const topics = await Promise.all([
    prisma.topic.upsert({
      where: { name: 'Animals' },
      update: {},
      create: {
        name: 'Animals',
        description: 'Learn about animals and their names',
      },
    }),
    prisma.topic.upsert({
      where: { name: 'Colors' },
      update: {},
      create: {
        name: 'Colors',
        description: 'Learn about different colors',
      },
    }),
    prisma.topic.upsert({
      where: { name: 'Numbers' },
      update: {},
      create: {
        name: 'Numbers',
        description: 'Learn to count from 1 to 100',
      },
    }),
    prisma.topic.upsert({
      where: { name: 'Family' },
      update: {},
      create: {
        name: 'Family',
        description: 'Learn about family members',
      },
    }),
    prisma.topic.upsert({
      where: { name: 'Food' },
      update: {},
      create: {
        name: 'Food',
        description: 'Learn about common foods and drinks',
      },
    }),
  ]);
  console.log(`✅ Created ${topics.length} topics`);

  // ========================================
  // 2. SEED VOCABULARY - ANIMALS
  // ========================================
  console.log('🦁 Seeding Vocabulary - Animals...');
  const animalTopic = topics.find((t) => t.name === 'Animals');

  const animalVocabs = await Promise.all([
    prisma.vocabulary.create({
      data: {
        topicId: animalTopic!.id,
        word: 'Cat',
        phonetic: '/kæt/',
        translation: 'Con mèo',
        partOfSpeech: 'noun',
        exampleSentence: 'The cat is sleeping on the sofa.',
        difficulty: 1,
      },
    }),
    prisma.vocabulary.create({
      data: {
        topicId: animalTopic!.id,
        word: 'Dog',
        phonetic: '/dɔːɡ/',
        translation: 'Con chó',
        partOfSpeech: 'noun',
        exampleSentence: 'My dog loves to play in the park.',
        difficulty: 1,
      },
    }),
    prisma.vocabulary.create({
      data: {
        topicId: animalTopic!.id,
        word: 'Elephant',
        phonetic: '/ˈel.ɪ.fənt/',
        translation: 'Con voi',
        partOfSpeech: 'noun',
        exampleSentence: 'The elephant has a long trunk.',
        difficulty: 2,
      },
    }),
    prisma.vocabulary.create({
      data: {
        topicId: animalTopic!.id,
        word: 'Bird',
        phonetic: '/bɜːrd/',
        translation: 'Con chim',
        partOfSpeech: 'noun',
        exampleSentence: 'The bird is singing in the tree.',
        difficulty: 1,
      },
    }),
  ]);

  // ========================================
  // 3. SEED VOCABULARY MEDIA
  // ========================================
  console.log('🖼️ Seeding Vocabulary Media...');
  await Promise.all(
    animalVocabs.map((vocab) =>
      prisma.vocabularyMedia.create({
        data: {
          vocabularyId: vocab.id,
          type: 'IMAGE',
          url: `https://api.dicebear.com/7.x/thumbs/svg?seed=${vocab.word}`,
        },
      })
    )
  );

  // ========================================
  // 4. SEED VOCABULARY - COLORS
  // ========================================
  console.log('🎨 Seeding Vocabulary - Colors...');
  const colorTopic = topics.find((t) => t.name === 'Colors');

  const colorVocabs = await Promise.all([
    prisma.vocabulary.create({
      data: {
        topicId: colorTopic!.id,
        word: 'Red',
        phonetic: '/red/',
        translation: 'Màu đỏ',
        partOfSpeech: 'noun/adjective',
        exampleSentence: 'The apple is red.',
        difficulty: 1,
      },
    }),
    prisma.vocabulary.create({
      data: {
        topicId: colorTopic!.id,
        word: 'Blue',
        phonetic: '/bluː/',
        translation: 'Màu xanh dương',
        partOfSpeech: 'noun/adjective',
        exampleSentence: 'The sky is blue.',
        difficulty: 1,
      },
    }),
    prisma.vocabulary.create({
      data: {
        topicId: colorTopic!.id,
        word: 'Green',
        phonetic: '/ɡriːn/',
        translation: 'Màu xanh lá',
        partOfSpeech: 'noun/adjective',
        exampleSentence: 'The grass is green.',
        difficulty: 1,
      },
    }),
  ]);

  // ========================================
  // 5. SEED VOCABULARY - NUMBERS
  // ========================================
  console.log('🔢 Seeding Vocabulary - Numbers...');
  const numberTopic = topics.find((t) => t.name === 'Numbers');

  const numberVocabs = await Promise.all([
    prisma.vocabulary.create({
      data: {
        topicId: numberTopic!.id,
        word: 'One',
        phonetic: '/wʌn/',
        translation: 'Số một',
        partOfSpeech: 'noun',
        exampleSentence: 'I have one apple.',
        difficulty: 1,
      },
    }),
    prisma.vocabulary.create({
      data: {
        topicId: numberTopic!.id,
        word: 'Two',
        phonetic: '/tuː/',
        translation: 'Số hai',
        partOfSpeech: 'noun',
        exampleSentence: 'I have two books.',
        difficulty: 1,
      },
    }),
    prisma.vocabulary.create({
      data: {
        topicId: numberTopic!.id,
        word: 'Three',
        phonetic: '/θriː/',
        translation: 'Số ba',
        partOfSpeech: 'noun',
        exampleSentence: 'I have three cats.',
        difficulty: 1,
      },
    }),
  ]);

  // ========================================
  // 6. SEED QUIZ QUESTIONS
  // ========================================
  console.log('❓ Seeding Quiz Questions...');
  await Promise.all([
    prisma.quizQuestion.create({
      data: {
        vocabularyId: animalVocabs[0].id,
        question: 'What is this animal?',
        options: {
          create: [
            { text: 'Cat', isCorrect: true },
            { text: 'Dog', isCorrect: false },
            { text: 'Bird', isCorrect: false },
            { text: 'Fish', isCorrect: false },
          ],
        },
      },
    }),
    prisma.quizQuestion.create({
      data: {
        vocabularyId: animalVocabs[1].id,
        question: 'Choose the correct animal',
        options: {
          create: [
            { text: 'Dog', isCorrect: true },
            { text: 'Cat', isCorrect: false },
            { text: 'Rabbit', isCorrect: false },
            { text: 'Mouse', isCorrect: false },
          ],
        },
      },
    }),
    prisma.quizQuestion.create({
      data: {
        vocabularyId: colorVocabs[0].id,
        question: 'What color is this?',
        options: {
          create: [
            { text: 'Red', isCorrect: true },
            { text: 'Blue', isCorrect: false },
            { text: 'Green', isCorrect: false },
            { text: 'Yellow', isCorrect: false },
          ],
        },
      },
    }),
  ]);

  // ========================================
  // 7. SEED BADGES
  // ========================================
  console.log('🏆 Seeding Badges...');
  const badges = await Promise.all([
    prisma.badge.upsert({
      where: { name: 'First Word' },
      update: {},
      create: {
        name: 'First Word',
        description: 'Learn your first word',
      },
    }),
    prisma.badge.upsert({
      where: { name: '10 Words Master' },
      update: {},
      create: {
        name: '10 Words Master',
        description: 'Master 10 words',
      },
    }),
    prisma.badge.upsert({
      where: { name: '7 Day Streak' },
      update: {},
      create: {
        name: '7 Day Streak',
        description: 'Learn for 7 days in a row',
      },
    }),
    prisma.badge.upsert({
      where: { name: 'Perfect Score' },
      update: {},
      create: {
        name: 'Perfect Score',
        description: 'Get 100% on a quiz',
      },
    }),
    prisma.badge.upsert({
      where: { name: 'Pronunciation Star' },
      update: {},
      create: {
        name: 'Pronunciation Star',
        description: 'Perfect pronunciation 10 times',
      },
    }),
  ]);
  console.log(`✅ Created ${badges.length} badges`);

  // ========================================
  // 8. SEED AVATAR ITEMS
  // ========================================
  console.log('👕 Seeding Avatar Items...');
  const avatarItems = await Promise.all([
    prisma.avatarItem.create({
      data: { name: 'Cool Glasses', price: 50 },
    }),
    prisma.avatarItem.create({
      data: { name: 'Party Hat', price: 100 },
    }),
    prisma.avatarItem.create({
      data: { name: 'Crown', price: 200 },
    }),
    prisma.avatarItem.create({
      data: { name: 'Superhero Cape', price: 300 },
    }),
    prisma.avatarItem.create({
      data: { name: 'Rainbow Wings', price: 500 },
    }),
  ]);
  console.log(`✅ Created ${avatarItems.length} avatar items`);

  console.log('');
  console.log('✨ Database seeding completed successfully!');
  console.log('');
  console.log('Summary:');
  console.log(`  - 1 admin user (email: admin@edukids.com)`);
  console.log(`  - ${topics.length} topics`);
  console.log(`  - ${animalVocabs.length + colorVocabs.length + numberVocabs.length} vocabularies`);
  console.log(`  - ${badges.length} badges`);
  console.log(`  - ${avatarItems.length} avatar items`);
  console.log('  - Vocabulary media and quiz questions created');
  console.log('');
  console.log('🔐 Admin Credentials:');
  console.log('   Email: admin@edukids.com');
  console.log('   Password: Admin@123456');
  console.log('   ⚠️  CHANGE PASSWORD IN PRODUCTION!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
