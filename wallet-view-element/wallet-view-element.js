import {TelepathicElement} from "https://telepathic-elements.github.io/telepathic-element/telepathic-element.js";

export default class WalletViewElement extends TelepathicElement{
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

    async sendCB(dest,amount,memo){
        app.sendCB(this.current_symbol,dest,amount,memo);
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
        this.navGroup = this.$.querySelector("#nav-group");
        this.pageGroup = this.$.querySelector("#page-group").querySelectorAll("article");
        console.debug("navGroup: ",this.navGroup);
        let btns = this.navGroup.querySelectorAll("a");
        console.debug("btns: ",btns);
        btns.forEach((btn)=>{
            console.debug("btn: ",btn);
            btn.addEventListener("click",(evt)=>{
                evt.src = btn;
                this.showSection(evt);
            })
        })
    }

    showSection(evt){
        console.debug("nav-btn event: ",evt);
        let src = evt.src;
        let dest = src.getAttribute("data-link");
        this.pageGroup.forEach((article)=>{
            console.debug("article: ",article);
            if(article.id == dest){
                console.debug("showing ",article.id);
                article.style.display = "block";
            }else{
                console.debug("hiding ",article.id);
                article.style.display = "none";
            }
        });
    }
    async copyToClipBoard(){
        let permission = {state : 'denied'};
        try {
            if(navigator.permissions){
                permission = await navigator.permissions.query({name:'clipboard-write'});
            }
            console.debug("permission for clipboard is ",permission);
            if(permission.state == 'granted'){
                await navigator.clipboard.writeText(this.address);
                window.alert(`Address ${this.address} copied to clipboard`);
            }else{
                let x = document.createElement("input");
                x.innerText = this.address;
                this.appendChild(x);
                let range = document.createRange();
                range.selectNode(x);
                window.getSelection().addRange(range);
                let successful = document.execCommand('copy');
                let msg = successful ? 'successfully' : 'unsuccessfully';
                window.alert(`${this.address} was ${msg} copied to the clipboard`);
                this.removeChild(x);
            }
        } catch (err) {
            console.error(err);
            window.alert("Failed to copy: "+err);
        }
    }

    async onTokenChange(){
        try{
            console.debug("token_selector: ",this.token_selector.value);
            localStorage["lastToken"] = this.token_selector.value;
            this.current_symbol = this.token_selector.value;
            this.current_token = window.app.XTokens[this.token_selector.value];
            if(window.app.currentAddress){
                console.debug("current address: ",window.app.currentAddress);
                window.app.fetchHistory(this.current_symbol);
                this.tokenBal = await this.current_token.balanceDisplay(window.app.currentAddress);
                this.$.querySelector("buy-view-element").setAttribute("symbol",this.current_symbol);
                this.$.querySelector("burn-view-element").setAttribute("symbol",this.current_symbol);
                this.$.querySelector("history-view-element").setAttribute("symbol",this.current_symbol);            
            }
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
        if(this.address !== "unset"){
            try{
                console.debug("Checking stats!");
                window.app.web3.eth.getBalance(this.address).then(async (bal)=>{
                    if(bal != this.weiBalance){
                        if(bal > this.weiBalance){
                            if(this.web3.utils.toWei(bal, "milli") > 1){
                                if(window.confirm(`You have a lot of excess gas! Buy some XTokens?`)){
                                    window.location.hash = "#wallet-view";
                                    this.token_selector= this.$.querySelector("#token-selector");
                                    this.token_selector.value = "ETH";
                                    this.onTokenChange();
                                    let btn = this.$.querySelector("#reload-btn");
                                    btn.click();                        

                                }
                            }
                        }else{
                            window.alert(`Your gas balance is now ${bal}`);
                        }
                        this.weiBalance = bal;
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
}