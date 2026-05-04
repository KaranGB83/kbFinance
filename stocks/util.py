import yfinance as yf

# Priority Order for Indian Suffixes
_INDIAN_SUFFIXES = [(".NS", "NSE"), (".BO", "BSE")]

def _strip_suffix(symbol: str) -> str:
    """Removes Known Suffix from symbol"""
    upper = symbol.upper()
    for suffix, _ in _INDIAN_SUFFIXES:
        if upper.endswith(suffix):
            return symbol[:-len(suffix)]
    return symbol

def resolve_symbol(symbol: str, exchange: str = None):
    """check whether exchange is indian or not."""

    symbol = symbol.upper().strip()

    if exchange == "BSE":
        return _strip_suffix(symbol) + ".BO", True
    elif exchange == "NSE":
        return _strip_suffix(symbol) + ".NS", True
    elif exchange == "OTHER":
        return symbol, False
    
    # Exchange Auto detection
    bare = _strip_suffix(symbol)
    for suffix, _ in _INDIAN_SUFFIXES:
        ticker = yf.Ticker(bare + suffix)
        if not ticker.history("1d").empty:
            return bare + suffix, True
        
    return symbol, None

def get_stock_price(symbol: str):
    stock = yf.Ticker(symbol)
    data = stock.history(period="1d")
    
    if not data.empty:
        return float(data["Close"].iloc[-1])
    return None

def get_stock_info(name: str, exchange: str = None):
    """Returns name, price, currency for a given ticker symbol."""
    resolved, is_indian = resolve_symbol(name, exchange)
    stock = yf.Ticker(name)
    info = stock.info
    
    if not info or "regularMarketPrice" not in info and "currentPrice" not in info:
        price = get_stock_price(resolved)
    else:
        price = info.get("regularMarketPrice") or info.get("currentPrice")
    
    if resolved.endswith(".NS"):
        exch_name = "NSE"
    elif resolved.endswith(".BO"):
        exch_name = "BSE"
    else:
        exch_name = info.get("exchange", "")

    if price is None:
        price = get_stock_price(name)
    
    stock_name = info.get("longName") or info.get("shortName") or name

    return {
        "symbol": resolved,
        "name": stock_name,
        "price": price,
        "currency": info.get("currency", ""),
        "exchange": exch_name,
        "is_indian":is_indian
    }

