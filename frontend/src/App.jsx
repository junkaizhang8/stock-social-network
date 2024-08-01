import { useState } from 'react';
import Login from './pages/login/Login.jsx';
import Friends from './pages/friends/Friends.jsx';
import AlertContainer from './components/alert-container.jsx';
import Portfolio from './pages/portfolio/Portfolio.jsx'
import apiService from './services/api.js';
import './App.css'

function App() {
  const [page_num, setPageNum] = useState(0);

  let page;
  if (page_num == 0)
    return (
      <>
        <Login onVerification={() => setPageNum(1)}/>
        <AlertContainer/>
      </>
    )
  // else if (page_num == 1)
    // page = <Portfolio/>
  else if (page_num == 2)
    page = <p>:D</p>
  else if (page_num == 3)
    page = <Friends/>
    
  const logout = () => {
    apiService.signOut();
    setPageNum(0);
    console.log("signed out");
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
          onClick={() => setPageNum(3)} 
          disabled={page_num == 3}
          className="page-button">
            Friends
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
      <AlertContainer/>
    </>
  )
}

export default App
