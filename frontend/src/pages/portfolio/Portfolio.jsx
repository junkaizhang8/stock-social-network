import { useEffect, useState } from 'react';
import apiService from '../../services/api.js';
import alert from '../../utils/alert.js'
import "./Portfolio.css"

const PortfolioTile = ({ item, setFocus }) => {
  return (
    <div>
      <a 
        className="portfolio-tile" 
        onClick={() => setFocus(item)}>
          {item.name}
      </a>
    </div>
  )
};

const PortfolioViewer = ({ item, goBack }) => {
  return (
    <>
      <div style={styles.backButtonContainer}>
        <button 
          className="back-button"
          onClick={goBack}>
          Go Back
        </button>
      </div>
      <p>{item.name}</p>
    </>
  );
};

const Portfolio = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [focus, setFocus] = useState(null);

  const [createType, setCreate] = useState("Portfolio");
  const [shareType, setShare] = useState("public");

  useEffect (() => {
    getPortfolios();
  }, []);

  const getPortfolios = () => {
    apiService.getPortfolios(0, 200).then((res) => {
      const body = res.data;
      if (res.status != 200)
        console.log(body.error);
      else {
        setPortfolios(body.portfolios);
      }
    }).catch((e) => {
      console.log(e.message);
    });
  }

  const createNewCollection = async (e) => {
    console.log(shareType);
    const name = e.target[0].value;
    e.preventDefault();
    let res;
    try {
      if (createType == "Portfolio")
        res = await apiService.createPortfolio(name);

      else {
        res = await apiService.createStockList(name, shareType);
      }

      getPortfolios();
    } catch (e) {
      alert.error(e.response.data.error);
    }
  }

  if (focus != null) {
    return (
      <>
        <PortfolioViewer item={focus} goBack={() => setFocus(null)}/>
      </>
    );
  }

  else
    return (
      <>
        <form className="simple-form" onSubmit={createNewCollection}>
          <input className="form-input" 
                 type="text"
                 placeholder="Create a new stock"
                 required/>
          <input className="form-submit" 
                 type="submit"
                 value="Create"/>

          <select value={createType} onChange={(e) => setCreate(e.target.value)}>
            <option value="Portfolio">Portfolio</option>
            <option value="Stock List">Stock List</option>
          </select>

          <select value={shareType} onChange={(e) => setShare(e.target.value)}>
            <option value="public">Public</option>
            <option value="shared">Shared</option>
            <option value="private">Private</option>
          </select>
        </form>

        {portfolios.map((item, i) => {
          return (
            <PortfolioTile
              key={i}
              item={item} 
              setFocus={setFocus}/>
          )
        })}
      </>
    );
};

const styles = {
  backButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  }
}

export default Portfolio;
