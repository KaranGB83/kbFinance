document.addEventListener("DOMContentLoaded", function () {
    // JS for stock quote widget on homepage and portfolio page
    const quoteInput  = document.getElementById("quoteInput");
    const quoteBtn    = document.getElementById("quoteBtn");
    if (!quoteInput || !quoteBtn) return;   // not on a page that has the widget

    // Elements to show/hide based on state
    const quoteResult  = document.getElementById("quoteResult");
    const quoteLoading = document.getElementById("quoteLoading");
    const quoteError   = document.getElementById("quoteError");
    const quoteData    = document.getElementById("quoteData");
    const quoteNotIndian = document.getElementById("quoteNotIndian");

    // Function to fetch stock quote data from the server and update the UI
    async function fetchQuote() {
        const symbol = quoteInput.value.trim().toUpperCase();
        if (!symbol) return;

        quoteResult.style.display  = "none";
        quoteLoading.style.display = "block";

        try {
            // Fetch quote data from the server using the API endpoint. The server will handle fetching from external APIs and return a standardized response.
            const res  = await fetch(`${window.KB_URLS.quote}?symbol=${encodeURIComponent(symbol)}`);
            const data = await res.json();

            quoteLoading.style.display = "none";
            quoteResult.style.display  = "block";
            
            // If the response is not OK, show the error message. Otherwise, display the quote data and show buy/sell buttons if it's an Indian stock.
            if (!res.ok) {
                quoteError.textContent   = data.error || "Something went wrong.";
                quoteError.style.display = "block";
                quoteData.style.display  = "none";
                quoteNotIndian.style.display = "none";
            } else {
                document.getElementById("quoteName").textContent = data.name;
                document.getElementById("quoteSymbolExchange").textContent =
                    `${data.symbol}${data.exchange ? " · " + data.exchange : ""}`;
                document.getElementById("quotePrice").textContent =
                    `${data.currency || ""} ${data.price.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}`;

                quoteError.style.display = "none";
                quoteData.style.display  = "block";
                
                // Show buy/sell buttons only for Indian stocks since we only support trading those
                if (data.is_indian) {
                    document.getElementById("quoteBuyBtn").href  = `${window.KB_URLS.trade}?symbol=${data.symbol}`;
                    document.getElementById("quoteSellBtn").href = `${window.KB_URLS.trade}?symbol=${data.symbol}&mode=SELL`;
                    document.getElementById("quoteBuySellBtns").style.display = "block";
                    quoteNotIndian.style.display = "none";
                } else {
                    document.getElementById("quoteBuySellBtns").style.display = "none";
                    quoteNotIndian.style.display = "block";
                }
            }
        } catch (err) {
            quoteLoading.style.display = "none";
            quoteResult.style.display  = "block";
            quoteError.textContent     = "Network error. Please try again.";
            quoteError.style.display   = "block";
            quoteData.style.display    = "none";
            quoteNotIndian.style.display= "none";
        }
    }
    // Event listeners for quote button click and Enter key press in the input field
    quoteBtn.addEventListener("click", fetchQuote);
    quoteInput.addEventListener("keydown", e => { if (e.key === "Enter") fetchQuote(); });
});