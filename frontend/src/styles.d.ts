// Allow importing plain CSS files in TypeScript files (global side-effect imports)
declare module '*.css';
declare module '*.scss';
declare module '*.sass';

// Optionally allow CSS module imports if used elsewhere
declare module '*.module.css';
declare module '*.module.scss';
declare module '*.module.sass';
