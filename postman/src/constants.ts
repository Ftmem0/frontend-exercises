import type { HttpMethod } from './types';

export const STORAGE_KEY = 'wp-hw2-api-client-state';
export const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
export const MAX_HISTORY_ITEMS = 40;
