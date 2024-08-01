import { useState, useEffect } from 'react';

const Login = ({ onVerification }) => {
  const [msg, setMsg] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function login(e) {
    e.preventDefault();
    const res = await fetch(`http://localhost:4000/api/users/signin`,{
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
      })
    });

    const body = await res.json();
    if (res.status != 200)
      setMsg(body.error);

    else {
      setMsg(body.message);
      onVerification();
    }

  };

  async function signup(e) {
    e.preventDefault();
    const res = await fetch(`http://localhost:4000/api/users/signup`,{
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
      })
    });

    const body = await res.json();
    if (res.status != 200)
      setMsg(body.error);

    else {
      setMsg(body.message);
      onVerification();
    }
  };


  return (
  <>
    <form>
      <div>
        <input placeholder="username" name="un" type="text" onChange={(e) => setUsername(e.target.value)}/>
      </div>
      <div>
        <input placeholder="password" name="pw" type="password" onChange={(e) => setPassword(e.target.value)}/>
      </div>
      <button type="submit" onClick={login}>Login</button>
      <button type="submit" onClick={signup}>Signup</button>
    </form>
    <p>{msg}</p>
  </>
  );
};

const styles = {
  form: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }
}

export default Login;
