import { useState } from 'react';
import Login from './pages/login/Login.jsx';
import Portfolio from './pages/portfolio/Portfolio.jsx'
import './App.css'

function App() {
  const [page_num, setPageNum] = useState(0); 
  let page;
  if (page_num == 0)
    return <Login onVerification={() => setPageNum(1)}/>
  else if (page_num == 1)
    page = <Portfolio/>
  else if (page_num == 2)
    page = <p>:D</p>

  const logout = () => {
    console.log("logout ):");
    setPageNum(0);
  }

  return (
    <>
      <div className="page-selector">
        <button 
          onClick={() => setPageNum(1)} 
          disabled={page_num == 1}
          className="page-button">
            Portfolios 
        </button>
        <button 
          onClick={() => setPageNum(2)} 
          disabled={page_num == 2}
          className="page-button">
            Profile
        </button>
        <button 
          onClick={logout}
          className="page-button">
            Sign Out
        </button>
      </div>
      <div>
       {page}
      </div>
    </>
  )
}

export default App
