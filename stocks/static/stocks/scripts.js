document.addEventListener("DOMContentLoaded", function () {
    const quoteInput  = document.getElementById("quoteInput");
    const quoteBtn    = document.getElementById("quoteBtn");
    if (!quoteInput || !quoteBtn) return;   // not on a page that has the widget

    const quoteResult  = document.getElementById("quoteResult");
    const quoteLoading = document.getElementById("quoteLoading");
    const quoteError   = document.getElementById("quoteError");
    const quoteData    = document.getElementById("quoteData");

    async function fetchQuote() {
        const symbol = quoteInput.value.trim().toUpperCase();
        if (!symbol) return;

        quoteResult.style.display  = "none";
        quoteLoading.style.display = "block";

        try {
            const res  = await fetch(`${window.KB_URLS.quote}?symbol=${encodeURIComponent(symbol)}`);
            const data = await res.json();

            quoteLoading.style.display = "none";
            quoteResult.style.display  = "block";

            if (!res.ok) {
                quoteError.textContent   = data.error || "Something went wrong.";
                quoteError.style.display = "block";
                quoteData.style.display  = "none";
            } else {
                document.getElementById("quoteName").textContent = data.name;
                document.getElementById("quoteSymbolExchange").textContent =
                    `${data.symbol}${data.exchange ? " · " + data.exchange : ""}`;
                document.getElementById("quotePrice").textContent =
                    `${data.currency || ""} ${data.price.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}`;

                document.getElementById("quoteBuyBtn").href  = `${window.KB_URLS.buy}?symbol=${data.symbol}`;
                document.getElementById("quoteSellBtn").href = `${window.KB_URLS.sell}?symbol=${data.symbol}`;

                quoteData.style.display  = "block";
                quoteError.style.display = "none";
            }
        } catch (err) {
            quoteLoading.style.display = "none";
            quoteResult.style.display  = "block";
            quoteError.textContent     = "Network error. Please try again.";
            quoteError.style.display   = "block";
            quoteData.style.display    = "none";
        }
    }

    quoteBtn.addEventListener("click", fetchQuote);
    quoteInput.addEventListener("keydown", e => { if (e.key === "Enter") fetchQuote(); });
});