# CLAUDE.md - Development Guidelines

## Build Commands
- `npm run dev` - Start development server
- `npm run build` - Build the application
- `npm run start` - Start production server
- `npm run lint` - Run linting

## Code Style Guidelines
- **TypeScript**: Use strict mode with proper typing
- **Formatting**: Follow Next.js conventions
- **Imports**: Use path aliases (@/components, @/lib, @/hooks)
- **Components**: Use shadcn/ui component library
- **Styling**: Use Tailwind CSS, maintain existing theme variables
- **Error Handling**: Use try/catch for API routes, handle loading states
- **API Routes**: Implement in app/api/ with proper response formatting
- **File Structure**: Maintain app directory organization for Next.js pages
- **State Management**: React Query for server state, React Hook Form for forms
- **Validation**: Use Zod schemas from lib/schemas.ts

Before committing any changes, always run `npm run lint` to ensure code quality.