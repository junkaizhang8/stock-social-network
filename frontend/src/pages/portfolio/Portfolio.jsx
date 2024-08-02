import { useEffect, useState } from 'react';
import apiService from '../../services/api.js';
import alert from '../../utils/alert.js'
import "./Portfolio.css"

const PortfolioTile = ({ item, setFocus }) => {
  return (
    <div className="portfolio-tile">
      <p className="portfolio-type">{item.type}</p>
      <a 
        className="portfolio-tile-name" 
        onClick={() => setFocus(item)}>
          {item.name}
      </a>
    </div>
  )
};

const PortfolioViewer = ({ item, goBack }) => {
  let sym;
  let n;

  const handleSubmit = async (e) => {
    try {
      let res;
      e.preventDefault();

      const num = parseInt(n);
      if (!isFinite(num))
        return;

      if (item.type == "Portfolio")
        res = await apiService.purchaseStock(item.collection_id, sym, num);
      else if (item.type == "Stock List")
        res = await apiService.addSharesToList(item.collection_id, sym, num);

      const body = res.data;
      if (res.status != 200)
        alert.error(body.error);
      else
        alert.success(body.message);

    } catch(e) {
      alert.error(e.response.data.error);
    }
  }

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
      <form className="simple-form"
          onClick={(e) => handleSubmit(e)}>
        <input className="form-input" 
          type="text"
          placeholder={`Enter The Symbol Of A Stock You Want To Add To Your ${item.type}`}
          onChange={(e) => sym = e.target.value}
          required/>
        <input className="form-input"
          type="text"
          placeholder="How Much"
          onChange={(e) => n = e.target.value}
          required/>
        <input className="form-submit" 
          type="submit"
          value="Add"/>
      </form>
    </>
  );
};

const Portfolio = () => {
  const [collections, setCollections] = useState([]);
  const [typeFilter, setFilter] = useState("Portfolio");
  const [focus, setFocus] = useState(null);

  const [createType, setCreate] = useState("Portfolio");
  const [shareType, setShare] = useState("public");

  useEffect (() => {
    getCollections(typeFilter);
  }, []);

  const getCollections = async (filter) => {
    try {
      let res;
      if (filter == "Portfolio")
        res = await apiService.getPortfolios(0, 200);
      else if (filter == "public")
        res = await apiService.getPublicStockLists(0, 200);
      else if (filter == "shared")
        res = await apiService.getSharedStockLists(0, 200);
      else if (filter == "private")
        res = await apiService.getPersonalStockLists(0, 200);
      else if (filter == "all")
        res = await apiService.getPersonalStockLists(0, 200);
      else
        return ;

      if (res.status != 200) {
        alert.error(body.error);
        return ;
      }

      const body = res.data;
      if (filter == "private")
        setCollections(body.stockLists.map((item, _) => {
          if (item.visibility == "private")
            return {
              collection_id: item.collection_id,
              visibility: item.visibility,
              name: item.name,
              type: "Stock List"
            }
        }));
      else if (filter == "Portfolio")
        setCollections(body.portfolios.map((item, _) => {
          return {
            collection_id: item.collection_id,
            balance: item.balance,
            name: item.name,
            type: "Portfolio"
          }
        }));
      else
        setCollections(body.stockLists.map((item, _) => {
          return {
            collection_id: item.collection_id,
            visibility: item.visibility,
            name: item.name,
            type: "Stock List"
          }
        }));

    } catch(e) {
      console.log(e);
    }
  }


  const createNewCollection = async (e) => {
    const name = e.target[0].value;
    e.preventDefault();
    let res;
    try {
      if (createType == "Portfolio")
        res = await apiService.createPortfolio(name);

      else {
        res = await apiService.createStockList(name, shareType);
      }

      getCollections(typeFilter);
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
                 placeholder={`Create a New ${createType}`}
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

        <div>
          <div>
            {collections.map((item, i) => {
              if (item != undefined)
                return (
                  <PortfolioTile
                  key={i}
                  item={item} 
                  setFocus={setFocus}/>
                );
            })}
          </div>

          <select value={typeFilter} onChange={(e) => {setFilter(e.target.value); getCollections(e.target.value)}}>
            <option value="Portfolio">Portfolios</option>
            <option value="all">All Stock Lists</option>
            <option value="public">Public Stock Lists</option>
            <option value="shared">Shared With Me</option>
            <option value="private">Private to Me</option>
          </select>
        </div>
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
