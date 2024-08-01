import { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './Login.css';

const Login = ({ onVerification }) => {
  const [msg, setMsg] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleVerification = (res) => {
    res.then((res) => {
      const body = res.data;
      if (res.status != 200)
        setMsg(body.error);
      else {
        setMsg(body.message);
        onVerification();
      }
    }).catch((e) => {
      setMsg(e.response.data.error);
    })
  }

  const login = (e) => {
    e.preventDefault();
    if (username != "" && password != "")
      handleVerification(apiService.signIn(username, password));
  }

  const signup = (e) => {
    e.preventDefault();
    if (username != "" && password != "")
      handleVerification(apiService.signUp(username, password));
  }

  const toggleForm = () => {
    setMsg("");
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
        onChange={f => setUsername(f.target.value)}
        value={username}
        required
      />
      <input
        className="form-input"
        type="password"
        name="password"
        placeholder="Password"
        onChange={f => setPassword(f.target.value)}
        value={password}
        required
      />
      <a className="new-user-select" onClick={toggleForm}>New User?</a>
      <input className="form-submit" type="submit" value="Sign In" />
      {msg == "" ? <></> : <p>{msg}</p>}
    </form>
    <form className="complex-form sign-in-form hidden" onSubmit={signup}>
      <div className="form-title">Sign Up</div>
      <input
        className="form-input"
        type="text"
        name="username"
        placeholder="Username"
        onChange={f => setUsername(f.target.value)}
        value={username}
        required
      />
      <input
        className="form-input"
        type="password"
        name="password"
        placeholder="Password"
        onChange={f => setPassword(f.target.value)}
        value={password}
        required
      />
      <a className="new-user-select" onClick={toggleForm}>Already a User?</a>
      <input className="form-submit" type="submit" value="Sign Up" />
    </form>
  </>
  );
};

export default Login;
