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
  const [balance, setBalance] = useState(0);
  const [mode, setMode] = useState("Deposit");
  const [stocks, setStocks] = useState([]);
  const [hidden, setHidden] = useState(true);
  const [stockSymbol, setStockSymbol] = useState("");
  const [covarMatrix, setCovar] = useState([]);
  const [corrMatrix, setCorr] = useState([]);
  
  let sym;
  let n;

  useEffect(() => {
    getStocks();
    getBalance();
  }, [item]);

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
    e.preventDefault();

    const num = parseInt(n);

    if (num <= 0) {
      alert.error("Amount must be positive");
      return;
    }

    e.target[0].value = "";
    e.target[1].value = "";

    if (item.type == "Portfolio") {
      apiService.purchaseStock(item.collection_id, sym, num).then(() => {
        alert.success(`Purchased ${num} shares of ${sym}`);
        getStocks();
        getBalance();
      }).catch((e) => {
        alert.error(e.response.data.error);
      });
    } else {
      apiService.addSharesToList(item.collection_id, sym, num).then(() => {
        alert.success(`Added ${num} shares of ${sym}`);
        getStocks();
      }).catch((e) => {
        alert.error(e.response.data.error);
      });
    }
  }

  const getBalance = async () => {
    apiService.getPortfolioBalance(item.collection_id).then((res) => {
      const body = res.data;
      setBalance(body.balance);
    }).catch((e) => {
      alert.error(e.response.data.error);
    });
  }

  const updateBalance = async (e) => {
    e.preventDefault();
    const amount = parseFloat(e.target[0].value);
    e.target[1].value = "";

    if (!isFinite(amount)) {
      alert.error("Invalid amount");
      return;
    }

    if (mode == "Deposit") {
      if (amount <= 0) {
        alert.error("Cannot deposit a non-positive amount");
        return;
      }
      apiService.depositBalance(item.collection_id, amount).then(() => {
        alert.success(`Deposited $${amount.toFixed(2)}`);
        getBalance();
      }).catch((e) => {
        alert.error(e.response.data.error);
      });
    } else {
      if (amount <= 0) {
        alert.error("Cannot withdraw a non-positive amount");
        return;
      }

      if (amount > balance) {
        alert.error("Cannot withdraw more than the current balance");
        return;
      }

      apiService.withdrawBalance(item.collection_id, amount).then(() => {
        alert.success(`Withdrew $${amount.toFixed(2)}`);
        getBalance();
      }).catch((e) => {
        alert.error(e.response.data.error);
      });
    }
  };

  const showStockDetails = (e, symbol) => {
    if (e.target !== e.currentTarget) return;
    setStockSymbol(symbol);
    setHidden(false);
  }

  const removeShares = async (e, symbol) => {
    e.preventDefault();

    const quantity = parseInt(e.target[0].value);
    e.target[0].value = "";

    if (quantity <= 0) {
      alert.error("Quantity must be positive");
      return;
    }

    if (item.type == "Portfolio") {
      apiService.sellStock(item.collection_id, symbol, quantity).then(() => {
        alert.success(`Sold ${quantity} shares of ${symbol}`);
        getStocks();
        getBalance();
      }).catch((e) => {
        alert.error(e.response.data.error);
      });
    } else {
      apiService.removeSharesFromList(item.collection_id, symbol, quantity).then(() => {
        alert.success(`Removed ${quantity} shares of ${symbol}`);
        getStocks();
      }).catch((e) => {
        alert.error(e.response.data.error);
      });
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
      <h2>{item.name}</h2>
      {item.type === "Portfolio" && (
        <div>
          <h3>Balance: ${balance.toFixed(2)}</h3>
          <select onChange={(e) => setMode(e.target.value)}>
              <option value="Deposit">Deposit</option>
              <option value="Withdraw">Withdraw</option>
            </select>
          <form className="simple-form" onSubmit={updateBalance}>
            <input className='form-input' type='text' placeholder='Amount'/>
            <input className='form-submit' type='submit' value={mode}/>
          </form>
        </div>)
      }
      <form className="simple-form"
          onSubmit={handleSubmit}>
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
      <div className={hidden ? "hidden" : undefined}>
        <Stock symbol={stockSymbol} setHidden={setHidden}></Stock>
      </div>

      <div style={{display: "flex" }}>
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
      else if (filter == "personal")
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
        <select value={typeFilter} onChange={(e) => {setFilter(e.target.value); getCollections(e.target.value)}}>
          <option value="Portfolio">Portfolios</option>
          <option value="public">Public Stock Lists</option>
          <option value="shared">Shared With Me</option>
          <option value="personal">My Stock Lists</option>
        </select>
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
