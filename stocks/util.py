import yfinance as yf

def get_stock_price(symbol):
    stock = yf.Ticker(symbol)
    data = stock.history(period="1d")
    
    if not data.empty:
        return float(data["Close"].iloc[-1])
    return None