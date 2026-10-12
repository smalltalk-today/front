import { z } from 'zod';

export const appEnvSchema = z.enum(['develop', 'product']).default('product');
