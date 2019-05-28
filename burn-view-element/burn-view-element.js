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
        if(window.app.wallet){
            window.app.web3.eth.getBalance(window.app.wallet[0].address).then((bal)=>{
                if(bal != this.weiBalance){
                    this.weiBalance = bal;
                }
            });
        }
    }

    async burnNow(evt){
        if(this.destSymbol == "XAV"){
            this.swapToXAV(evt);
        }else{
            this.burnXAV(evt);
        }
    }

    async swapToXAV(evt){
        this.xchangeView = document.querySelector("exchange-view-element");
        this.xchangeView.in_token_selector.value = this.symbol;
        this.xchangeView.out_token_selector.value = this.destSymbol;
        this.xchangeView.amount_fld.value = this.burn_qty.value;
        window.location.hash = "#exchange-view";
        this.xchangeView.onTrade(evt);
    }

    async burnXAV(evt){
        if(window.confirm(`Would you like to burn ${this.burn_qty.value} XAV to wei?`)){
            try{
                let wallet = await window.app.pinPrompt();
                let xav = window.app.XTokens["XAV"];
                let qty = await this.current_token.displayToRaw(this.burn_qty.value);
                let params = {
                    from: wallet[0].address
                }
                params.gas = await xav.methods.burn(""+qty).estimateGas(params);
                window.alert(`Sending burn request...`);
                let result = await xav.methods.burn(""+qty).send(params);
                if(result){
                    console.debug("result: ",result);
                    window.alert("Burn complete!  Your balances will update shortly");
                }
            }catch(err){
                console.debug(err);
                window.alert(err);
            }
        }
    }
    async onReady(){
        console.debug(`${this.constructor.name} is ready!`);
        this.burn_qty = this.$.querySelector("#burn-qty");
        this.burn_now_btn = this.$.querySelector("#burn-now-btn");
        this.burn_now_btn.addEventListener("click",async (evt)=>{this.burnNow(evt);})
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
        if(window.app.wallet){
            setInterval(()=>{
                window.app.web3.eth.getBalance(window.app.wallet[0].address).then((bal)=>{
                    if(bal != this.weiBalance){
                        this.weiBalance = bal;
                    }
                });
            },6000);
        }
    }

    async onReset(){
        
    }
}