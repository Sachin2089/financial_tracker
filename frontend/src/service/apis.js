const API_BASE_URL = 'http://127.0.0.1:8000';

// Token management functions
export const getToken = () => {
  return localStorage.getItem('authToken');
};

export const setToken = (token) => {
  localStorage.setItem('authToken', token);
};

export const removeToken = () => {
  localStorage.removeItem('authToken');
};

export const isAuthenticated = () => {
  const token = getToken();
  return token !== null;
};

// API request with token
const apiRequest = async (url, options = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add Authorization header if token exists
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle token expiration
  if (response.status === 401) {
    removeToken();
    window.location.reload(); // Redirect to login
  }

  return response;
};

// CREATE THE API OBJECT - ADD THIS SECTION
export const api = {
  get: async (endpoint) => {
    const response = await apiRequest(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || 'Request failed');
    }
    
    return {
      data: await response.json()
    };
  },

  post: async (endpoint, data) => {
    const response = await apiRequest(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || 'Request failed');
    }
    
    return {
      data: await response.json()
    };
  },

  put: async (endpoint, data) => {
    const response = await apiRequest(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || 'Request failed');
    }
    
    return {
      data: await response.json()
    };
  },

  delete: async (endpoint) => {
    const response = await apiRequest(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || 'Request failed');
    }
    
    return {
      data: await response.json()
    };
  }
};

// Your existing functions remain the same...
export const loginUser = async (username, password) => {
  try {
    const response = await apiRequest(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    // Store token after successful login
    if (data.token || data.access_token) {
      setToken(data.token || data.access_token);
    }
    
    return data;
  } catch (error) {
    throw new Error(error.message || 'Network error occurred');
  }
};

export const signupUser = async (username, email, password) => {
  try {
    const response = await apiRequest(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }
    
    return data;
  } catch (error) {
    throw new Error(error.message || 'Network error occurred');
  }
};

// Logout function
export const logoutUser = () => {
  removeToken();
};



const authService = {
  login: loginUser,
  signup: signupUser,
  logout: logoutUser,
  isAuthenticated,
  getToken,
  setToken,
  removeToken
};

export default authService;
export { authService };
