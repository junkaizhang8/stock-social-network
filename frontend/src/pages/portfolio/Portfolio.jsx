import { useEffect, useState } from 'react';
import apiService from '../../services/api.js';
import Table from '../../components/table/Table.jsx';
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
      <button onClick={() => setHidden(false)}>{`${item.symbol} - Held ${item.shares}`}</button>
      <div className={hidden ? "hidden" : undefined}>
        <Stock symbol={item.symbol} setHidden={setHidden} held={item.shares}></Stock>
      </div>
    </> 
  );
};

const PortfolioViewer = ({ item, goBack }) => {
  const [balance, setBalance] = useState(0);
  const [mode, setMode] = useState("Deposit");
  const [transactionMode, setTransactionMode] = useState("Add");
  const [stocks, setStocks] = useState([]);
  const [hidden, setHidden] = useState(true);
  const [stockSymbol, setStockSymbol] = useState("");
  const [covarMatrix, setCovar] = useState([]);
  const [corrMatrix, setCorr] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [presentValue, setPresentValue] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [reviewmode, setReviewMode] = useState(false);
  
  let sym;
  let n;

  useEffect(() => {
    getStocks();
    getBalance();
    getReviews();
  }, [item]);

  const getStocks = async () => {
    try {
      let res;
      if (item.type == "Portfolio")
        res = await apiService.getPortfolioStocks(item.collection_id);
      else {
        res = await apiService.getStockListStocks(item.collection_id);
      }

      console.log(res);

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

      const pVal = body.stocks.reduce((acc, stock) => {
        return acc + stock.shares * stock.price;
      }, 0);

      setPresentValue(pVal);

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

    if (item.type === "Portfolio") {
      if (transactionMode === "Add") {
        apiService.purchaseStock(item.collection_id, sym, num).then(() => {
          alert.success(`Purchased ${num} shares of ${sym}`);
          getStocks();
          getBalance();
        }).catch((e) => {
          alert.error(e.response.data.error);
        });
      } else {
        apiService.sellStock(item.collection_id, sym, num).then(() => {
          alert.success(`Sold ${num} shares of ${sym}`);
          getStocks();
          getBalance();
        }).catch((e) => {
          alert.error(e.response.data.error);
        });
      }
    } else {
      if (transactionMode === "Add") {
        apiService.addSharesToList(item.collection_id, sym, num).then(() => {
          alert.success(`Added ${num} shares of ${sym}`);
          getStocks();
        }).catch((e) => {
          alert.error(e.response.data.error);
        });
      } else {
        apiService.removeSharesFromList(item.collection_id, sym, num).then(() => {
          alert.success(`Removed ${num} shares of ${sym}`);
          getStocks();
        }).catch((e) => {
          alert.error(e.response.data.error);
        });
      }
    }
  }

  const handleRevSub = async (e) => {
    e.preventDefault();
    if (item.type != "Stock List")
      return;

    const rev = e.target[0].value;
    e.target[0].value = "";

    if (!reviewmode)
      apiService.createReview(item.collection_id, rev).then(() => {
        alert.success("Added review!");
        getReviews();
      }).catch((e) => {
        alert.error(e.response.data.error);
      })

    else
      apiService.editReview(item.collection_id, rev).then(() => {
        alert.success("Edited review");
        getReviews();
      }).catch((e) => {
        alert.error(e.response.data.error);
      })

    setReviewMode(false);
  }

  const handleDelRev = async () => {
    if (item.type != "Stock List")
      return;

    apiService.deleteReview(item.collection_id).then(() => {
      alert.success("Deleted review");
      getReviews();
    }).catch((e) => {
      alert.error(e.response.data.error);
    })
  }

  const getBalance = async () => {
    if (item.type != "Portfolio")
      return ;

    apiService.getPortfolioBalance(item.collection_id).then((res) => {
      const body = res.data;
      setBalance(body.balance);
    }).catch((e) => {
      alert.error(e.response.data.error);
    });
  }

  const getReviews = async () => {
    if (item.type != "Stock List")
      return ;

    apiService.getReviews(item.collection_id, 0, 200).then((res) => {
      setReviews(res.data.reviews);
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

  const getTransactions = async () => {
    if (item.type != "Portfolio") return;

    apiService.getPortfolioTransactions(item.collection_id).then((res) => {
      setTransactions(res.data.transactions);
    }).catch((e) => {
      alert.error(e.response.data.error);
    });
  }

  const displayTransactions = () => {
    getTransactions();
    setShowTransactions(true);
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
      <h2>Present Value: ${presentValue.toFixed(2)}</h2>
      {item.type === "Portfolio" && (
        <div>
          <h3>Balance: ${balance.toFixed(2)}</h3>
        </div>)}
        <div className={item.type === "Portfolio" ? undefined : "hidden"}>
          <button className='btn' onClick={() => setShowTransactions(false)} disabled={!showTransactions}>Stocks</button>
          <button className='btn' onClick={() => displayTransactions()} disabled={showTransactions}>Transactions</button>
        </div>
        <div className={showTransactions ? "hidden" : undefined}>
          <div>
            <select onChange={(e) => setMode(e.target.value)}>
              <option value="Deposit">Deposit</option>
              <option value="Withdraw">Withdraw</option>
            </select>
            <form className="simple-form" onSubmit={updateBalance}>
              <input className='form-input' type='text' placeholder='Amount'/>
              <input className='form-submit' type='submit' value={mode}/>
            </form>
          </div>
          <select onChange={(e) => setTransactionMode(e.target.value)}>
            <option value="Add">{item.type === "Portfolio" ? "Buy" : "Add"}</option>
            <option value="Remove">{item.type === "Portfolio" ? "Sell" : "Remove"}</option>
          </select>
          <form className="simple-form"
              onSubmit={handleSubmit}>
            <input className="form-input" 
              type="text"
              placeholder={"Stock Symbol"}
              onChange={(e) => sym = e.target.value}
              required/>
            <input className="form-input"
              type="text"
              placeholder="Amount"
              onChange={(e) => n = e.target.value}
              required/>
            <input className="form-submit" 
              type="submit"
              value={item.type !== "Portfolio" ? transactionMode : (transactionMode === "Add" ? "Buy" : "Sell")}/>
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
          {item.type == "Stock List" &&
            <div>
              <h3>Reviews</h3>
              <form className={"simple-form" + (item.is_owner ? " hidden" : "")} onSubmit={handleRevSub}>
                <input className="form-input"
                  type="text"
                  placeholder={`${reviewmode ? "Edit" : "Write"} a review`}
                  required/>
                <input className="form-submit"
                  type="submit"
                  value="+"/>
              </form>

              {reviews.map((rev_item, i) => {return (
                <div className="portfolio-tile">
                  <h4 className='portfolio-type'>{rev_item.reviewer_name}</h4>
                  <p className="portfolio-type">"{rev_item.text}"</p>
                  <a onClick={() => handleDelRev()} className={"portfolio-tile-name" + (rev_item.is_owner ? "" : " hidden")}>
                    delete?
                  </a>
                  <a onClick={() => setReviewMode(true)} className={"portfolio-tile-name" + (rev_item.is_owner ? "" : " hidden")}>
                    edit?
                  </a>
                </div>)
              })}
            </div>
          }
        </div>
        <div className={showTransactions ? undefined : "hidden"}>
          <div>
            {transactions.length && (
              <div className='transaction-tile row'>
                <p className='col-3 bold'>Symbol</p>
                <p className='col-3 bold'>Shares</p>
                <p className='col-3 bold'>Delta</p>
                <p className='col-3 bold'>Timestamp</p>
              </div>
            )}
            {transactions.map((item, i) => {
              return (
                <div key={i} className='transaction-tile row'>
                  <p className='col-3'>{item.symbol}</p>
                  <p className='col-3'>{item.shares}</p>
                  <p className='col-3'>{(parseFloat(item.delta) > 0 ? "+" : "-") + "$" + Math.abs(parseFloat(item.delta)).toFixed(2)}</p>
                  <p className='col-3'>{item.timestamp}</p>
                  </div>);})}
          </div>
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

      if (filter == "personal")
        setCollections(body.stockLists.map((item, _) => {
          return {
            collection_id: item.collection_id,
            visibility: item.visibility,
            name: item.name,
            type: "Stock List",
            is_owner: true,
          }
        }));
      else if (filter == "Portfolio")
        setCollections(body.portfolios.map((item, _) => {
          return {
            collection_id: item.collection_id,
            balance: item.balance,
            name: item.name,
            type: "Portfolio",
            is_owner: true,
          }
        }));
      else if (filter === "shared")
        setCollections(body.stockLists.map((item, _) => {
          return {
            collection_id: item.collection_id,
            visibility: item.visibility,
            name: item.name,
            type: "Stock List",
            is_owner: false,
          }
        }));
      else
        setCollections(body.stockLists.map((item, _) => {
          return {
            collection_id: item.collection_id,
            visibility: item.visibility,
            name: item.name,
            type: "Stock List",
            is_owner: item.is_owner,
          }
        }));

    } catch(e) {
      console.log(e);
    }
  }

  const deleteStockList = async (listId) => {
    apiService.deleteStockList(listId).then(() => {
      alert.success("Stock List Deleted");
      getCollections(typeFilter);
    }).catch((e) => {
      alert.error(e.response.data.error);
    });
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
      alert.success(`Created ${createType} "${name}"`);
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

          <select className={createType !== "Stock List" ? "hidden" : undefined} value={shareType} onChange={(e) => setShare(e.target.value)}>
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
                  <>
                    <PortfolioTile
                    key={i}
                    item={item} 
                    setFocus={setFocus}/>
                    {item.type == "Stock List" && item.is_owner && <button onClick={() => deleteStockList(item.collection_id)}>Delete</button>}
                  </>
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
