import {TelepathicElement} from "https://telepathic-elements.github.io/telepathic-element/telepathic-element.js";

export default class PrimaryViewElement extends TelepathicElement{
    static describe(){return `An element to provide account info XVault.`};
	constructor(fileName,noshadow,delayRender){
        super(fileName,noshadow,delayRender);
        this.address = "unset";
        this.network = localStorage["network_id"];
        this.netInfo = {
            name : "connecting..."
        };
        this.tokenBal = (0).toFixed(18);
        this.weiBalance = (0).toFixed(18);
        this.current_symbol = "";
        this.token_selector = this.$.querySelector("#token-selector");
    }

    static get observedAttributes() {
        return ["address","network"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if(newValue){
            console.log(`${name} changed from ${oldValue} to ${newValue}`);
            this.update(name,newValue);
        }
    }

    async sendCB(dest,amount){
        app.sendCB(this.current_symbol,dest,amount);
    }
    async onReady(){
        console.warn(`${this.constructor.name} entering onReady!`);  
        this.reset();
    }
    
    async reset(){
        this.token_selector = this.$.querySelector("#token-selector");
        console.debug("token_selector: ",this.token_selector);
        this.token_selector.addEventListener('change', ()=>{this.onTokenChange()});
        this.$.querySelector("#address-btn").addEventListener("click",(evt)=>{
            console.debug("address-btn event: ",evt);
            this.copyToClipBoard();
        });
    }

    async copyToClipBoard(){
        try {
            await navigator.clipboard.writeText(this.address);
            window.alert(`Address ${this.address} copied to clipboard`);
        } catch (err) {
            window.alert('Failed to copy: ', err);
        }
    }

    async onTokenChange(){
        try{
            console.debug("token_selector: ",this.token_selector.value);
            localStorage["lastToken"] = this.token_selector.value;
            this.current_token = window.app.XTokens[this.token_selector.value];
            this.current_symbol = this.token_selector.value;
            console.debug("current address: ",window.app.currentAddress);
            this.tokenBal = await this.current_token.balanceDisplay(window.app.currentAddress);
            this.buy_view = this.$.querySelector("buy-view-element");
            console.debug("buy_view: ",this.buy_view);
            this.buy_view.setAttribute("symbol",this.current_symbol);
        }catch(err){
            console.debug(err);
        }
    }

    async update(name,value){ 
        this.token_selector= this.$.querySelector("#token-selector");
        console.debug("token_selector: ",this.token_selector);
        this[name] = value;
        //This should cancel existing timer and reset timers and listeners
        this.web3 = window.app.Web3
        console.debug("this.web3: ",this.web3);
        if(name == "network" && value != "loading"){
            let netInfo = window.app.netInfo;
            Object.assign(this.netInfo,netInfo);
            console.debug("this.netInfo: ",this.netInfo);
        } 
        let last_token = localStorage["lastToken"];
        let xtokens = window.app.XTokens;
        let keys = Object.getOwnPropertyNames(xtokens);
        if(this.token_selector){
            this.token_selector.innerHTML = "";
            for(let key of keys){
                let opt = document.createElement("option");
                opt.innerText = key;
                if(key.startsWith("X")){
                    key = key.replace("X","");
                }
                opt.value = key;
                
                if(key == last_token){
                    opt.setAttribute("selected","true");
                }
                this.token_selector.appendChild(opt);
            }
        }else{
            console.debug("token_selector is missing????");
        }

        
        if(this.timer){
            clearInterval(this.timer);
        }
        this.onTokenChange();
        this.timer = setInterval(()=>{this.checkStats()},30000);
        this.checkStats();
        window.sendView.setParent(this);
    }

    async checkStats(){
        try{
            console.debug("Checking stats!");
            window.app.web3.eth.getBalance(this.address).then((bal)=>{
                if(bal != this.weiBalance){
                    this.weiBalance = bal;
                    window.alert(`Your wei balance is now ${this.weiBalance}`);
                }
            });
            
            this.current_token.balanceDisplay(window.app.currentAddress).then((bal)=>{
                if(bal != this.tokenBal){
                    this.tokenBal = bal;
                    window.alert(`Your ${this.current_symbol} balance is now ${this.tokenBal}`);
                }
            });
        }catch(err){
            console.debug(err);
        };
    }
}