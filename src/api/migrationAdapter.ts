/**
 * Adapter universale per migrazione graduale
 * Permette di usare sia base44 che REST API durante la transizione
 */

import { restAdapter } from './adapters/restAdapter';

export const createMigrationAdapter = () => {
  return {
    entities: new Proxy(restAdapter.entities, {
      get(target, prop) {
        if (prop in target) {
          return target[prop as keyof typeof target];
        }
        console.warn(`Entity ${String(prop)} not migrated yet, falling back to base44`);
        return null;
      },
    }),

    auth: {
      async me() {
        try {
          const response = await fetch('/auth/me', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
          });
          return response.json();
        } catch (error) {
          console.error('Auth error:', error);
          throw error;
        }
      },

      async logout() {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      },

      async isAuthenticated() {
        const token = localStorage.getItem('access_token');
        return !!token;
      },

      async updateMe(data: any) {
        const response = await fetch('/auth/me', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        return response.json();
      },
    },
  };
};

export const migrationAdapter = createMigrationAdapter();