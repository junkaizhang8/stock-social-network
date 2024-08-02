import { useState, useEffect } from 'react';
import apiService from '../../services/api';
import alert from '../../utils/alert';
import Stock from '../../components/stock/Stock';
import './Login.css';

const Login = ({ onVerification }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [hidden, setHidden] = useState(false);
  const [symbol, setSymbol] = useState("");

  const handleVerification = (res) => {
    res.then(() => {
      onVerification();
    }).catch((e) => {
      alert.error(e.response.data.error);
    });
  };

  const login = (e) => {
    e.preventDefault();
    if (username != "" && password != "")
      handleVerification(apiService.signIn(username, password));
  };

  const signup = (e) => {
    e.preventDefault();
    if (username != "" && password != "")
      apiService.signUp(username, password).then((res) => {
        const body = res.data;
        alert.success(body.message);
      }).catch((err) => {
        alert.error(err.response.data.error);
      }).finally(() => {
        setUsername("");
        setPassword("");
        e.target[0].value = "";
        e.target[1].value = "";
      });
  };

  const toggleForm = () => {
    const forms = document.querySelectorAll('.complex-form');
    forms.forEach(form => form.classList.toggle('hidden'));
  };

  const clicking = () => {
    apiService.getStockStats2("AAPL", "AAPL").then((res) => {
      console.log(res.data);
    }).catch((e) => {
      alert.error(e.response.data.error);
    });
  };

  const trigger = () => {
    setHidden(false);
    setSymbol("AAPL");
  }

  return (
  <>
    <button onClick={trigger}>Click me!</button>
    <div className={hidden ? "hidden" : undefined}>
      <Stock symbol={symbol} setHidden={setHidden}></Stock>
    </div>
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
