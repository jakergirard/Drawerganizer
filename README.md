# Drawer Grid System

A dynamic, responsive drawer management system built with Next.js, Prisma, and shadcn/ui. This application provides an interactive grid interface for managing drawer layouts with support for different sizes, search functionality, and persistent storage. The layout is based on a ULINE H-4920 next to a ULINE H-4921 drawer system. 

## Features

- 🎯 Interactive drawer grid with resizable drawers (Small, Medium, Large)
- 🌓 Dark/Light theme support
- 📱 Fully responsive design
- 🔍 Real-time search functionality
- 💾 Persistent storage with SQLite/Prisma
- 🐳 Docker support
- 🔄 Auto-saving changes
- ⌨️ Keyboard navigation support

## Tech Stack

- Next.js 14
- TypeScript
- Prisma (SQLite)
- shadcn/ui
- Tailwind CSS
- Docker

## Installation

### Prerequisites

- Node.js 18 or later
- npm
- Docker (optional)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/jakergirard/Drawerganizer.git
cd Drawerganizer
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Docker Installation

#### Using Pre-built Image
```bash
docker pull yourusername/drawer-grid-system
docker run -p 3000:3000 yourusername/drawer-grid-system
```

#### Building Locally
```bash
docker build -t drawer-grid-system .
docker run -p 3000:3000 drawer-grid-system
```

## Environment Variables

Create a `.env` file in the root directory:
```bash
DATABASE_URL="file:./dev.db"
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio for database management

## Project Structure
```
drawer-grid-system/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/             # Utility functions and database client
│   └── types/           # TypeScript type definitions
├── prisma/              # Prisma schema and migrations
├── public/             # Static assets
└── docker/             # Docker configuration files
```

## Usage

The Drawer Grid System provides a visual interface for managing drawer layouts:

1. **Grid Navigation**: Browse through rows (A-L) and columns (01-15)
2. **Drawer Sizing**: Click on a drawer to:
   - View drawer details
   - Change drawer size (Small/Medium/Large)
   - Add drawer name and keywords
3. **Search**: Use the search bar to find drawers by name or keywords
4. **Theme**: Toggle between light and dark modes

## Docker Hub Distribution

To publish to Docker Hub:

1. Build the image:
```bash
docker build -t yourusername/drawer-grid-system:latest .
```

2. Push to Docker Hub:
```bash
docker login
docker push yourusername/drawer-grid-system:latest
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository.
