import { useEffect, useState } from 'react';
import apiService from '../../services/api.js';
import Table from '../../utils/table.jsx';
import alert from '../../utils/alert.js';
import Stock from '../../components/stock/Stock';
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

const StockButton = ({ item }) => {
  const [hidden, setHidden] = useState(true);

  return (
    <>
      <button onClick={() => setHidden(false)}>{`Show Data On ${item.symbol}`}</button>
      <div className={hidden ? "hidden" : undefined}>
        <Stock symbol={item.symbol} setHidden={setHidden} held={item.shares}></Stock>
      </div>
    </> 
  );
};

const PortfolioViewer = ({ item, goBack }) => {
  const [stocks, setStocks] = useState([]);
  const [covarMatrix, setCovar] = useState([]);
  const [corrMatrix, setCorr] = useState([]);
  //let covarMatrix = [];
  //let corrMatrix = [];

  let sym;
  let n;

  useEffect(() => {
    getStocks();
  }, []);

  const getStocks = async () => {
    try {
      let res;
      if (item.type == "Portfolio")
        res = await apiService.getPortfolioStocks(item.collection_id);
      else
        res = await apiService.getStockListStocks(item.collection_id);

      const body = res.data;
      if (res.status != 200) {
        alert.error(body.error);
        return;
      }

      let r;
      const cr = [];
      const cv = [];

      for (let i = 0; i < body.stocks.length; i++) {
        const cr_t = [];
        const cv_t = [];

        for (let j = 0; j < body.stocks.length; j++) {
          r = await fetchStat2(body.stocks[i], body.stocks[j]);
          cr_t.push(r.corr.toFixed(3));
          cv_t.push(r.cov.toFixed(3));
        } 

        cr.push(cr_t);
        cv.push(cv_t);
      } 

      setCovar(cv);
      setCorr(cr);
      setStocks(body.stocks);
    } catch(e) {
      console.log(e);
    }
  };

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
      console.log(e);
    }
  }

  const fetchStat2 = async (x, y) => {
    return await apiService.getStockStats2(x.symbol, y.symbol).then((res) => {
      if (res.status != 200)
        return undefined;
      else
        return res.data;
    }).catch((e) => {
      console.log(e);
      return undefined;
    })
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

      <div styles={{display: "flex" }}>
        {stocks.map((item, i) => {
          return (
            <StockButton id={i} item={item}/>
          )
        })}
      </div>
      
      <Table
        caption="Covariance Matrix"
        data={covarMatrix}
        getName={(i) => stocks[i].symbol}
        getData={(i, j) => covarMatrix[i][j]}/>

      <div style={{paddingTop:30}}>
      <Table
        caption="Correlation Matrix"
        data={corrMatrix}
        getName={(i) => stocks[i].symbol}
        getData={(i, j) => corrMatrix[i][j]}/>
      </div>
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

      const body = res.data;
      if (res.status != 200) {
        alert.error(body.error);
        return ;
      }

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
