
# GEMINI.md

## Project Overview

This project is a React-based web application that serves as an electoral management dashboard. It provides tools for visualizing and analyzing electoral data, including analytics, hierarchical data, geographic analysis, and data quality metrics. The application is built with Vite, TypeScript, and Tailwind CSS, and it uses Vitest for testing. It connects to a Supabase backend to fetch and manage data.

## Key Technologies

*   **Frontend:** React, TypeScript, Vite, Tailwind CSS
*   **Data Visualization:** Recharts
*   **Backend:** Supabase
*   **Testing:** Vitest, React Testing Library
*   **Linting:** ESLint

## Building and Running

### Prerequisites

*   Node.js (>=16)
*   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone [repository-url]
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Development

To start the development server, run:

```bash
npm run dev
```

### Building

To build the application for production, run:

```bash
npm run build
```

### Testing

To run the tests, use the following command:

```bash
npm run test
```

You can also run tests in watch mode or with a UI:

```bash
npm run test:watch
npm run test:ui
```

## Development Conventions

*   **Component-Based Architecture:** The application is built using a component-based architecture, with a clear separation of concerns between components, pages, hooks, and services.
*   **TypeScript:** TypeScript is used for static typing to improve code quality and maintainability.
*   **Styling:** Tailwind CSS is used for styling, with custom styles defined in `src/index.css`.
*   **State Management:** The application uses React hooks for state management.
*   **Data Fetching:** Data is fetched from the Supabase backend using custom hooks and services.
*   **Testing:** Tests are written using Vitest and React Testing Library, and they are located in `__tests__` directories alongside the components they test.
*   **Linting:** ESLint is used to enforce code style and catch potential errors.

## Project Structure

```
src/
├── components/
│   ├── analytics/
│   ├── charts/
│   ├── common/
│   ├── hierarchy/
│   ├── layout/
│   ├── pages/
│   ├── shared/
│   └── tables/
├── hooks/
├── lib/
├── services/
├── test/
├── types/
└── utils/
```

*   **`components/`**: Contains reusable React components, organized by feature.
*   **`hooks/`**: Contains custom React hooks.
*   **`lib/`**: Contains the Supabase client configuration.
*   **`services/`**: Contains services for interacting with the Supabase API.
*   **`test/`**: Contains integration and end-to-end tests.
*   **`types/`**: Contains TypeScript type definitions.
*   **`utils/`**: Contains utility functions.
