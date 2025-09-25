# Asylum Center Dashboard - OOC Steenokkerzeel

A comprehensive management system for the Open Orientation Center (OOC) Steenokkerzeel, providing tools for resident management, bed allocation, and daily operations of the asylum center.

## Overview

This is a Next.js 15.5 application with Supabase backend, designed to streamline the management of asylum center operations including:
- Resident registration and tracking with photo management
- Bed and room management across multiple buildings (Noord and Zuid)
- Meal scheduling and dietary requirements
- Document management with multi-format support
- Real-time occupancy monitoring
- Permission and leave tracking
- Appointment scheduling system
- Administrative document management
- Resident grid view with photo galleries
- Data synchronization and reporting

## Features

### Core Functionality

#### 🏠 **Bed Management System**
- Real-time occupancy tracking across Noord and Zuid buildings
- 69 total bed capacity (36 Noord, 33 Zuid)
- Special accommodations:
  - First floor Noord: Reserved for female residents (18 beds)
  - First floor Zuid: Reserved for minors under 17 (15 beds)
- Visual occupancy indicators and statistics

#### 👥 **Resident Management**
- Complete resident registration system
- Badge number tracking
- Personal information management
- Room assignment tracking
- Check-in/check-out date monitoring
- Reference person assignment

#### 📋 **List Management**
- **Bewonerslijst**: Complete resident roster with filtering and search
- **Keukenlijst**: Meal planning and dietary requirements
- **Overzicht Jongeren**: Leave and permission tracking
- **Data Match-IT**: Data synchronization and matching
- **Toewijzingen**: Staff assignment management with visual status indicators
- **Appointments**: Appointment scheduling and tracking system
- **Administrative Documents**: Centralized document management system
- **Residents Grid**: Visual grid display with photo management (2-14 columns, up to 70 residents)

#### 📊 **Dashboard Analytics**
- Real-time occupancy statistics
- Building-specific metrics
- Gender and age-based segregation monitoring
- Recent activity tracking
- Quick action buttons for common tasks

#### 📁 **Document Management**
- Multi-format file upload support:
  - Excel files (XLS, XLSX)
  - Documents (PDF, DOC, DOCX, PPT)
  - Images (JPG, PNG, GIF, TIFF)
  - Other formats (TXT, RTF, ODT)
- Secure document storage via Supabase

## Tech Stack

### Frontend
- **Framework**: Next.js 15.5.0 (App Router)
- **UI Library**: React 19.1.0
- **Styling**: TailwindCSS 3.4 with custom animations
- **UI Components**: 
  - Radix UI primitives (Dialog, Dropdown, Toast, Icons)
  - Custom shadcn/ui components (Button, Card, Badge, Input, Table)
  - Class Variance Authority for component variants
- **Forms**: React Hook Form 7.62 with Zod validation
- **Theme**: Dark mode support with next-themes
- **Notifications**: Sonner for toast messages

### Backend & Database
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase real-time subscriptions
- **File Storage**: Supabase Storage for documents

### Key Dependencies
- `@supabase/supabase-js` (2.57): Database and auth client
- `@supabase/ssr` (0.7): Server-side rendering support
- `@supabase/auth-ui-react` (0.4.7): Pre-built auth components
- `lucide-react` (0.541): Comprehensive icon library
- `date-fns` (4.1): Date manipulation utilities
- `xlsx` (0.18.5): Excel file processing
- `sonner` (2.0.7): Toast notifications
- `cmdk` (1.1.1): Command menu interface
- `tailwind-merge` (3.3.1): Tailwind class merging utility

## Project Structure

```
asylum-center-dashboard/
├── app/                      # Next.js app directory
│   ├── api/                  # Next.js API routes
│   │   ├── config-status/    # Config validation
│   │   └── env/             # Environment endpoints
│   ├── components/           # Shared components
│   │   ├── layout/          # Layout components
│   │   │   └── DashboardLayout.tsx
│   │   ├── ui/              # UI primitives (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── AddResidentModal.tsx
│   │   ├── EditResidentModal.tsx
│   │   ├── ViewResidentModal.tsx
│   │   ├── ResidentDocumentsModal.tsx
│   │   ├── UploadDocModal.tsx
│   │   └── theme-provider.tsx
│   ├── dashboard/            # Dashboard pages
│   │   ├── administrative-documents/ # Document management
│   │   ├── appointments/     # Appointment scheduling
│   │   ├── bed-management/   # Bed allocation system
│   │   ├── bewonerslijst/    # Resident list
│   │   ├── data-match-it/    # Data synchronization
│   │   ├── keukenlijst/      # Kitchen/meal list
│   │   ├── noord/            # Noord building view
│   │   ├── permissielijst/   # Permission tracking
│   │   ├── residents/        # Resident management
│   │   ├── residents-grid/   # Photo grid view
│   │   ├── toewijzingen/     # Staff assignments
│   │   ├── zuid/             # Zuid building view
│   │   └── page.tsx          # Main dashboard
│   ├── login/                # Authentication page
│   ├── signup/               # Registration page
│   └── page.tsx              # Landing page
├── components/               # Additional UI components
│   └── ui/                  # Extended UI library
├── lib/                      # Utility functions
│   ├── supabase/            # Supabase client configuration
│   ├── DataContext.tsx      # Global data context
│   ├── bedConfig.ts         # Bed configuration
│   └── utils.ts             # Helper functions
├── components.json           # Shadcn/ui configuration
├── tailwind.config.js        # Tailwind configuration
├── postcss.config.mjs        # PostCSS configuration
└── components.json           # Shadcn/ui configuration
```

## Database Schema

### Main Tables
- **residents**: Resident information and status
- **rooms**: Room configuration and capacity
- **room_assignments**: Current and historical bed assignments
- **meal_schedules**: Daily meal and dietary requirements
- **appointments**: Activities and appointments tracking

### Security
- Row Level Security (RLS) enabled on all tables
- Authentication required for all operations
- Role-based access control

## Installation

### Prerequisites
- Node.js 18+ (Recommended: 20.x for best performance)
- npm 10+ or yarn
- Supabase account
- Git

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/mbikedev/steen.git
cd steen
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env.local` file with:
```env
# PHP Backend (Primary)
NEXT_PUBLIC_API_URL=http://localhost:8080/api/php
NEXT_PUBLIC_API_KEY=your_secure_api_key_here

# Supabase (Fallback/Legacy)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Set up PHP backend**
- Copy `api/php/config.example.php` to `api/php/config.php`
- Update database credentials in `config.php`
- Ensure PHP 8.x and MySQL are installed
- Start PHP server:
```bash
./start-php-backend.sh
# Or manually:
php -S localhost:8080 -t api
```

5. **Set up the database**
- For MySQL: Import schema from migration files
- For Supabase: Run SQL scripts in `/supabase/` directory

6. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## Available Scripts

```bash
npm run dev       # Start development server (port 3000)
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint for code quality checks
```

## Environment Variables

Required environment variables in `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For enhanced security in production
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Building Configuration

### Room Layout
- **Noord Building**: 
  - Ground floor: 4 rooms (18 beds total)
  - First floor: 6 rooms for female residents (18 beds)
- **Zuid Building**:
  - Ground floor: 4 rooms (18 beds total) including medical room 2.19 (MED)
  - First floor: 5 rooms for minors (15 beds)

Total capacity: 67 beds

## Authentication Flow

The application uses Supabase Auth with middleware protection:
1. Unauthenticated users are redirected to `/login`
2. Authenticated users have access to all dashboard features
3. Session management handled via SSR cookies

## Key Features Implementation

### Real-time Updates
- Occupancy statistics update in real-time via Supabase subscriptions
- Room assignments reflect immediately across all dashboard views
- Activity feed shows recent changes and user actions
- Live synchronization between multiple user sessions

### Data Import/Export
- Excel file import for bulk resident data (XLSX format)
- Export functionality for reports and analytics
- Document upload with support for multiple formats (PDF, Excel, Word, Images)
- Secure file storage with Supabase Storage buckets

### Multi-language Support
- Interface primarily in Dutch for staff use
- Support for multiple resident languages in data fields
- Customizable UI language preferences

### Modal-Based Workflows
- Add/Edit/View resident information via dedicated modals
- Document upload modal with drag-and-drop support
- User management modals for access control
- Contextual actions with confirmation dialogs

## Security Considerations

- All API routes protected by authentication middleware
- Supabase RLS policies enforce data access rules
- Sensitive resident data encrypted at rest
- Regular session validation
- Input validation with Zod schemas

## Performance Optimizations

- Server-side rendering for initial page loads using Next.js App Router
- Client-side caching with React Context for global state management
- Optimistic UI updates for immediate user feedback
- Lazy loading of dashboard sections and heavy components
- Image optimization with Next.js Image component
- Bundle size optimization with dynamic imports
- Tailwind CSS purging for minimal CSS output
- Component-level code splitting

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESLint configuration for code quality
- Prettier formatting (if configured)
- Component-based architecture with clear separation of concerns

### Testing
- Run `npm run lint` before committing
- Ensure all TypeScript types are properly defined
- Test responsive design on mobile and desktop viewports

### Contributing
Please follow the existing code style and conventions. Ensure all new features include appropriate type definitions and validation.

## Recent Updates

### Latest Changes (September 2025)

#### 🔒 **Security Enhancements**
- Removed all hardcoded credentials from repository
- Implemented secure configuration with environment variables
- Added comprehensive `.gitignore` for sensitive files
- Created `config.example.php` template for safe configuration
- Resolved GitGuardian security alerts

#### 📸 **Residents Grid Page**
- New photo grid view supporting 2-14 columns and up to 70 residents
- Image upload system with database persistence
- Lightbox viewer for full-screen photo viewing
- Photo deletion with confirmation dialogs
- Support for all image formats (JPG, PNG, GIF, etc.)

#### 📄 **Administrative Documents Page**
- New centralized document management system
- Support for multiple file formats (PDF, Excel, Word, Images)
- Secure document storage and retrieval
- User-friendly upload interface

#### 🗓️ **Appointments System**
- Complete appointment scheduling interface
- Calendar view for appointment management
- Integration with resident data

#### 🔧 **Backend Infrastructure**
- Dual backend support (PHP/MySQL primary, Supabase fallback)
- RESTful PHP API with CORS configuration
- Automatic database table creation
- Comprehensive error handling
- API key authentication system

#### 🎨 **UI/UX Improvements**
- Removed "system" theme option for clarity
- Fixed TypeScript errors across all components
- Improved form validation and error handling
- Enhanced responsive design for mobile devices
- Optimized bundle size and performance

### Previous Updates

#### Toewijzingen Page Enhancements
- **Visual Status Indicators**: When assigning resident types (meerderjarig, leeftijdstwijfel, transfer), the system now displays only color-coded indicators:
  - Red: Meerderjarig (adult)
  - Gray: Leeftijdstwijfel (age doubt)
  - Blue: Transfer
- **Centered Cell Content**: All table cell contents are now centered for improved readability
- **Improved UI**: Type labels are hidden after submission, showing only the color coding for cleaner visualization

## License

Private - This system is proprietary to OOC Steenokkerzeel.

## Support

For technical support or questions about the system, please contact the IT department.
