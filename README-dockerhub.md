# Drawerganizer

A Next.js application for organizing and managing drawer contents with integrated label printing capabilities. Designed for my extremely specific use case of a ULINE H-4920 next to a ULINE H-4921 but can be modified for anything you need it for. Printing is designed to use a Dymo LabelWriter connected to a CUPS server. 

## Features

- Interactive grid-based drawer management
- Label printing support
- Search functionality for drawer contents
- Flexible drawer sizing (Small, Medium, Large)
- Keyword tagging system
- Dark mode support
- Mobile-responsive design

## Quick Start

Pull and run the image:

```bash
docker run -d \
  -p 3000:3000 \
  -v /path/to/your/data:/app/data \
  --name drawerganizer \
  jakegirard/drawerganizer:latest
```

Access the application at `http://localhost:3000`

## Configuration

### Environment Variables

- `DATABASE_URL`: SQLite database connection string (default: `file:/app/data/database.db`)
- `PORT`: Port to run the application on (default: `3000`)

### Volumes

- `/app/data`: Directory where the SQLite database is stored
  - Ensure this directory has write permissions
  - Regular backups recommended

### Ports

- `3000`: Web interface

## Printer Setup

The application supports label printing. To use this feature:

1. Configure your label printer
2. Access printer settings through the application interface
3. Test print functionality using the preview feature

## Data Management

- Uses SQLite for data storage
- Automatic database initialization on first run
- Data persists across container restarts when using a mounted volume
- Regular backups recommended for data safety

## Docker Compose Example

```yaml
version: '3'
services:
  drawerganizer:
    image: jakegirard/drawerganizer:latest
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - DATABASE_URL=file:/app/data/database.db
    restart: unless-stopped
```

## Security Considerations

- The application is designed for local network use
- Consider using a reverse proxy for internet exposure
- Implement appropriate network security measures

## Support

For issues, feature requests, or contributions, please visit the [GitHub repository](https://github.com/jakegirard/drawerganizer).

## License

MIT License 