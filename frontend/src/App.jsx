import { useState } from 'react';
import Portfolio from './pages/Portfolio.jsx';
import Login from './pages/Login.jsx';
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Login onVerification={() => console.log("asdfasdf")}/>
    </>
  )
}

export default App
