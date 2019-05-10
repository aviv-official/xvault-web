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
        this.currentSymbol = "";
        this.tokenchoices = this.$.querySelector("#tokenchoices");
        this.tokenselector = this.$.querySelector("#tokenselection");
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
        app.sendCB(this.currentSymbol,dest,amount);
    }
    async onReady(){
        console.warn(`${this.constructor.name} entering onReady!`);  
        this.reset();
    }
    
    async reset(){
        this.tokenchoices = this.$.querySelector("#tokenchoices");
        this.tokenselector = this.$.querySelector("#tokenselection");
        console.debug("tokenselector: ",this.tokenselector);
        this.tokenselector.addEventListener('change', ()=>{this.onTokenChange()});
    }

    async onTokenChange(){
        try{
            this.tokenchoices = this.$.querySelector("#tokenchoices");
            this.tokenselector = this.$.querySelector("#tokenselection");
            console.debug("tokenselector: ",this.tokenselector.value);
            this.currentToken = window.app.XTokens[this.tokenselector.value];
            this.currentSymbol = this.tokenselector.value;
            this.tokenBal = await this.currentToken.balanceDisplay(window.app.currentAddress);
        }catch(err){
            console.debug(err);
        }
    }

    async update(name,value){ 
        this.tokenchoices = this.$.querySelector("#tokenchoices");
        this[name] = value;
        //This should cancel existing timer and reset timers and listeners
        this.web3 = window.app.Web3
        console.debug("this.web3: ",this.web3);
        if(name == "network" && value != "loading"){
            let netInfo = window.app.netInfo;
            Object.assign(this.netInfo,netInfo);
            console.debug("this.netInfo: ",this.netInfo);
        }
        let xtokens = window.app.XTokens;
        let keys = Object.getOwnPropertyNames(xtokens);
        if(this.tokenchoices){
            this.tokenchoices.innerHTML = "";
            for(let key of keys){
                let opt = document.createElement("option");
                opt.name = key;
                opt.value = key;
                this.tokenchoices.appendChild(opt);
            }
        }else{
            console.debug("tokenchoices is missing????");
        }

        
        if(this.timer){
            clearInterval(this.timer);
        }
        this.timer = setInterval(()=>{this.checkStats()},30000);
        this.checkStats();
        window.sendView.setParent(this);
    }

    async checkStats(){
        try{
            console.debug("Checking stats!");
            if(window.app.currentAddress){
                let balTable = document.createElement("table");
                
            }
        }catch(err){
            console.debug(err);
        };
    }
}