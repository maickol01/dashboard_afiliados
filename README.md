# Electoral Management Dashboard

A hierarchical electoral management dashboard designed to track and manage political campaign affiliates across multiple organizational levels.

## Overview

This application manages a four-tier organizational structure:
- **Leaders (Líderes)**: Top-level campaign organizers
- **Brigadiers (Brigadistas)**: Mid-level coordinators reporting to leaders
- **Mobilizers (Movilizadores)**: Field organizers reporting to brigadiers
- **Citizens (Ciudadanos)**: End-level participants registered by mobilizers

## Technology Stack

### Core Framework
- **React**: 19.1.0 - Modern React with latest features and performance improvements
- **TypeScript**: 5.8.3 - Strict type checking with latest language features
- **Vite**: 7.0.4 - Fast build tool with enhanced optimization

### Styling & UI
- **Tailwind CSS**: 4.1.11 - Utility-first CSS framework with new architecture
- **Lucide React**: 0.525.0 - Modern icon library
- **Custom Color Palette**: Electoral campaign brand colors

### Data & Backend
- **Supabase**: 2.51.0 - PostgreSQL database with real-time capabilities
- **Database Tables**: lideres, brigadistas, movilizadores, ciudadanos

### Data Visualization & Export
- **Recharts**: 3.1.0 - Composable charting library for React
- **jsPDF**: 3.0.1 - PDF generation with autotable plugin 5.0.2
- **XLSX**: 0.18.5 - Excel file generation
- **File-saver**: 2.0.5 - Client-side file saving

### Development Tools
- **ESLint**: 9.31.0 - Code linting with React and TypeScript rules
- **TypeScript ESLint**: 8.18.0 - TypeScript-specific linting rules
- **PostCSS**: 8.5.6 - CSS processing with Tailwind integration

## Getting Started

### Prerequisites
- Node.js (version 18 or higher recommended)
- npm package manager
- Git for version control

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd electoral-management-dashboard
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create `.env.local` file with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

### Code Quality

Run linting:
```bash
npm run lint
```

Fix linting issues automatically:
```bash
npm run lint:fix
```

Type checking:
```bash
npm run type-check
```

## Features

### Analytics Dashboard
- **Real-time Analytics**: Comprehensive metrics generated from live Supabase data
- **Performance Indicators**: Leader efficiency, conversion rates, and growth metrics
- Geographic distribution analysis
- Temporal pattern tracking
- Quality metrics and data completeness analysis
- Predictive analytics and alerts system

### Data Management
- Hierarchical data structure with parent-child relationships
- Real-time data synchronization with Supabase
- Data validation and verification
- Contact information management
- Automatic data quality monitoring

### Export Capabilities
- PDF reports with customizable layouts
- Excel spreadsheets with filtered data
- Bulk export functionality
- Print-friendly formats

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Cross-browser compatibility
- Accessible UI components
- Custom electoral campaign branding

### Real-time Features
- Live data updates every 5 minutes
- Real-time alerts and notifications
- Dynamic analytics recalculation
- Performance monitoring dashboard

## Database Schema

The application uses four main Supabase tables:

### Common Fields
All tables include these standard fields:
- `nombre` - Full name
- `clave_electoral` - Electoral key
- `curp` - Mexican citizen ID
- `direccion` - Address
- `colonia` - Neighborhood
- `codigo_postal` - Postal code
- `seccion` - Electoral section
- `entidad` - State/Entity
- `municipio` - Municipality
- `numero_cel` - Cell phone number
- `num_verificado` - Verification status
- `verification_token` - Verification token
- `created_at` - Creation timestamp

### Hierarchical Relationships
- Leaders can have multiple Brigadiers
- Brigadiers can have multiple Mobilizers
- Mobilizers can register multiple Citizens

### Analytics Generation
The application now generates all analytics in real-time from the Supabase database:
- **Growth Metrics**: Calculated from actual registration dates
- **Performance Analytics**: Based on real hierarchical relationships
- **Quality Metrics**: Derived from data completeness and verification status
- **Geographic Analysis**: Generated from actual location data
- **Temporal Patterns**: Calculated from real registration timestamps

## Recent Tech Stack Upgrade

The application has been recently upgraded to use the latest stable versions of all major dependencies:

### Major Version Updates
- **Vite**: 5.4.2 → 7.0.4 (enhanced build optimization)
- **React**: 18.3.1 → 19.1.0 (React Compiler support, concurrent features)
- **Tailwind CSS**: 3.4.1 → 4.1.11 (new CSS engine, improved performance)
- **Recharts**: 2.12.7 → 3.1.0 (performance improvements)
- **jsPDF**: 2.5.1 → 3.0.1 (enhanced features)

### Migration Notes
- Zero breaking changes requiring code modifications
- All functionality preserved and tested
- Performance maintained or improved
- **Analytics Migration**: Completely migrated from mock data to real Supabase data
- See `MIGRATION_NOTES.md` for detailed upgrade information

## Performance

### Build Metrics
- **Build Time**: ~14 seconds
- **Bundle Size**: ~1.8MB (includes all dependencies)
- **Dev Server Startup**: ~340ms

### Optimization Features
- Tree-shaking with Vite 7.0.4
- CSS purging with Tailwind 4.1.11
- TypeScript strict mode for better performance
- React 19 concurrent features
- **Real-time Data Optimization**: Efficient Supabase queries with automatic caching
- **Analytics Caching**: Smart recalculation only when data changes

## Troubleshooting

### Common Issues After Tech Stack Upgrade

**Build Errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript Errors:**
```bash
# Run type checking
npm run type-check
```

**Linting Issues:**
```bash
# Fix linting automatically
npm run lint:fix
```

**Development Server Issues:**
```bash
# Clear Vite cache and restart
rm -rf node_modules/.vite
npm run dev
```

**Environment Variables:**
- Ensure `.env.local` file exists with correct Supabase credentials
- Verify environment variables start with `VITE_` prefix

**Database Connection Issues:**
```bash
# Verify Supabase connection
# Check that all required tables exist: lideres, brigadistas, movilizadores, ciudadanos
# Ensure RLS policies are properly configured
```

**Analytics Not Loading:**
- Check browser console for Supabase connection errors
- Verify database tables have data
- Ensure proper foreign key relationships exist

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Data Flow

1. **Data Fetching**: Real-time data fetched from Supabase every 5 minutes
2. **Hierarchy Building**: Data structured into hierarchical relationships
3. **Analytics Generation**: Complex analytics calculated from real data
4. **UI Updates**: Components automatically update with new analytics
5. **Export Generation**: Reports generated from current live data

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT License - see LICENSE file for details