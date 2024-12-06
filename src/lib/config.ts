interface Config {
    database: {
        url: string;
    };
    environment: 'development' | 'production';
}

function validateConfig(): Config {
    const databaseUrl = process.env.DATABASE_URL?.replace('file:', '') || '/app/data/database.db';
    const environment = process.env.NODE_ENV || 'development';

    if (!databaseUrl) {
        throw new Error('Database URL is required');
    }

    if (environment !== 'development' && environment !== 'production') {
        throw new Error('Invalid environment');
    }

    return {
        database: {
            url: databaseUrl,
        },
        environment: environment as Config['environment'],
    };
}

export const config = validateConfig(); 