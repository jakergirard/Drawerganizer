# Drawerganizer

A Next.js application for organizing and managing drawer contents with label printing capabilities.

## Quick Start

Pull and run the image:

```bash
docker run -d \
  -p 3000:3000 \
  -v /path/to/your/data:/app/data \
  -e DATABASE_URL="file:/app/data/database.db" \
  jakegirard/drawerganizer:latest
```

Replace `/path/to/your/data` with the path where you want to store your database and application data.

## Configuration

### Environment Variables

- `DATABASE_URL`: SQLite database connection string (default: `file:/app/data/database.db`)
- `PORT`: Port to run the application on (default: 3000)

### Volumes

- `/app/data`: Directory where the SQLite database and application data are stored

### Ports

- `3000`: Web interface

## Data Persistence

The application uses SQLite for data storage. Make sure to:
1. Mount a volume for the data directory
2. Ensure the mounted directory has write permissions
3. Back up the data directory regularly

## Source Code

Visit [GitHub Repository](https://github.com/jakergirard/Drawerganizer) for more information and development instructions. 