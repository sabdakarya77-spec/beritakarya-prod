import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BeritaKarya API',
      version: '1.0.0',
      description: 'API documentation for BeritaKarya News Portal',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        HomepageConfig: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            siteId: { type: 'string', format: 'uuid' },
            template: { type: 'string', enum: ['A', 'B', 'C', 'D', 'E', 'F'], default: 'F', description: 'Template selection' },
            heroMode: { type: 'string', enum: ['MAGAZINE_COVER_550', 'BENTO_4', 'MAGAZINE_COVER', 'SPLIT_HERO', 'BENTO_3', 'DUAL_HERO'], default: 'MAGAZINE_COVER_550' },
            feedLayout: { type: 'string', enum: ['sidebar_70_30', 'pattern_rotation', 'asymmetric_heavy', 'text_heavy', 'dense_3col', 'hero_pair_heavy'], default: 'sidebar_70_30' },
            trendingStyle: { type: 'string', enum: ['numbered_podium', 'horizontal_strip', 'ticker', 'sticky_sidebar', 'with_context'], default: 'numbered_podium' },
            scoreFreshness: { type: 'number', minimum: 0, maximum: 1, default: 0.4, description: 'Bobot scoring freshness' },
            scoreEngagement: { type: 'number', minimum: 0, maximum: 1, default: 0.3, description: 'Bobot scoring engagement' },
            scoreEditorial: { type: 'number', minimum: 0, maximum: 1, default: 0.3, description: 'Bobot scoring editorial' },
            opinionCategories: { type: 'array', items: { type: 'string' }, description: 'Slug kategori opini' },
            photoCategories: { type: 'array', items: { type: 'string' }, description: 'Slug kategori foto' },
            videoCategories: { type: 'array', items: { type: 'string' }, description: 'Slug kategori video' },
            sectionOrder: { type: 'array', items: { type: 'string' }, description: 'Urutan section homepage' },
            sectionVisibility: { type: 'object', description: 'Toggle section on/off' },
          },
        },
        HomepageConfigInput: {
          type: 'object',
          properties: {
            template: { type: 'string', enum: ['A', 'B', 'C', 'D', 'E', 'F'] },
            heroMode: { type: 'string' },
            feedLayout: { type: 'string' },
            trendingStyle: { type: 'string' },
            scoreFreshness: { type: 'number', minimum: 0, maximum: 1 },
            scoreEngagement: { type: 'number', minimum: 0, maximum: 1 },
            scoreEditorial: { type: 'number', minimum: 0, maximum: 1 },
            opinionCategories: { type: 'array', items: { type: 'string' } },
            photoCategories: { type: 'array', items: { type: 'string' } },
            videoCategories: { type: 'array', items: { type: 'string' } },
            sectionOrder: { type: 'array', items: { type: 'string' } },
            sectionVisibility: { type: 'object' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/main.ts', './src/modules/**/*.ts'],
}

export const specs = swaggerJsdoc(options)
