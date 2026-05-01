// buysell.js — React SPA for Buy/Sell
// Django values are injected via window.TRADE in buysell.html

const { useState } = React;

const { csrf, buyUrl, sellUrl, prefill } = window.TRADE;

function TradeApp() {
    const [mode, setMode]           = useState("BUY");
    const [symbol, setSymbol]       = useState(prefill);
    const [quantity, setQuantity]   = useState("");

    const isBuy         = mode === "BUY";
    const actionUrl     = isBuy ? buyUrl : sellUrl;
    const accent        = isBuy ? "#2dff1a" : "#ff442f";
    const accentHover   = isBuy ? "#009440" : "#b50e0e";
    const accentGlow    = isBuy ? "#3ffea5" : "#ff6026";

    return (
        <div style={styles.page}>
            <div style={styles.card}>

                {/* Header */}
                <div style={styles.header}>
                    <span style={{fontSize:"22px", color:"#444"}}>
                        <i className={isBuy ? "bi bi-cart-plus" : "bi bi-cart-dash"}></i>
                    </span>
                    <h4 style={styles.headerTitle}>
                        {isBuy ? "Buy Stock" : "Sell Stock"}
                    </h4>
                </div>

                {/* Sliding Toggle */}
                <div style={{marginBottom:"28px"}}>
                    <div style={styles.toggleTrack}>
                        <div style={{
                            ...styles.togglePill,
                            left: isBuy ? "3px" : "calc(50% + 3px)",
                            background: accent,
                            boxShadow: "0 2px 10px " + accentGlow,
                        }}></div>
                        <button type="button" onClick={() => setMode("BUY")} style={{
                            ...styles.toggleBtn,
                            color: isBuy ? "#fff" : "#888",
                            fontWeight: isBuy ? 700 : 500,
                        }}>
                            <i className="bi bi-arrow-up-circle"></i> BUY
                        </button>
                        <button type="button" onClick={() => setMode("SELL")} style={{
                            ...styles.toggleBtn,
                            color: isBuy ? "#fff" : "#888",
                            fontWeight: !isBuy ? 700 : 500,
                        }}>
                            <i className="bi bi-arrow-down-circle"></i> SELL
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form action={actionUrl} method="post">
                    <input type="hidden" name="csrfmiddlewaretoken" value={csrf} />

                    <div style={styles.fieldWrap}>
                        <label style={styles.label}> STOCK SYMBOL</label>
                        <input type="text" name="symbol" className="form-control" value={symbol} autofocus
                        onChange={e => setSymbol(e.target.value.toUpperCase())} style={styles.input}  required/>
                    </div>

                    <div style={{...styles.fieldWrap, marginTop:"16px"}}>
                        <label style={styles.label}> Quantity</label>
                        <input type="number" name="quantity" className="form-control" value={quantity} min="1" 
                        onChange={e => setQuantity(e.target.value)} style={styles.input} required/>
                    </div>

                    <div style={{display:"flex", alignItems:"center", gap:"14px", marginTop:"24px"}}>
                        <button type="submit" style={{
                            ...styles.submitBtn, background: accent, boxShadow: "0 4px 14px " + accentGlow,
                        }}
                        onMouseOver={e => e.currentTarget.style.background = accentHover}
                        onMouseOut={e => e.currentTarget.style.background = accent} >
                            <i className={isBuy ? "bi bi-cart-plus" : "bi bi-cart-dash"}></i>
                            {isBuy ? " Confirm Buy" : " Confirm Sell"}
                        </button>
                        <a href="/" style={styles.cancelBtn}>Cancel</a>
                    </div>
                </form>
            </div>
        </div>
    );
}

const styles = {
    page: {
        display: "flex",
        justifyContent: "center",
        paddingTop: "20px",
        paddingBottom: "40px",
    },
    card: {
        background: "#fff",
        borderRadius: "16px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
        padding: "36px 40px",
        width: "100%",
        maxWidth: "460px",
    },
    header: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "24px",
    },
    headerTitle: {
        margin: 0,
        fontWeight: 700,
        color: "#1a1a1a",
        fontSize: "20px",
    },
    toggleTrack: {
        position: "relative",
        display: "flex",
        background: "#f0f0f0",
        borderRadius: "50px",
        padding: "3px",
        height: "46px",
    },
    togglePill: {
        position: "absolute",
        top: "3px",
        width: "calc(50% - 6px)",
        height: "calc(100% - 6px)",
        borderRadius: "50px",
        transition: "left 0.25s cubic-bezier(.4,0,.2,1), background 0.25s ease",
        zIndex: 0,
    },
    toggleBtn: {
        flex: 1,
        border: "none",
        background: "transparent",
        borderRadius: "50px",
        fontSize: "14px",
        letterSpacing: "0.5px",
        cursor: "pointer",
        position: "relative",
        zIndex: 1,
        transition: "color 0.2s ease",
    },
    fieldWrap: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    label: {
        fontSize: "13px",
        fontWeight: 600,
        color: "#555",
        letterSpacing: "0.3px",
        textTransform: "uppercase",
    },
    input: {
        borderRadius: "10px",
        border: "1.5px solid #e0e0e0",
        padding: "10px 14px",
        fontSize: "15px",
    },
    submitBtn: {
        flex: 1,
        border: "none",
        borderRadius: "10px",
        padding: "12px",
        color: "#fff",
        fontSize: "15px",
        fontWeight: 700,
        cursor: "pointer",
        transition: "background 0.2s ease",
    },
    cancelBtn: {
        color: "#999",
        textDecoration: "none",
        fontSize: "14px",
        fontWeight: 500,
    },
};

ReactDOM.render(React.createElement(TradeApp, null), document.getElementById("trade-root"));