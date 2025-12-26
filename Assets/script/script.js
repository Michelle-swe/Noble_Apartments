document.addEventListener('DOMContentLoaded', function () {
  const regForm = document.getElementById('registerForm');
  if (!regForm) return;

  regForm.addEventListener('submit', function (e) {
    e.preventDefault();                     
    const formData = new FormData(regForm);
    const payload = {
      username: formData.get('username'),
      email:    formData.get('email'),
      password: formData.get('password')
    };

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/user/register', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 201) {           
          var data = JSON.parse(xhr.responseText);
          localStorage.setItem('authToken', data.access_token);
          window.location.href = 'login.html';
        } else {
          alert('Registration failed');
        }
      }
    };

    xhr.onerror = function () {
      console.error('Request failed');
      alert('Something went wrong');
    };

    xhr.send(JSON.stringify(payload));
  });
});