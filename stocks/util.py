import yfinance as yf

def get_stock_price(symbol):
    stock = yf.Ticker(symbol)
    data = stock.history(period="1d")
    
    if not data.empty:
        return float(data["Close"].iloc[-1])
    return None

def get_stock_info(name):
    """Returns name, price, currency for a given ticker symbol."""
    stock = yf.Ticker(name)
    info = stock.info
    
    if not info or "regularMarketPrice" not in info and "currentPrice" not in info:
        price = get_stock_price(name)
    else:
        price = info.get("regularMarketPrice") or info.get("currentPrice")
    
    if price is None:
        price = get_stock_price(name)
    
    stock_name = info.get("longName") or info.get("shortName") or name

    return {
        "symbol": name.upper(),
        "name": stock_name,
        "price": price,
        "currency": info.get("currency", ""),
        "exchange": info.get("exchange", ""),
    }

