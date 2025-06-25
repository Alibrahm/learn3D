# 3D Teaching Platform

A modern, interactive 3D teaching platform built with Next.js, Three.js, and Supabase. This platform provides an immersive learning experience for 3D modeling and design, with features for both students and teachers.
![image](https://github.com/user-attachments/assets/cbe00a3c-60e2-476f-83fe-c52c61f39088)

## Features

### For Students
- Interactive 3D model viewer with STL file support
- Progress tracking and course completion
- Exercise and lesson system
- Model library with examples
- Personal dashboard with achievements
- Real-time model rendering and manipulation
![image](https://github.com/user-attachments/assets/fb20d4f0-1d6e-428e-8283-c01f89c0e417)

### For Teachers
- Course creation and management
- Student progress monitoring
- Model sharing and gallery
- Exercise creation and grading
- Class management tools

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **3D Rendering**: Three.js, STL Loader
- **UI Components**: Shadcn/ui
- **Database**: Supabase
- **Authentication**: Clerk
- **Styling**: Tailwind CSS

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/Alibrahm/learn3D.git
cd learn3D
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
Create a `.env` file with the following variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
BLOB_READ_WRITE_TOKEN=your_blob_token
```

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── components/     # UI components
│   ├── data/          # Static data and content
│   └── utils/         # Utility functions and helpers
├── components/        # Shared components
├── lib/              # Core libraries and configurations
├── public/          # Static assets
└── scripts/         # Database scripts
```

## Key Components

### 1. STL Viewer
A powerful 3D model viewer that supports:
- STL file loading and parsing
- Interactive camera controls
- Model rotation and zoom
- Automatic camera positioning
- Error handling and fallbacks

### 2. Learning Dashboard
A comprehensive dashboard that includes:
- Course progress tracking
- Exercise completion status
- Achievement system
- Model library access
- Personal statistics

### 3. Authentication System
- User roles (Student/Teacher)
- Profile management
- Progress tracking
- Demo mode for exploration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Three.js for 3D rendering capabilities
- Supabase for backend services
- Shadcn/ui for beautiful UI components
- Clerk for authentication
- All contributors who helped with this project
