const API_BASE_URL = 'http://localhost:8000'; // Update with your actual API URL

// Utility Functions
const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
};

const getAuthToken = () => localStorage.getItem('authToken');
const setAuthToken = (token) => localStorage.setItem('authToken', token);
const clearAuthToken = () => localStorage.removeItem('authToken');
const isAuthenticated = () => !!getAuthToken();

// API Functions
const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || 'An error occurred');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Authentication Functions
const handleSignup = async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm_password').value;
  
  // Validation
  if (password !== confirmPassword) {
    showNotification('Passwords do not match', 'error');
    return;
  }
  
  if (password.length < 6) {
    showNotification('Password must be at least 6 characters', 'error');
    return;
  }
  
  try {
    await apiCall('/user/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
      skipAuth: true,
    });
    
    showNotification('Account created successfully! Redirecting to login...', 'success');
    setTimeout(() => {
      window.location.href = 'log_in.html';
    }, 1500);
  } catch (error) {
    showNotification(error.message || 'Registration failed', 'error');
  }
};

const handleLogin = async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  
  try {
    const data = await apiCall('/user/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      skipAuth: true,
    });
    
    setAuthToken(data.access_token);
    showNotification('Login successful!', 'success');
    
    setTimeout(() => {
      window.location.href = 'Dashboard.html';
    }, 1000);
  } catch (error) {
    showNotification(error.message || 'Login failed', 'error');
  }
};

const handleLogout = () => {
  clearAuthToken();
  showNotification('Logged out successfully', 'success');
  setTimeout(() => {
    window.location.href = 'log_in.html';
  }, 1000);
};

// Property Price Prediction
const predictPrice = async (propertyData) => {
  try {
    const data = await apiCall('/predict-price', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
    
    return data;
  } catch (error) {
    showNotification(error.message || 'Price prediction failed', 'error');
    throw error;
  }
};

// Property Search and Filter
const searchProperties = (searchTerm, location) => {
  const properties = document.querySelectorAll('.property-list article');
  let visibleCount = 0;
  
  properties.forEach(property => {
    const title = property.querySelector('h4')?.textContent.toLowerCase() || '';
    const locationText = property.querySelector('p')?.textContent.toLowerCase() || '';
    
    const matchesSearch = !searchTerm || title.includes(searchTerm.toLowerCase());
    const matchesLocation = !location || locationText.includes(location.toLowerCase());
    
    if (matchesSearch && matchesLocation) {
      property.style.display = 'block';
      visibleCount++;
    } else {
      property.style.display = 'none';
    }
  });
  
  return visibleCount;
};

// Hamburger Menu Toggle
const toggleMenu = () => {
  const hamburger = document.getElementById('hamburger');
  const nav = document.querySelector('nav');
  
  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      nav.classList.toggle('active');
    });
  }
};

// Like Functionality
const initializeLikes = () => {
  const likeButtons = document.querySelectorAll('.like-container');
  
  likeButtons.forEach((container, index) => {
    const checkbox = container.querySelector('.hidden-checkbox');
    const uniqueId = `like-toggle-${index}`;
    checkbox.id = uniqueId;
    container.querySelector('label').setAttribute('for', uniqueId);
    
    // Load saved state
    const saved = localStorage.getItem(uniqueId);
    if (saved === 'true') {
      checkbox.checked = true;
    }
    
    // Save state on change
    checkbox.addEventListener('change', (e) => {
      localStorage.setItem(uniqueId, e.target.checked);
      showNotification(
        e.target.checked ? 'Added to favorites' : 'Removed from favorites',
        'success'
      );
    });
  });
};

// Initialize on Page Load
document.addEventListener('DOMContentLoaded', () => {
  // Check current page and initialize accordingly
  const path = window.location.pathname;
  
  // Signup page
  if (path.includes('sign_up.html')) {
    const signupForm = document.querySelector('.auth-form');
    if (signupForm) {
      signupForm.addEventListener('submit', handleSignup);
    }
  }
  
  // Login page
  if (path.includes('log_in.html')) {
    const loginForm = document.querySelector('.auth-form');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }
  }
  
  // Dashboard/Main page
  if (path.includes('Dashboard.html') || path.endsWith('/') || path.endsWith('index.html')) {
    // Initialize hamburger menu
    toggleMenu();
    
    // Initialize likes
    initializeLikes();
    
    // Search functionality
    const searchBtn = document.querySelector('.btn-search');
    const searchInput = document.getElementById('search');
    const locationSelect = document.getElementById('location');
    
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const searchTerm = searchInput?.value || '';
        const location = locationSelect?.value || '';
        const count = searchProperties(searchTerm, location);
        showNotification(`Found ${count} properties`, 'success');
      });
    }
    
    // Add logout button if authenticated
    if (isAuthenticated()) {
      const nav = document.querySelector('nav');
      if (nav) {
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Logout';
        logoutBtn.style.marginLeft = '10px';
        logoutBtn.addEventListener('click', handleLogout);
        nav.appendChild(logoutBtn);
      }
    }
  }
  
  // Property listing page
  if (path.includes('property_listing.html')) {
    if (!isAuthenticated()) {
      showNotification('Please login to list a property', 'error');
      setTimeout(() => {
        window.location.href = 'log_in.html';
      }, 2000);
    }
  }
});

// Export functions for use in other scripts
window.NobleApartments = {
  apiCall,
  predictPrice,
  isAuthenticated,
  showNotification,
  handleLogout,
};