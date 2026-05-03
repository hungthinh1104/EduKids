import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import { DEFAULT_AVATAR_ITEMS } from '../src/modules/avatar-customization/avatar-item-catalog';

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
  //const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'ChangeMe-Local-Only-123!';
  const adminPassword = 'admin123'

  if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_SEED_PASSWORD) {
    throw new Error('ADMIN_SEED_PASSWORD is required when seeding in production');
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@edukids.com' },
    update: {
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'EduKids',
      role: 'ADMIN',
      isActive: true,
    },
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
  if (process.env.SHOW_SEED_CREDENTIALS === 'true') {
    console.log(`   🔑 Password: ${adminPassword}`);
  } else {
    console.log('   🔒 Password: [hidden] (set SHOW_SEED_CREDENTIALS=true to print)');
  }
  console.log('');

  // ========================================
  // 1. SEED LEARNING CONTENT
  // ========================================
  const imageUrlFor = (
    keyword: string,
    width = 800,
    height = 600,
  ): string =>
    `https://loremflickr.com/${width}/${height}/${encodeURIComponent(keyword)}?lock=${encodeURIComponent(keyword)}`;

  const buildOptions = (correctText: string, distractorTexts: string[]) => {
    const options = [
      { text: correctText, isCorrect: true },
      ...distractorTexts.slice(0, 3).map((text) => ({
        text,
        isCorrect: false,
      })),
    ];

    for (let index = options.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [options[index], options[swapIndex]] = [options[swapIndex], options[index]];
    }

    return options;
  };

  const topicSeeds = [
    {
      name: 'Animals',
      description: 'Learn common animals and pets.',
      learningLevel: 1,
      imageKeyword: 'animals',
      tags: ['animals', 'pets', 'nature'],
      vocabularies: [
        {
          word: 'Cat',
          phonetic: '/kæt/',
          translation: 'Con mèo',
          partOfSpeech: 'noun',
          exampleSentence: 'The cat is sleeping on the sofa.',
          difficulty: 1,
          imageKeyword: 'cat',
        },
        {
          word: 'Dog',
          phonetic: '/dɔːɡ/',
          translation: 'Con chó',
          partOfSpeech: 'noun',
          exampleSentence: 'My dog loves to play in the park.',
          difficulty: 1,
          imageKeyword: 'dog',
        },
        {
          word: 'Rabbit',
          phonetic: '/ˈræbɪt/',
          translation: 'Con thỏ',
          partOfSpeech: 'noun',
          exampleSentence: 'The rabbit is eating carrots.',
          difficulty: 1,
          imageKeyword: 'rabbit',
        },
        {
          word: 'Bird',
          phonetic: '/bɜːrd/',
          translation: 'Con chim',
          partOfSpeech: 'noun',
          exampleSentence: 'The bird is singing in the tree.',
          difficulty: 1,
          imageKeyword: 'bird',
        },
        {
          word: 'Elephant',
          phonetic: '/ˈel.ɪ.fənt/',
          translation: 'Con voi',
          partOfSpeech: 'noun',
          exampleSentence: 'The elephant has a long trunk.',
          difficulty: 2,
          imageKeyword: 'elephant',
        },
      ],
    },
    {
      name: 'Colors',
      description: 'Learn the colors you see every day.',
      learningLevel: 1,
      imageKeyword: 'color',
      tags: ['colors', 'art', 'describing'],
      vocabularies: [
        {
          word: 'Red',
          phonetic: '/red/',
          translation: 'Màu đỏ',
          partOfSpeech: 'noun/adjective',
          exampleSentence: 'The apple is red.',
          difficulty: 1,
          imageKeyword: 'red',
        },
        {
          word: 'Blue',
          phonetic: '/bluː/',
          translation: 'Màu xanh dương',
          partOfSpeech: 'noun/adjective',
          exampleSentence: 'The sky is blue.',
          difficulty: 1,
          imageKeyword: 'blue',
        },
        {
          word: 'Green',
          phonetic: '/ɡriːn/',
          translation: 'Màu xanh lá',
          partOfSpeech: 'noun/adjective',
          exampleSentence: 'The grass is green.',
          difficulty: 1,
          imageKeyword: 'green',
        },
        {
          word: 'Yellow',
          phonetic: '/ˈjel.oʊ/',
          translation: 'Màu vàng',
          partOfSpeech: 'noun/adjective',
          exampleSentence: 'The sun is yellow.',
          difficulty: 1,
          imageKeyword: 'yellow',
        },
        {
          word: 'Purple',
          phonetic: '/ˈpɜːr.pəl/',
          translation: 'Màu tím',
          partOfSpeech: 'noun/adjective',
          exampleSentence: 'She likes a purple backpack.',
          difficulty: 2,
          imageKeyword: 'purple',
        },
      ],
    },
    {
      name: 'Numbers',
      description: 'Count from one to ten.',
      learningLevel: 1,
      imageKeyword: 'numbers',
      tags: ['numbers', 'counting', 'math'],
      vocabularies: [
        {
          word: 'One',
          phonetic: '/wʌn/',
          translation: 'Số một',
          partOfSpeech: 'noun',
          exampleSentence: 'I have one apple.',
          difficulty: 1,
          imageKeyword: 'number one',
        },
        {
          word: 'Two',
          phonetic: '/tuː/',
          translation: 'Số hai',
          partOfSpeech: 'noun',
          exampleSentence: 'I have two books.',
          difficulty: 1,
          imageKeyword: 'number two',
        },
        {
          word: 'Three',
          phonetic: '/θriː/',
          translation: 'Số ba',
          partOfSpeech: 'noun',
          exampleSentence: 'I have three cats.',
          difficulty: 1,
          imageKeyword: 'number three',
        },
        {
          word: 'Four',
          phonetic: '/fɔːr/',
          translation: 'Số bốn',
          partOfSpeech: 'noun',
          exampleSentence: 'There are four chairs.',
          difficulty: 1,
          imageKeyword: 'number four',
        },
        {
          word: 'Five',
          phonetic: '/faɪv/',
          translation: 'Số năm',
          partOfSpeech: 'noun',
          exampleSentence: 'Five stars shine brightly.',
          difficulty: 1,
          imageKeyword: 'number five',
        },
      ],
    },
    {
      name: 'Family',
      description: 'Learn family members and relationships.',
      learningLevel: 1,
      imageKeyword: 'family',
      tags: ['family', 'people', 'home'],
      vocabularies: [
        {
          word: 'Mother',
          phonetic: '/ˈmʌðər/',
          translation: 'Mẹ',
          partOfSpeech: 'noun',
          exampleSentence: 'My mother reads bedtime stories.',
          difficulty: 1,
          imageKeyword: 'mother',
        },
        {
          word: 'Father',
          phonetic: '/ˈfɑːðər/',
          translation: 'Bố',
          partOfSpeech: 'noun',
          exampleSentence: 'My father cooks dinner on Sundays.',
          difficulty: 1,
          imageKeyword: 'father',
        },
        {
          word: 'Sister',
          phonetic: '/ˈsɪstər/',
          translation: 'Chị / em gái',
          partOfSpeech: 'noun',
          exampleSentence: 'My sister likes drawing.',
          difficulty: 1,
          imageKeyword: 'sister',
        },
        {
          word: 'Brother',
          phonetic: '/ˈbrʌðər/',
          translation: 'Anh / em trai',
          partOfSpeech: 'noun',
          exampleSentence: 'My brother plays soccer.',
          difficulty: 1,
          imageKeyword: 'brother',
        },
        {
          word: 'Baby',
          phonetic: '/ˈbeɪbi/',
          translation: 'Em bé',
          partOfSpeech: 'noun',
          exampleSentence: 'The baby is smiling.',
          difficulty: 1,
          imageKeyword: 'baby',
        },
      ],
    },
    {
      name: 'Food',
      description: 'Learn common foods and drinks.',
      learningLevel: 1,
      imageKeyword: 'food',
      tags: ['food', 'drinks', 'snacks'],
      vocabularies: [
        {
          word: 'Apple',
          phonetic: '/ˈæp.əl/',
          translation: 'Quả táo',
          partOfSpeech: 'noun',
          exampleSentence: 'I eat an apple every day.',
          difficulty: 1,
          imageKeyword: 'apple',
        },
        {
          word: 'Banana',
          phonetic: '/bəˈnænə/',
          translation: 'Quả chuối',
          partOfSpeech: 'noun',
          exampleSentence: 'The banana is sweet.',
          difficulty: 1,
          imageKeyword: 'banana',
        },
        {
          word: 'Bread',
          phonetic: '/bred/',
          translation: 'Bánh mì',
          partOfSpeech: 'noun',
          exampleSentence: 'We eat bread for breakfast.',
          difficulty: 1,
          imageKeyword: 'bread',
        },
        {
          word: 'Milk',
          phonetic: '/mɪlk/',
          translation: 'Sữa',
          partOfSpeech: 'noun',
          exampleSentence: 'Milk is in the glass.',
          difficulty: 1,
          imageKeyword: 'milk',
        },
        {
          word: 'Rice',
          phonetic: '/raɪs/',
          translation: 'Cơm',
          partOfSpeech: 'noun',
          exampleSentence: 'Rice is served with vegetables.',
          difficulty: 1,
          imageKeyword: 'rice',
        },
      ],
    },
    {
      name: 'School',
      description: 'Learn the things you use at school.',
      learningLevel: 1,
      imageKeyword: 'school',
      tags: ['school', 'classroom', 'learning'],
      vocabularies: [
        {
          word: 'Book',
          phonetic: '/bʊk/',
          translation: 'Cuốn sách',
          partOfSpeech: 'noun',
          exampleSentence: 'I read a book after class.',
          difficulty: 1,
          imageKeyword: 'book',
        },
        {
          word: 'Pencil',
          phonetic: '/ˈpen.səl/',
          translation: 'Cây bút chì',
          partOfSpeech: 'noun',
          exampleSentence: 'Use a pencil to write.',
          difficulty: 1,
          imageKeyword: 'pencil',
        },
        {
          word: 'Teacher',
          phonetic: '/ˈtiː.tʃər/',
          translation: 'Giáo viên',
          partOfSpeech: 'noun',
          exampleSentence: 'The teacher is very kind.',
          difficulty: 1,
          imageKeyword: 'teacher',
        },
        {
          word: 'Classroom',
          phonetic: '/ˈklæs.ruːm/',
          translation: 'Lớp học',
          partOfSpeech: 'noun',
          exampleSentence: 'Our classroom is bright.',
          difficulty: 2,
          imageKeyword: 'classroom',
        },
        {
          word: 'Backpack',
          phonetic: '/ˈbæk.pæk/',
          translation: 'Cặp sách',
          partOfSpeech: 'noun',
          exampleSentence: 'My backpack is blue.',
          difficulty: 1,
          imageKeyword: 'backpack',
        },
      ],
    },
    {
      name: 'Body',
      description: 'Learn body parts and simple actions.',
      learningLevel: 1,
      imageKeyword: 'body',
      tags: ['body', 'health', 'actions'],
      vocabularies: [
        {
          word: 'Head',
          phonetic: '/hed/',
          translation: 'Cái đầu',
          partOfSpeech: 'noun',
          exampleSentence: 'Touch your head.',
          difficulty: 1,
          imageKeyword: 'head',
        },
        {
          word: 'Hand',
          phonetic: '/hænd/',
          translation: 'Bàn tay',
          partOfSpeech: 'noun',
          exampleSentence: 'Raise your hand.',
          difficulty: 1,
          imageKeyword: 'hand',
        },
        {
          word: 'Eye',
          phonetic: '/aɪ/',
          translation: 'Mắt',
          partOfSpeech: 'noun',
          exampleSentence: 'Close your eyes and open them again.',
          difficulty: 1,
          imageKeyword: 'eye',
        },
        {
          word: 'Nose',
          phonetic: '/noʊz/',
          translation: 'Mũi',
          partOfSpeech: 'noun',
          exampleSentence: 'The nose helps us smell.',
          difficulty: 1,
          imageKeyword: 'nose',
        },
        {
          word: 'Foot',
          phonetic: '/fʊt/',
          translation: 'Bàn chân',
          partOfSpeech: 'noun',
          exampleSentence: 'One foot, two feet.',
          difficulty: 1,
          imageKeyword: 'foot',
        },
      ],
    },
    {
      name: 'Weather',
      description: 'Learn the weather and seasons.',
      learningLevel: 1,
      imageKeyword: 'weather',
      tags: ['weather', 'season', 'nature'],
      vocabularies: [
        {
          word: 'Sun',
          phonetic: '/sʌn/',
          translation: 'Mặt trời',
          partOfSpeech: 'noun',
          exampleSentence: 'The sun is shining.',
          difficulty: 1,
          imageKeyword: 'sun',
        },
        {
          word: 'Rain',
          phonetic: '/reɪn/',
          translation: 'Mưa',
          partOfSpeech: 'noun',
          exampleSentence: 'Rain is falling from the sky.',
          difficulty: 1,
          imageKeyword: 'rain',
        },
        {
          word: 'Cloud',
          phonetic: '/klaʊd/',
          translation: 'Mây',
          partOfSpeech: 'noun',
          exampleSentence: 'A cloud is floating above us.',
          difficulty: 1,
          imageKeyword: 'cloud',
        },
        {
          word: 'Wind',
          phonetic: '/wɪnd/',
          translation: 'Gió',
          partOfSpeech: 'noun',
          exampleSentence: 'The wind is strong today.',
          difficulty: 1,
          imageKeyword: 'wind',
        },
        {
          word: 'Snow',
          phonetic: '/snoʊ/',
          translation: 'Tuyết',
          partOfSpeech: 'noun',
          exampleSentence: 'Snow is white and cold.',
          difficulty: 1,
          imageKeyword: 'snow',
        },
      ],
    },
    {
      name: 'Transport',
      description: 'Learn vehicles and ways to travel.',
      learningLevel: 1,
      imageKeyword: 'transport',
      tags: ['transport', 'vehicles', 'travel'],
      vocabularies: [
        {
          word: 'Car',
          phonetic: '/kɑːr/',
          translation: 'Xe hơi',
          partOfSpeech: 'noun',
          exampleSentence: 'The car is parked outside.',
          difficulty: 1,
          imageKeyword: 'car',
        },
        {
          word: 'Bus',
          phonetic: '/bʌs/',
          translation: 'Xe buýt',
          partOfSpeech: 'noun',
          exampleSentence: 'We go to school by bus.',
          difficulty: 1,
          imageKeyword: 'bus',
        },
        {
          word: 'Bike',
          phonetic: '/baɪk/',
          translation: 'Xe đạp',
          partOfSpeech: 'noun',
          exampleSentence: 'He rides a bike in the park.',
          difficulty: 1,
          imageKeyword: 'bike',
        },
        {
          word: 'Train',
          phonetic: '/treɪn/',
          translation: 'Tàu hỏa',
          partOfSpeech: 'noun',
          exampleSentence: 'The train is very fast.',
          difficulty: 1,
          imageKeyword: 'train',
        },
        {
          word: 'Plane',
          phonetic: '/pleɪn/',
          translation: 'Máy bay',
          partOfSpeech: 'noun',
          exampleSentence: 'The plane flies high in the sky.',
          difficulty: 2,
          imageKeyword: 'plane',
        },
      ],
    },
  ] as const;

  const seedTopicNames = topicSeeds.map((topic) => topic.name);

  // Hard cleanup to keep seed idempotent even on legacy DBs without strict cascades.
  // This prevents duplicate quizzes/options/vocabulary when seed is run multiple times.
  await prisma.topicQuizOption.deleteMany({
    where: {
      quiz: {
        topic: {
          name: { in: seedTopicNames },
        },
      },
    },
  });

  await prisma.topicQuiz.deleteMany({
    where: {
      topic: {
        name: { in: seedTopicNames },
      },
    },
  });

  await prisma.quizOption.deleteMany({
    where: {
      question: {
        vocabulary: {
          topic: {
            name: { in: seedTopicNames },
          },
        },
      },
    },
  });

  await prisma.quizQuestion.deleteMany({
    where: {
      vocabulary: {
        topic: {
          name: { in: seedTopicNames },
        },
      },
    },
  });

  await prisma.vocabularyMedia.deleteMany({
    where: {
      vocabulary: {
        topic: {
          name: { in: seedTopicNames },
        },
      },
    },
  });

  await prisma.vocabulary.deleteMany({
    where: {
      topic: {
        name: { in: seedTopicNames },
      },
    },
  });

  await prisma.topic.deleteMany({
    where: { name: { in: seedTopicNames } },
  });

  console.log('📚 Seeding Topics, Vocabulary, and Quiz Content...');

  const topics = await Promise.all(
    topicSeeds.map((topic) =>
      prisma.topic.create({
        data: {
          name: topic.name,
          description: topic.description,
          learningLevel: topic.learningLevel,
          imageUrl: imageUrlFor(topic.imageKeyword),
          status: 'PUBLISHED',
          tags: [...topic.tags],
        },
      }),
    ),
  );

  const topicByName = new Map(topics.map((topic) => [topic.name, topic]));
  let vocabularyCount = 0;
  let publishedTopicQuizCount = 0;
  let legacyQuizQuestionCount = 0;

  for (const topicSeed of topicSeeds) {
    const topic = topicByName.get(topicSeed.name);
    if (!topic) {
      throw new Error(`Topic ${topicSeed.name} was not created during seed`);
    }

    const createdVocabularies = [];
    for (const vocab of topicSeed.vocabularies) {
      const vocabImageUrl = imageUrlFor(vocab.imageKeyword, 640, 480);
      const createdVocab = await prisma.vocabulary.create({
        data: {
          topicId: topic.id,
          word: vocab.word,
          phonetic: vocab.phonetic,
          translation: vocab.translation,
          partOfSpeech: vocab.partOfSpeech,
          exampleSentence: vocab.exampleSentence,
          imageUrl: vocabImageUrl,
          difficulty: vocab.difficulty,
          status: 'PUBLISHED',
        },
      });

      await prisma.vocabularyMedia.create({
        data: {
          vocabularyId: createdVocab.id,
          type: 'IMAGE',
          url: vocabImageUrl,
        },
      });

      createdVocabularies.push(createdVocab);
      vocabularyCount += 1;
    }

    const vocabWordPool = createdVocabularies.map((vocab) => vocab.word);

    for (const vocab of createdVocabularies) {
      const distractorWords = vocabWordPool.filter((word) => word !== vocab.word);
      const options = buildOptions(vocab.word, distractorWords);
      const questionText = `Which word means "${vocab.translation}"?`;

      const topicQuiz = await prisma.topicQuiz.create({
        data: {
          topicId: topic.id,
          title: `${topic.name} - ${vocab.word}`,
          description: `Practice ${vocab.word.toLowerCase()} with a simple multiple-choice question.`,
          questionText,
          difficultyLevel: Math.max(1, Math.min(3, vocab.difficulty ?? 1)),
          status: 'PUBLISHED',
        },
      });

      await prisma.topicQuizOption.createMany({
        data: options.map((option) => ({
          quizId: topicQuiz.id,
          text: option.text,
          isCorrect: option.isCorrect,
        })),
      });
      publishedTopicQuizCount += 1;

      const quizQuestion = await prisma.quizQuestion.create({
        data: {
          vocabularyId: vocab.id,
          question: questionText,
        },
      });

      await prisma.quizOption.createMany({
        data: options.map((option) => ({
          questionId: quizQuestion.id,
          text: option.text,
          isCorrect: option.isCorrect,
        })),
      });
      legacyQuizQuestionCount += 1;
    }
  }

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
    ...DEFAULT_AVATAR_ITEMS.map((item) =>
      prisma.avatarItem.upsert({
        where: { id: item.id },
        update: {
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          rarity: item.rarity,
        },
        create: {
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          rarity: item.rarity,
        },
      })
    ),
  ]);
  console.log(`✅ Created ${avatarItems.length} avatar items`);

  console.log('');
  console.log('✨ Database seeding completed successfully!');
  console.log('');
  console.log('Summary:');
  console.log(`  - 1 admin user (email: admin@edukids.com)`);
  console.log(`  - ${topics.length} published topics`);
  console.log(`  - ${vocabularyCount} published vocabularies`);
  console.log(`  - ${publishedTopicQuizCount} published topic quizzes`);
  console.log(`  - ${legacyQuizQuestionCount} legacy quiz questions`);
  console.log(`  - ${badges.length} badges`);
  console.log(`  - ${avatarItems.length} avatar items`);
  console.log('  - Vocabulary media, images, and quiz options created');
  console.log('');
  console.log('🔐 Admin Credentials:');
  console.log('   Email: admin@edukids.com');
  if (process.env.SHOW_SEED_CREDENTIALS === 'true') {
    console.log(`   Password: ${adminPassword}`);
  } else {
    console.log('   Password: [hidden] set SHOW_SEED_CREDENTIALS=true to reveal');
  }
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
