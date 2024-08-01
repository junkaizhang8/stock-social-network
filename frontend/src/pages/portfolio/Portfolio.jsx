import { useEffect, useState } from 'react';
import apiService from '../../services/api.js';
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

  if (focus != null) {
    return (
      <>
        <PortfolioViewer item={focus} goBack={() => setFocus(null)}/>
      </>
    );
  }

  else if (portfolios == undefined || portfolios.length == 0)
    return (
      <>
        <p>No portfolios</p>
      </>
    );
  else
    return (
      <>
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
