# Drawerganizer

A Next.js application for organizing and managing drawer contents with integrated label printing capabilities. Designed for my extremely specific use case of a ULINE H-4920 next to a ULINE H-4921 but can be modified for anything you need it for. Printing is designed to use a Dymo LabelWriter connected to a CUPS server.

![License](https://img.shields.io/github/license/jakergirard/drawerganizer)
![Docker Pulls](https://img.shields.io/docker/pulls/jakegirard/drawerganizer)

## Features

- Interactive grid-based drawer management
- Label printing via CUPS server
- Search functionality with keyword support
- Flexible drawer sizing (Small, Medium, Large)
- Dark mode support
- Mobile-responsive design
- SQLite database for simple deployment
- Docker support for easy installation

## Prerequisites

- Node.js 20.x or Docker
- CUPS server with Dymo LabelWriter configured
- Git (for development)

## Quick Start with Docker

The easiest way to get started is using Docker:

```bash
docker run -d \
  -p 3000:3000 \
  -v /path/to/your/data:/app/data \
  --name drawerganizer \
  jakegirard/drawerganizer:latest
```

Access the application at `http://localhost:3000`

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/jakegirard/drawerganizer.git
   cd drawerganizer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```env
   DATABASE_URL="file:./data/database.db"
   PORT=3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Building from Source

```bash
npm run build
npm start
```

## Docker Build

Build your own Docker image:

```bash
docker build -t drawerganizer .
```

## Configuration

### Environment Variables

- `DATABASE_URL`: SQLite database connection string (default: `file:/app/data/database.db`)
- `PORT`: Port to run the application on (default: `3000`)

### CUPS Printer Setup

1. Ensure your CUPS server is running and accessible
2. Configure your Dymo LabelWriter in CUPS
3. Access printer settings in the application interface
4. Test the printing functionality using the preview feature

## Project Structure

```
├── src/
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   ├── lib/             # Utility functions and shared code
│   └── styles/          # CSS and styling
├── public/              # Static assets
├── data/               # SQLite database location
└── docker/             # Docker-related files
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.