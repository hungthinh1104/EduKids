export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'EduKids',
    description: 'Nền tảng học tiếng Anh tương tác dành cho trẻ em',
    url: 'https://edukids.app',
    logo: 'https://edukids.app/logo.png',
    sameAs: [
      'https://facebook.com/edukids',
      'https://twitter.com/edukids',
      'https://instagram.com/edukids',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@edukids.app',
    },
  };
}

export function generateEducationalApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalApplication',
    name: 'EduKids',
    description: 'Nền tảng học tiếng Anh vui nhộn cho trẻ em',
    url: 'https://edukids.app',
    applicationCategory: 'EducationalApplication',
    learningResourceType: ['Interactive Lessons', 'Games', 'Quizzes'],
    targetAudience: {
      '@type': 'EducationalAudience',
      educationalRole: 'student',
      educationalLevel: 'elementary school',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'VND',
      description: 'Free and premium plans available',
    },
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateArticleSchema(data: {
  title: string;
  description: string;
  image?: string;
  datePublished: string;
  author: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.title,
    description: data.description,
    image: data.image,
    datePublished: data.datePublished,
    author: {
      '@type': 'Person',
      name: data.author,
    },
  };
}
