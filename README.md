# HR Management System

A comprehensive Human Resources management application built with Laravel 12 and React, featuring team management, scheduling, notifications, and user administration.

## Tech Stack

### Backend
- **PHP**: 8.4.1
- **Laravel**: 12.44.0
- **Database**: SQLite
- **Authentication**: Laravel Fortify 1.33.0
- **Testing**: Pest 4.3.0 with PHPUnit 12.5.4

### Frontend
- **React**: 19.2.0
- **Inertia.js**: 2.1.4 (Laravel adapter: 2.0.18)
- **TypeScript**: 5.7.2
- **Tailwind CSS**: 4.1.12
- **UI Components**: Radix UI primitives
- **Routing**: Laravel Wayfinder 0.1.12

### Development Tools
- **Code Quality**: Laravel Pint 1.26.0, ESLint 9.33.0, Prettier 3.6.2
- **Build Tool**: Vite 7.0.4
- **Logging**: Laravel Pail 1.2.2

## Features

### Authentication & Security
- User registration and login
- Email verification
- Password reset functionality
- Two-factor authentication (2FA) with recovery codes
- Password confirmation for sensitive actions
- Session management

### User Management
- User CRUD operations (Create, Read, Update, Delete)
- User role assignment (Admin, HR, Employee)
- User status management (Active, Inactive, Suspended, Terminated)
- User search functionality
- User listing with pagination

### Team Management
- Create, edit, and delete teams
- Team browsing and discovery
- Team member management
- Team switching (users can belong to multiple teams)
- Team invitations with secure token-based system
- Team profile information (name, description, address, phone, website, picture)
- Primary team assignment for users

### Scheduling System
- Schedule creation and management
- Individual schedule view (`/my-schedule`)
- Team-wide schedule view (`/schedule`)
- Schedule attributes:
  - Date, start time, end time
  - Break duration
  - Shift type
  - Location
  - Notes
  - Status
  - Recurring schedules with recurrence patterns
- Role-based schedule access:
  - Employees: View only their own schedules
  - HR/Admin: View and manage all schedules

### Notifications
- In-app notification system
- Direct notifications (user-to-user)
- Broadcast notifications (team-wide)
- Mark notifications as read
- Mark all notifications as read
- Notification types and categorization

### User Settings
- Profile management (name, email)
- Password update
- Two-factor authentication setup and management
- Appearance settings
- Account deletion

### Dashboard
- Centralized dashboard for authenticated users
- Overview of key information

## Database Schema

### Core Tables

#### `users`
- Basic user information (name, email, password)
- Role and status enums
- Two-factor authentication fields
- Primary team association (`team_id`)

#### `teams`
- Team information (name, description, address, phone, website, picture)
- Creator tracking (`created_by`)

#### `team_user` (Pivot Table)
- Many-to-many relationship between users and teams
- Tracks join date (`joined_at`)

#### `team_invitations`
- Team invitation system
- Secure token-based invitations
- OTP code support
- Expiration tracking
- Usage tracking

#### `schedules`
- Schedule entries with date/time information
- User and team associations
- Shift details (type, location, notes)
- Recurring schedule support
- Status tracking

#### `notifications`
- Notification system
- Sender and recipient tracking
- Support for broadcast notifications (null recipient)
- Read status tracking

## User Roles

### Admin
- Full system access
- User management
- Team management
- Schedule management for all users

### HR
- User management
- Team management
- Schedule management for all users
- Notification management

### Employee
- View own profile
- View own schedules
- View assigned teams
- Receive notifications

## User Status

- **Active**: User can access the system
- **Inactive**: User account is disabled
- **Suspended**: Temporary account suspension
- **Terminated**: Permanent account termination

## Routes

### Public Routes
- `/` - Welcome page
- `/teams/accept-invite/{token}` - Team invitation acceptance

### Authenticated Routes

#### Dashboard
- `GET /dashboard` - Main dashboard

#### Users
- `GET /users` - List all users
- `POST /users` - Create new user
- `PATCH /users/{user}` - Update user
- `DELETE /users/{user}` - Delete user

#### Teams
- `GET /teams` - List user's teams
- `GET /teams/browse` - Browse all teams
- `GET /teams/create` - Create team form
- `POST /teams` - Store new team
- `GET /teams/{team}` - View team details
- `GET /teams/{team}/edit` - Edit team form
- `PATCH /teams/{team}` - Update team
- `DELETE /teams/{team}` - Delete team
- `POST /teams/switch` - Switch active team
- `POST /teams/{team}/join` - Join a team

#### Team Invitations
- `POST /team-invitations` - Create team invitation
- `GET /teams/accept-invite/{token}` - Accept invitation (signed route)
- `POST /teams/accept-invite` - Process invitation acceptance

#### Schedules
- `GET /schedule` - View all schedules (role-based)
- `GET /my-schedule` - View user's personal schedule
- `POST /schedule` - Create schedule
- `PATCH /schedule/{schedule}` - Update schedule
- `DELETE /schedule/{schedule}` - Delete schedule

#### Notifications
- `GET /notifications` - List notifications
- `POST /notifications` - Create notification
- `POST /notifications/{notification}/read` - Mark notification as read
- `POST /notifications/read-all` - Mark all notifications as read

#### Settings
- `GET /settings/profile` - Edit profile
- `PATCH /settings/profile` - Update profile
- `DELETE /settings/profile` - Delete account
- `GET /settings/password` - Change password form
- `PUT /settings/password` - Update password
- `GET /settings/appearance` - Appearance settings
- `GET /settings/two-factor` - Two-factor authentication settings

## Testing

The application includes comprehensive test coverage using Pest:

### Test Suites

#### Authentication Tests
- User registration
- User login
- Email verification
- Password reset
- Password confirmation
- Two-factor authentication challenge
- Verification notification

#### Feature Tests
- Dashboard access
- User CRUD operations
- Schedule CRUD operations
- Team CRUD operations
- Team invitation flow
- Settings (profile, password, 2FA)

### Running Tests

```bash
# Run all tests
php artisan test

# Run specific test file
php artisan test tests/Feature/UserCrudTest.php

# Run with filter
php artisan test --filter=testName
```

## Development Setup

### Prerequisites
- PHP 8.2+
- Composer
- Node.js and npm
- SQLite (or configure another database)

### Installation

1. Clone the repository
2. Install PHP dependencies:
   ```bash
   composer install
   ```

3. Install Node dependencies:
   ```bash
   npm install
   ```

4. Set up environment:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. Run migrations:
   ```bash
   php artisan migrate
   ```

6. Build frontend assets:
   ```bash
   npm run build
   ```

### Development Workflow

#### Start Development Server
```bash
composer run dev
```

This command runs:
- Laravel development server
- Queue worker
- Laravel Pail (log viewer)
- Vite dev server

#### Code Quality

Format PHP code:
```bash
vendor/bin/pint --dirty
```

Format and lint JavaScript/TypeScript:
```bash
npm run format
npm run lint
```

Type check TypeScript:
```bash
npm run types
```

## Project Structure

```
app/
├── Actions/Fortify/        # Fortify authentication actions
├── Http/
│   ├── Controllers/        # Application controllers
│   │   ├── Settings/       # Settings controllers
│   ├── Middleware/         # Custom middleware
│   └── Requests/           # Form request validation
├── Models/                 # Eloquent models
├── Policies/              # Authorization policies
└── Providers/             # Service providers

resources/
├── js/
│   ├── actions/           # Wayfinder-generated route actions
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── layouts/           # Layout components
│   ├── pages/             # Inertia page components
│   ├── routes/            # Wayfinder-generated route types
│   └── types/             # TypeScript type definitions
└── css/                   # Global styles

routes/
├── web.php               # Web routes
└── settings.php          # Settings routes

tests/
├── Feature/              # Feature tests
└── Unit/                 # Unit tests
```

## Key Models

### User
- Relationships: teams, team, notifications (sent/received), schedules
- Enums: `UserRole`, `UserStatus`
- Features: Two-factor authentication

### Team
- Relationships: members, creator, invitations, schedules, primaryUsers
- Features: Picture upload support

### Schedule
- Relationships: user, team
- Features: Recurring schedules, status tracking

### Notification
- Relationships: sender, recipient
- Features: Broadcast support, read tracking

### TeamInvitation
- Relationships: team, creator
- Features: Token-based security, expiration, OTP support

## Security Features

- CSRF protection on all forms
- Signed URLs for team invitations
- Password hashing
- Two-factor authentication
- Role-based access control
- Session management
- Rate limiting on password updates

## Frontend Architecture

- **Inertia.js**: Server-driven SPA architecture
- **React 19**: Component-based UI
- **Tailwind CSS 4**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Wayfinder**: Type-safe route generation
- **TypeScript**: Type safety throughout

## Environment Configuration

Key environment variables:
- `APP_NAME`: Application name
- `APP_ENV`: Environment (local, production, etc.)
- `DB_CONNECTION`: Database connection (default: sqlite)
- `FORTIFY_FEATURES`: Enabled Fortify features

## License

MIT

## Current Development Status

This application is in active development. Current features are functional and tested, with ongoing enhancements and improvements being added regularly.

