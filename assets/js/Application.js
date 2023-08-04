class Application
{
    DOM = {
        coinType    : document.querySelector("#coin-type"),
        coinFrom    : document.querySelector("#coin-from"),
        coinTo      : document.querySelector("#coin-to"),
        coinToLabel : document.querySelector("#coin-to-label"),

        submit   : document.querySelector("#submit"),
        loading  : document.querySelector("#loading"),
        feedback : document.querySelector("#feedback"),
        content  : document.querySelector("#content"),

        chart           : document.querySelector("#chart"),
        chartCoinToFrom : document.querySelector("#chart-coin-to-from"),
        chartCoinFromTo : document.querySelector("#chart-coin-from-to")
    }

    API = {
        url               : "https://mindicador.cl/api/{coinType}",
        error             : null,
        data              : null,
        dataLastCoinValue : null
    }

    chart = {
        obj     : null,
        results : 10,
        order   : "asc"
    }

    constructor()
    {
        this.DOM.coinType.addEventListener("change", () => { 
            this.DOM.coinFrom.value = "";
            this.DOM.coinTo.value   = "";
            this.submit();
        });
        this.DOM.coinFrom.addEventListener("input", () => this.setCoinTo());
        this.DOM.coinTo.addEventListener("input", () => this.setCoinFrom());
        this.DOM.submit.addEventListener("click", () => this.submit());
        
        this.submit();
    }

    setCoinFrom()
    {
        if (!this.DOM.coinTo.value.trim() || this.API.error) {
            this.DOM.coinFrom.value = "";
            return false;
        }

        let value = (Number(this.DOM.coinTo.value) || 0) * this.API.dataLastCoinValue;
        this.DOM.coinFrom.value = parseFloat(value.toFixed(6));
    }

    setCoinTo()
    {
        if (!this.DOM.coinFrom.value.trim() || this.API.error) {
            this.DOM.coinTo.value = "";
            return false;
        }

        let value = (Number(this.DOM.coinFrom.value) || 0) / this.API.dataLastCoinValue;
        this.DOM.coinTo.value = parseFloat(value.toFixed(6));
    }

    loading(isLoading)
    {
        this.DOM.feedback.innerHTML     = "";
        this.DOM.loading.style.display  = isLoading ? "block" : "none";
        this.DOM.content.style.display  = isLoading ? "none"  : "block";
        this.DOM.coinType.disabled      = isLoading;
        this.DOM.coinFrom.disabled      = isLoading;
        this.DOM.coinTo.disabled        = isLoading;
    }

    async submit()
    {
        let selectedCoinType = this.DOM.coinType.options[this.DOM.coinType.selectedIndex];

        this.DOM.coinToLabel.innerHTML = selectedCoinType.textContent;

        this.loading(true);
        this.API.data = await this.fetchData(this.DOM.coinType.value);
        this.loading(false);

        if (!this.API.data) {
            this.renderError("Error de conexión API", this.API.error);
            return false;
        }

        try {
            this.API.dataLastCoinValue = this.API.data.serie[0].valor; //desc
            this.renderChart(selectedCoinType.dataset.key, this.API.data.serie);    
        } catch(e) {
            this.API.error = e.message;
            this.renderError("Error al procesar los datos API", this.API.error);
        }
    }

    async fetchData(coinType)
    {
        try {
            let result = await fetch(this.API.url.replace("{coinType}", coinType));
            let data   = await result.json();

            return data;
        } catch (e) {
            this.API.error = e.message;

            return false;
        }
    }

    renderError(title, description) {
        this.DOM.feedback.innerHTML = `
            <div class="alert alert-danger text-center">
                <i class="fa-solid fa-triangle-exclamation"></i> ${title}
                <br>
                <small>${description}</small>
            </div>
        `;
    }

    renderChart(coinTypeKey, data)
    {
        this.DOM.chartCoinToFrom.innerHTML = `1 ${coinTypeKey} = ${this.API.dataLastCoinValue} ${this.DOM.coinFrom.dataset.key}`;
        this.DOM.chartCoinFromTo.innerHTML = `1 ${this.DOM.coinFrom.dataset.key} = ${parseFloat((1 / this.API.dataLastCoinValue).toFixed(6))} ${coinTypeKey}`;

        data = data.slice(0, this.chart.results);
    
        if (this.chart.order == "asc") {
            data.reverse();
        }

        if (this.chart.obj) {
            this.chart.obj.destroy();
        }
    
        this.chart.obj = new Chart(this.DOM.chart, {
            type : "line",
            data : {
                labels   : data.map(i => i.fecha.slice(0, 10)), //yyyy-mm-dd
                datasets : [
                    {
                        label           : "{coinKey} - Últimos {results} registros"
                                            .replace("{results}", this.chart.results)
                                            .replace("{coinKey}", coinTypeKey),
                        borderColor     : "#dc3545",
                        backgroundColor : "#dc3545",
                        data            : data.map(i => i.valor)
                    }
                ]
            }
        })
    }
}

export default Application;
