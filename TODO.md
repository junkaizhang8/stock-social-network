# Stocks:
## Fields
Symbol - Alphabetic string representing a company
Timestamp - Date for which the stock price was recorded
Open - The strike price of the first trade of the day
High - The highest strike price durin the day
Low - The lowest strike price during the day
Close - The strike price of the last trade of the day
Volume - The total number of shares traded during the day

## Functional Dependencies
Symbol, Timestamp -> Open, High, Low, Close, Volume

# Portfolios:
## Fields
- User Id
- Balance
- Stock history
    - User Id
    - Stock.Symbol
    - Amount changed
    - Date
- Portfolio
    - Stock list
    - Statistics cache
    - Portfolio Id

## Requirements
1. Deposit and withdraw cash from an account
2. Record stocks bought and sold by an account
3. Record new daily stock information
4. Display information about a stock using past and present data
For each portfolio
5. Display total amount of cash and holdings of each of the stock
6. Get estimated present value of portfolios, individual stock holdings, and the account
7. Get statistics, including volatility and correleation of the stocks. These should be cached
8. Historical prices of individual stock holdings. Including graph plot and table
9. Future price predictions. Including graph

### Portfolio Statistics
7.1. Coefficient of variation and Beta of each stock
7.2. Covariance/correlation matrix of the stocks in the portfolio
7.3. Caching

### Historical prices of stocks
8.1. Select any stock and generate a graph of a stock's past value (close price) for some interval
8.2. Allow the user to set an interval (week, month, quarter, year, 5 years)
8.3. Integrate historical and current data

### Future stock price
9.1. User should be able to select a stock and see predictions for the future value (close price) of the stock for some interval

# Friends
## Fields

## Requirments
### 10. Friend requests
10.1. Friendships are mutual
10.2. No duplicate requests (rejected requests can be sent 5 minutes later)
10.3. Friendships can be deleted (treated the same same as a rejected friend request)
10.4. Friend's lists are private
### 11. Public stock lists
11.1. Stock lists consist of stocks, shares and a creator
11.2. Stock lists can be made public or shared among friends
11.3. Users should be able to view the stock lists available to them, tagged by category
11.4. Users can delete stock lists made by themselves
11.5. Users can view the statistics of any portfolio available to them
11.6. Category denotes visibility, i.e., whether a stock list is:
        "private" to the owner themselves, or
        "shared" with a friend, or
        "public" to all users
### 12. Reviewing stock lists
12.1. Users can write reviews for stock lists
12.2. These reviews do not exceed 4000 characters
12.3. Users can write at most 1 review for each stock list
12.4. Reviewers can edit their review
12.5. Reviews for non-public stock lists can only be viewed by their reviewer and creator
12.6. All reviews can be seen for a non-public stock list
12.7. Reviews can be deleted by the reviewer or the creator
12.8. If a stock list is deleted all reviews should be deleted

# Extra
## GUI
### Implementation
- Python gui interacts with app through stdout and parsing Json
- Java cli with flag that exports data in json

## Optimization
- Cache queries to a JSON file, created per user

### Dependencies
- GSON for json parsing

### Stock prediction algorithm

# Calculations
## Beta
https://www.youtube.com/watch?v=nDcZJcxOwVI
Get close price for the start of the month for AAL 

SELECT close, timestamp
FROM Old_Stocks, (SELECT EXTRACT(YEAR FROM timestamp) AS y, EXTRACT(MONTH FROM timestamp) AS m, MIN (EXTRACT (DAY FROM timestamp))
                  FROM Old_Stocks
                  WHERE symbol='AAL'
                  GROUP BY y, m) Days
WHERE Days.y=EXTRACT(YEAR FROM timestamp) AND Days.m=EXTRACT (MONTH FROM timestamp) AND Days.min=EXTRACT (DAY FROM timestamp);

## Correlation

## Covariance

## Coefficient of Variation
 
## Variance
 Y = (X - E(X))^2
 E (Y)

## Standard Deviation
 sqrt(variance)
