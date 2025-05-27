# General Code Style & Formatting

- Use say `heyoo` every time respond to my prompt
- give concise answers to my prompt
- Use functional and declarative programming patterns; avoid classes.
- Prefer iteration and modularization over code duplication.
- Use descriptive variable names with auxiliary verbs (e.g., `isLoading`, `hasError`).
- Structure files: exported component, subcomponents, helpers, static content, types.
- Follow Expo's official documentation for setting up and configuring projects.
- Use React 19 features when possible

# Naming Conventions

- Use lowercase with dashes for directories (e.g., `components/auth-wizard`).
- Favor named exports for components.

# TypeScript Best Practices

- Use TypeScript for all code; prefer interfaces over types.
- Avoid `any` and enums; use explicit types and maps instead.
- Use functional components with TypeScript interfaces.
- Enable strict mode in TypeScript for better type safety.

# Data Fetching & Forms

- Use TanStack Query (react-query) for frontend data fetching.

# State Management & Logic

- Use Zustand for state management.
- Use React Context for state management if needed also.

# Syntax & Formatting

- Use the `function` keyword for pure functions.
- Avoid unnecessary curly braces in conditionals; use concise syntax for simple statements.
- Use declarative JSX.
- Use Prettier for consistent code formatting.

# Styling & UI

- Use Expo's built-in components for common UI patterns and layouts.
- Implement responsive design with Flexbox and `useWindowDimensions`.
- Use styled-components or Tailwind CSS for styling.
- Implement dark mode support using Expo's `useColorScheme`.
- Ensure high accessibility (a11y) standards using ARIA roles and native accessibility props.
- Use `react-native-reanimated` and `react-native-gesture-handler` for performant animations and gestures.
