import {TelepathicElement} from "https://telepathic-elements.github.io/telepathic-element/telepathic-element.js";
export default class BurnViewElement extends TelepathicElement{
    static describe(){return `An element for burning tokens.`};
    constructor(fileName,noshadow,delayRender){
        super(fileName,noshadow,delayRender);
        this.qty = "";
        this.price = (0).toFixed(18);
        this.weiBalance = (0).toFixed(18);
        this.destSymbol = "XAV";
    }

    static get observedAttributes() {
        return ["symbol"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if(newValue){
            console.log(`${name} changed from ${oldValue} to ${newValue}`);
            this.update(name,newValue);
        }
    }

    async update(name, val){
        this.current_token = window.app.XTokens[val];
        console.debug("current_token",this.current_token);
        let decimals = await this.current_token.decimals();
        this.symbol = await this.current_token.methods.symbol().call();
        if(this.symbol == "XAV"){
            this.destSymbol = "wei";
        }else{
            this.destSymbol = "XAV";
        }
    }

    async onBuyNow(evt){
        console.debug("evt",evt);
        console.debug("token: ",this.current_token);
        let tokens = await this.current_token.displayToRaw(this.buy_qty.value);
        console.debug("tokens: ",tokens);
        let wei = await this.current_token.methods.tokensToNet(""+tokens).call();
        console.debug(`About to buy ${tokens} ${this.symbol} cost: ${wei} wei`);
        let eth = math.multiply(wei,10**-18).toFixed(8);
        if(window.confirm(`Would you like to burn ${this.burn_qty.value} ${this.symbol}?`)){
            try{
                let wallet = await window.app.pinPrompt();
                console.debug("ALERT: ",window.alert);
                window.alert(`Burning ${this.buy_qty.value} ${this.symbol}`);
                console.debug("wallet is ",wallet);
                
                let params = {
                    value : wei,
                    from : wallet[0].address
                }

                //TODO:  Burn cannot be used quite this way.  We need to transfer to XChange if the symbol is not XAV
                //If we are trying to burn something not XAV we should direct the customer to the xchange view, or possibly run the exchange ourselves
                //Either way the code is sitting in xchange

                //params.gas = await this.current_token.methods.mint(wallet[0].address).estimateGas(params);
                if(params.gas < 60000){
                    params.gas = 60000;
                }
                console.debug("params: ", params);
                
                let result = await this.current_token.methods.mint(wallet[0].address).send(params);
                console.debug(result);
                window.alert("Transaction "+result.transactionHash+" completed successfully, your balances will update soon.");
            }catch(err){
                console.error(err);
                window.alert("There was an error and your transaction could not be processed "+err);
            }
        }   
    }

    async onReady(){
        console.debug(`${this.constructor.name} is ready!`);
        this.burn_qty = this.$.querySelector("#burn-qty");
        this.burn_now_btn = this.$.querySelector("#burn-now-btn");
        
        /*
        this.buy_now_btn.addEventListener('click',(evt)=>{
            console.debug("buy now pressed!",evt);
            this.onBuyNow(evt);
        });
        */
        this.burn_qty.addEventListener("keypress",async (evt)=>{
            let tokens = await this.current_token.displayToRaw(this.burn_qty.value);
            this.price = await this.current_token.methods.tokensToNet(""+tokens).call();
            console.debug(`About to burn ${tokens} ${this.symbol}`);
           
        });
        setInterval(()=>{
            window.app.web3.eth.getBalance(window.app.wallet[0].address).then((bal)=>{
                if(bal != this.weiBalance){
                    this.weiBalance = bal;
                }
            });
        },6000);
    }

    async onReset(){
        
    }
}