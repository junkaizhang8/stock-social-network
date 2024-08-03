import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:4000/api", // URL of the API
  withCredentials: true, // Send cookies when making requests
});

// NOTE: The service does not perform input validation,
// make sure to validate inputs before calling these functions
const apiService = {
  signUp: async (username, password) => {
    return api.post("/users/signup", {
      username,
      password,
    });
  },

  signIn: async (username, password) => {
    return api.post("/users/signin", {
      username,
      password,
    });
  },

  signOut: async () => {
    return api.delete("/users/signout");
  },

  createPortfolio: async (name, balance) => {
    return api.post("/portfolios", {
      name,
      balance,
    });
  },

  purchaseStock: async (portfolioId, stockSymbol, quantity) => {
    return api.post(`/portfolios/${portfolioId}`, {
      symbol: stockSymbol,
      shares: quantity,
    });
  },

  sellStock: async (portfolioId, stockSymbol, quantity) => {
    return api.post(`/portfolios/${portfolioId}`, {
      symbol: stockSymbol,
      shares: -quantity,
    });
  },

  getPortfolios: async () => {
    return api.get("/portfolios");
  },

  getPortfolioStocks: async (portfolioId) => {
    return api.get(`/portfolios/${portfolioId}`);
  },

  getPortfolioBalance: async (portfolioId) => {
    return api.get(`/portfolios/${portfolioId}/balance`);
  },

  getPortfolioTransactions: async (portfolioId) => {
    return api.get(`/portfolios/${portfolioId}/transactions`);
  },

  depositBalance: async (portfolioId, amount) => {
    return api.patch(`/portfolios/${portfolioId}/balance`, { amount });
  },

  withdrawBalance: async (portfolioId, amount) => {
    return api.patch(`/portfolios/${portfolioId}/balance`, { amount: -amount });
  },

  createStockList: async (name, visibility) => {
    return api.post("/stock-lists", { name, visibility });
  },

  addSharesToList: async (listId, stockSymbol, quantity) => {
    return api.post(`/stock-lists/${listId}`, {
      symbol: stockSymbol,
      shares: quantity,
    });
  },

  removeSharesFromList: async (listId, stockSymbol, amount) => {
    return api.post(`/stock-lists/${listId}`, {
      symbol: stockSymbol,
      shares: -amount,
    });
  },

  getPublicStockLists: async () => {
    return api.get("/stock-lists");
  },

  getSharedStockLists: async () => {
    return api.get("/stock-lists/shared");
  },

  getPersonalStockLists: async () => {
    return api.get("/stock-lists/me");
  },

  getStockListStocks: async (listId) => {
    return api.get(`/stock-lists/${listId}`);
  },

  deleteStockList: async (listId) => {
    return api.delete(`/stock-lists/${listId}`);
  },

  createReview: async (listId, text) => {
    return api.post(`/stock-lists/${listId}/reviews`, { text });
  },

  getReviews: async (listId) => {
    return api.get(`/stock-lists/${listId}/reviews`);
  },

  editReview: async (listId, text) => {
    return api.patch(`/stock-lists/${listId}/reviews`, { text });
  },

  deleteReview: async (listId) => {
    return api.delete(`/stock-lists/${listId}/reviews`);
  },

  sendFriendRequest: async (name) => {
    return api.post(`/requests/?name=${name}`);
  },

  getIncomingFriendRequests: async () => {
    return api.get("/requests/?type=incoming");
  },

  getOutgoingFriendRequests: async () => {
    return api.get("/requests/?type=outgoing");
  },

  acceptFriendRequest: async (name) => {
    return api.patch(`/requests/?name=${name}&action=accept`);
  },

  declineFriendRequest: async (name) => {
    return api.patch(`/requests/?name=${name}&action=decline`);
  },

  getFriends: async () => {
    return api.get("/friends");
  },

  deleteFriend: async (name) => {
    return api.patch(`/friends/?name=${name}`);
  },

  getStock: async (symbol) => {
    return api.get(`/stocks/${symbol}`);
  },

  getStockHistory: async (symbol, start = "", end = "") => {
    let params = start !== "" || end !== "" ? "/?" : "";
    params += start !== "" ? `start=${start}` : "";
    params += start !== "" && end !== "" ? "&" : "";
    params += end !== "" ? `end=${end}` : "";

    return api.get(`/stocks/${symbol}/history${params}`);
  },

  getStockStats: async (symbol) => {
    return api.get(`/stats/stat1?sym=${symbol}`);
  },

  getStockStats2: async (sym1, sym2) => {
    return api.get(`/stats/stat2?sym1=${sym1}&sym2=${sym2}`);
  },
};

export default apiService;
