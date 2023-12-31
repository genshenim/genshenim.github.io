/* eslint-disable @typescript-eslint/no-restricted-imports */
import router from '@/plugins/router';
/* eslint-enable @typescript-eslint/no-restricted-imports */

/**
 * Returns the global router instance. Needed when used outside setup functions or anywhere else outside the Vue app instance.
 */
export function useRouter(): typeof router {
  return router;
}
