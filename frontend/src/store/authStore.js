import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      tenantId: null,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password })
        const { data: user } = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${data.access_token}` },
        })
        api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`
        set({
          token: data.access_token,
          user,
          tenantId: user.tenant_id,
        })
        return data
      },

      logout: () => {
        delete api.defaults.headers.common['Authorization']
        set({ token: null, user: null, tenantId: null })
      },

      hydrate: () => {
        const token = get().token
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        }
      },
    }),
    {
      name: 'fs-auth',
      partialize: (s) => ({ token: s.token, user: s.user, tenantId: s.tenantId }),
    }
  )
)
