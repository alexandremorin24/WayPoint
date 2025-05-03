import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    user: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    getUser: (state) => state.user,
  },

  actions: {
    setToken(token) {
      this.token = token;
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    },

    setUser(user) {
      this.user = user;
    },

    async login(email, password) {
      try {
        const response = await fetch('/api/backend/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          throw new Error('Login failed');
        }

        const data = await response.json();
        this.setToken(data.token);
        this.setUser(data.user);
        return data;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },

    async logout() {
      this.setToken(null);
      this.setUser(null);
    },

    async checkAuth() {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('/api/backend/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const user = await response.json();
            this.setToken(token);
            this.setUser(user);
            return true;
          }
        } catch (error) {
          console.error('Auth check error:', error);
        }
      }
      this.setToken(null);
      this.setUser(null);
      return false;
    }
  }
}); 
