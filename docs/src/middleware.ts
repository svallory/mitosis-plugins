import { sequence } from 'astro:middleware';
import { schemaHeaders } from './middleware/schema-headers';

/**
 * Main middleware for the documentation site.
 * New features can be added by adding them to the sequence below.
 */
export const onRequest = sequence(
    schemaHeaders,
    // Add more middleware features here
);
