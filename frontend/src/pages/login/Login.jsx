import { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './Login.css';

const Login = () => {
  const [msg, setMsg] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const login = async (e) => {
    e.preventDefault();
    apiService.signIn(username, password).then((res) => {
      console.log(res);
    });
  }

  const signup = async (e) => {
    e.preventDefault();
    apiService.signUp(username, password).then((res) => {
      console.log(res);
    });
  }

  const toggleForm = () => {
    const forms = document.querySelectorAll('.complex-form');
    forms.forEach(form => form.classList.toggle('hidden'));
  }


  return (
  <>
    <form className="complex-form sign-in-form" onSubmit={login}>
      <div className="form-title">Sign In</div>
      <input
        className="form-input"
        type="text"
        name="username"
        placeholder="Username"
        required
      />
      <input
        className="form-input"
        type="password"
        name="password"
        placeholder="Password"
        required
      />
      <a className="new-user-select" onClick={toggleForm}>New User?</a>
      <input className="form-submit" type="submit" value="Sign In" />
    </form>
    <form className="complex-form sign-in-form hidden" onSubmit={signup}>
      <div className="form-title">Sign Up</div>
      <input
        className="form-input"
        type="text"
        name="username"
        placeholder="Username"
        required
      />
      <input
        className="form-input"
        type="password"
        name="password"
        placeholder="Password"
        required
      />
      <a className="new-user-select" onClick={toggleForm}>Already a User?</a>
      <input className="form-submit" type="submit" value="Sign Up" />
    </form>
  </>
  );
};

export default Login;
