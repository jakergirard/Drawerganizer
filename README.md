# Drawerganizer

A Next.js application for organizing and managing drawer contents with label printing capabilities.

## Quick Start with Docker

The easiest way to run Drawerganizer is using Docker. The image is available on DockerHub:

```bash
docker run -d \
  -p 3000:3000 \
  -v /path/to/your/data:/app/data \
  -e DATABASE_URL="file:/app/data/database.db" \
  jakegirard/drawerganizer:latest
```

Replace `/path/to/your/data` with the path where you want to store your database and application data.

### Environment Variables

- `DATABASE_URL`: SQLite database connection string (default: `file:/app/data/database.db`)
- `PORT`: Port to run the application on (default: 3000)

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   ```bash
   cp .env.example .env
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Building from Source

To build your own Docker image:

```bash
docker build -t drawerganizer .
```

## Data Persistence

The application uses SQLite for data storage. When running with Docker, make sure to:
1. Mount a volume for the data directory
2. Ensure the mounted directory has write permissions
3. Back up the data directory regularly

## License

[Add your license information here]
