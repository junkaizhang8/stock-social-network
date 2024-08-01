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
    return api.post(`/portfolios/${portfolioId}/stocks`, {
      symbol: stockSymbol,
      shares: quantity,
    });
  },

  sellStock: async (portfolioId, stockSymbol, quantity) => {
    return api.post(`/portfolios/${portfolioId}/stocks`, {
      symbol: stockSymbol,
      shares: -quantity,
    });
  },

  getPortfolios: async (page = 0, limit = 10) => {
    return api.get("/portfolios", { params: { page, limit } });
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

  getPublicStockLists: async (page = 0, limit = 10) => {
    return api.get("/stock-lists", { params: { page, limit } });
  },

  getSharedStockLists: async (page = 0, limit = 10) => {
    return api.get("/stock-lists/shared", { params: { page, limit } });
  },

  getPersonalStockLists: async (page = 0, limit = 10) => {
    return api.get("/stock-lists/me", { params: { page, limit } });
  },

  getStockListStocks: async (listId) => {
    return api.get(`/stock-lists/${listId}`);
  },

  createReview: async (listId, text) => {
    return api.post(`/stock-lists/${listId}/reviews`, { text });
  },

  getReviews: async (listId, page = 0, limit = 10) => {
    return api.get(`/stock-lists/${listId}/reviews`, {
      params: { page, limit },
    });
  },

  getStocks: async (page = 0, limit = 10) => {
    return api.get("/stocks", { params: { page, limit } });
  },

  sendFriendRequest: async (username) => {
    return api.post(`/requests/?name=${username}`);
  },

  getFriendRequests: async () => {
    return api.get("/requests");
  },

  acceptFriendRequest: async (username) => {
    return api.patch(`/requests/?name=${username}&action=accept`);
  },

  declineFriendRequest: async (username) => {
    return api.patch(`/requests/?name=${username}&action=decline`);
  },

  getFriends: async () => {
    return api.get("/friends");
  },

  deleteFriend: async (username) => {
    return api.patch(`/friends/?name=${username}`);
  },
};

export default apiService;
