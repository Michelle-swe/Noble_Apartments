// Configuration
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
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  `;
  
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
};

// LocalStorage User Management
const saveUser = (username, email, password) => {
  const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
  
  // Check if user already exists
  const existingUser = users.find(u => u.username === username || u.email === email);
  if (existingUser) {
    throw new Error('Username or email already exists');
  }
  
  users.push({ username, email, password });
  localStorage.setItem('registeredUsers', JSON.stringify(users));
};

const verifyUser = (usernameOrEmail, password) => {
  const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
  
  const user = users.find(u => 
    (u.username === usernameOrEmail || u.email === usernameOrEmail) && 
    u.password === password
  );
  
  return user;
};

const setCurrentUser = (user) => {
  localStorage.setItem('currentUser', JSON.stringify({
    username: user.username,
    email: user.email,
    loggedIn: true,
    loginTime: new Date().toISOString()
  }));
};

const getCurrentUser = () => {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
};

const clearCurrentUser = () => {
  localStorage.removeItem('currentUser');
};

const isAuthenticated = () => {
  const user = getCurrentUser();
  return user && user.loggedIn;
};

// Authentication Functions
const handleSignup = async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm_password').value;
  
  // Validation
  if (!username || !email || !password) {
    showNotification('Please fill in all fields', 'error');
    return;
  }
  
  if (password !== confirmPassword) {
    showNotification('Passwords do not match', 'error');
    return;
  }
  
  if (password.length < 6) {
    showNotification('Password must be at least 6 characters', 'error');
    return;
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showNotification('Please enter a valid email address', 'error');
    return;
  }
  
  try {
    // Save to localStorage
    saveUser(username, email, password);
    
    // Also try to register with API (optional - will work offline)
    try {
      await fetch(`${API_BASE_URL}/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
    } catch (apiError) {
      console.log('API registration skipped - working offline');
    }
    
    showNotification('Account created successfully! Redirecting to login...', 'success');
    
    // Clear form
    e.target.reset();
    
    setTimeout(() => {
      window.location.href = 'log_in.html';
    }, 1500);
  } catch (error) {
    showNotification(error.message || 'Registration failed', 'error');
  }
};

const handleLogin = async (e) => {
  e.preventDefault();
  
  const usernameOrEmail = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  
  if (!usernameOrEmail || !password) {
    showNotification('Please enter username/email and password', 'error');
    return;
  }
  
  try {
    // Verify user from localStorage
    const user = verifyUser(usernameOrEmail, password);
    
    if (!user) {
      showNotification('Invalid username/email or password', 'error');
      return;
    }
    
    // Set current user
    setCurrentUser(user);
    
    // Also try to login with API (optional - will work offline)
    try {
      const response = await fetch(`${API_BASE_URL}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameOrEmail, password }),
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('authToken', data.access_token);
      }
    } catch (apiError) {
      console.log('API login skipped - working offline');
    }
    
    showNotification('Login successful! Welcome back!', 'success');
    
    setTimeout(() => {
      window.location.href = 'Dashboard.html';
    }, 1000);
  } catch (error) {
    showNotification(error.message || 'Login failed', 'error');
  }
};

const handleLogout = () => {
  clearCurrentUser();
  localStorage.removeItem('authToken');
  showNotification('Logged out successfully', 'success');
  setTimeout(() => {
    window.location.href = 'log_in.html';
  }, 1000);
};

// API Functions (for price prediction when backend is available)
const predictPrice = async (propertyData) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/predict-price`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(propertyData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || 'Price prediction failed');
    }
    
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
    const currentUser = getCurrentUser();
    const likeKey = currentUser ? `${currentUser.username}_${uniqueId}` : uniqueId;
    const saved = localStorage.getItem(likeKey);
    if (saved === 'true') {
      checkbox.checked = true;
    }
    
    // Save state on change
    checkbox.addEventListener('change', (e) => {
      localStorage.setItem(likeKey, e.target.checked);
      showNotification(
        e.target.checked ? '❤️ Added to favorites' : 'Removed from favorites',
        'success'
      );
    });
  });
};

// Display welcome message for logged-in users
const displayWelcomeMessage = () => {
  const user = getCurrentUser();
  if (user && user.loggedIn) {
    const header = document.querySelector('header h1');
    if (header) {
      const welcomeMsg = document.createElement('span');
      welcomeMsg.textContent = ` - Welcome, ${user.username}!`;
      welcomeMsg.style.fontSize = '0.6em';
      welcomeMsg.style.color = '#666';
      header.appendChild(welcomeMsg);
    }
  }
};

// Check authentication and redirect if needed
const checkAuth = () => {
  const path = window.location.pathname;
  
  // Pages that require authentication
  const protectedPages = ['Dashboard.html', 'property_listing.html'];
  const isProtectedPage = protectedPages.some(page => path.includes(page));
  
  if (isProtectedPage && !isAuthenticated()) {
    showNotification('Please login to access this page', 'error');
    setTimeout(() => {
      window.location.href = 'log_in.html';
    }, 1500);
    return false;
  }
  
  return true;
};

// Initialize on Page Load
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  
  // Check authentication for protected pages
  checkAuth();
  
  // Signup page
  if (path.includes('sign_up.html')) {
    const signupForm = document.querySelector('.auth-form');
    if (signupForm) {
      signupForm.addEventListener('submit', handleSignup);
    }
  }
  
  // Login page
  if (path.includes('log_in.html')) {
    // Redirect if already logged in
    if (isAuthenticated()) {
      window.location.href = 'Dashboard.html';
      return;
    }
    
    const loginForm = document.querySelector('.auth-form');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }
  }
  
  // Dashboard/Main page
  if (path.includes('Dashboard.html') || path.endsWith('/') || path.endsWith('index.html')) {
    // Initialize hamburger menu
    toggleMenu();
    
    // Display welcome message
    displayWelcomeMessage();
    
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
      
      // Also search on Enter key
      if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            searchBtn.click();
          }
        });
      }
    }
    
    // Add logout button if authenticated
    if (isAuthenticated()) {
      const nav = document.querySelector('nav');
      if (nav) {
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Logout';
        logoutBtn.className = 'logout-btn';
        logoutBtn.style.cssText = `
          background: #ef4444;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        `;
        logoutBtn.addEventListener('click', handleLogout);
        nav.appendChild(logoutBtn);
      }
    }
  }
});

// Export functions for use in other scripts
window.NobleApartments = {
  predictPrice,
  isAuthenticated,
  showNotification,
  handleLogout,
  getCurrentUser,
  searchProperties,
};