
const API_BASE_URL = 'https://parumbo5iv8--p9qqmcg2z56m.code.run';

export const apiService = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },
  
  // Más métodos...
};