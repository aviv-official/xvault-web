import {TelepathicElement} from "https://telepathic-elements.github.io/telepathic-element/telepathic-element.js";

export default class ExchangeViewElement extends TelepathicElement{
    static describe(){return `An element to provide exchange info for XVault.`};
	constructor(fileName,noshadow,delayRender){
        super(fileName,noshadow,delayRender);
        this.address = "unset";
        this.network = localStorage["network_id"];
        this.netInfo = {
            name : "connecting..."
        };
        this.inTokenBal = (0).toFixed(2);
        this.outTokenBal = (0).toFixed(2);
        this.outAmt = (0).toFixed(2);
        this.outSymbol = "";
        this.inSymbol = "";
        this.statusPct = 0;
    }

    static get observedAttributes() {
        return ["address","network"];
    }

    async onReady(){
        this.address = window.app.currentAddress;
        this.trade_btn = this.$.querySelector("#trade-btn");
        this.trade_btn.addEventListener("click",(evt)=>{this.onTrade(evt)});
        this.amount_fld = this.$.querySelector("#amount-fld");
        this.in_token_selector = this.$.querySelector("#in-token-selector");
        this.out_token_selector = this.$.querySelector("#out-token-selector");
        this.setSelectors();
        this.amount_fld.addEventListener("change",(evt)=>{this.onSelect(evt)});
        this.in_token_selector.addEventListener("change",(evt)=>{this.onSelect(evt)});
        this.out_token_selector.addEventListener("change",(evt)=>{this.onSelect(evt)});
        
        this.onSelect();
    }

    async onTrade(evt){
        evt.preventDefault(); 
        if(this.outAmt == 0){
            await this.onSelect(evt);
            window.setTimeout((evt)=>{this.onTrade(evt)},1000);
            return;
        }            
        console.debug("onTrade: ",evt);
        this.statusPct = 10;
        if(window.confirm(`Would you like to exchange this ${this.inSymbol} ${this.amount_fld.value} for ${this.outSymbol} ${this.outAmt}`)){
            console.debug("Customer confirmed!");
            try{
                let wallet = await window.app.pinPrompt();
                this.statusPct++;
                let params = {
                    from: wallet[0].address
                }
                params.gas = await this.inToken.methods.approveAndCall(this.xchange.address, ""+this.inRaw, [0x0]).estimateGas(params);
                console.debug("params: ",params);
                this.statusPct++;
                window.alert("Transfering funds to initiate exchange request");
                let result = await this.inToken.methods.approveAndCall(this.xchange.address, ""+this.inRaw, [0x0]).send(params);
                if(result){
                    console.debug("result: ",result);
                    this.statusPct = 25;
                    delete params.gas;
                    params.gas = await this.xchange.methods.swapTokens(""+this.inRaw, this.inToken.address, this.outToken.address).estimateGas(params);
                    this.statusPct++;
                    window.alert("Initiating exchange request");
                    result = await this.xchange.methods.swapTokens(""+this.inRaw, this.inToken.address, this.outToken.address).send(params);
                    window.alert("Exchange request completed");
                    if(result){
                        console.debug("result: ",result);
                        this.statusPct = 50;
                        delete params.gas;
                        let amount = await this.xchange.methods.balanceOf(wallet[0].address, this.outToken.address).call(params);
                        console.debug(`${this.outSymbol} ${amount}`);
                        this.statusPct++;
                        params.gas = await this.xchange.methods.withdraw(""+amount, this.outToken.address).estimateGas(params);
                        window.alert("Withdrawing funds from exchange, depositing to Primary account");
                        result = await this.xchange.methods.withdraw(""+amount, this.outToken.address).send(params);
                        if(result){
                            console.debug("result: ",result);
                            this.statusPct = 75;
                            delete params.gas;
                            let allowance = await this.outToken.methods.allowance(this.xchange.address, wallet[0].address).call(params);
                            console.debug("allowance: ",allowance);
                            this.statusPct = 80;
                            params.gas = await this.outToken.methods.transferFrom(this.xchange.address, wallet[0].address, ""+allowance).estimateGas(params);
                            result = await this.outToken.methods.transferFrom(this.xchange.address, wallet[0].address, ""+allowance).send(params);
                            if(result){
                                console.debug("result: ",result);
                                this.statusPct = 100;
                                await this.onSelect(evt);
                                window.setTimeout((evt)=>{
                                    window.alert("Exchange complete!  Your balances will update shortly");
                                    this.statusPct = 0;
                                },5000);
                            }
                        }
                    }
                }
            }catch(err){
                console.error(err);
                window.alert(err);
            }

        }else{
            this.statusPct = 0;
        }
    }
    async onSelect(evt){
        console.debug("onSelect: ",evt);
        if(!window.app.xchange){
            window.setTimeout(()=>{
                this.onSelect();
            },1000);
            return;
        }else{
            console.debug("xchange: ",window.app.xchange);
            this.xchange = window.app.xchange;
        }
        this.inSymbol = this.in_token_selector.value;
        this.outSymbol = this.out_token_selector.value;
        console.debug(`inSymbol ${this.inSymbol} outSymbol ${this.outSymbol}`);
        console.debug("Tokens: ",window.app.XTokens); 
        this.inToken = window.app.XTokens[this.inSymbol];
        this.outToken = window.app.XTokens[this.outSymbol];
       
        console.debug(`inToken ${this.inToken.address} outToken ${this.outToken.address} xchange ${this.xchange.address}`);
        //Using promises instead of async / await to allow for parallel ops
        if(this.amount_fld.value){
            this.inToken.displayToRaw(this.amount_fld.value).then(async (val)=>{
                try{
                    console.debug(`val: ${val}`);
                    this.inRaw = val;
                    let net = await this.xchange.methods.tokensToNet(""+val,this.inToken.address).call();
                    console.debug(`net: ${net}`);
                    let tokens = await this.xchange.methods.netToTokens(""+net,this.outToken.address).call();
                    console.debug(`tokens: ${tokens}`);
                    this.outAmt = await this.outToken.rawToDisplay(""+tokens);
                }catch(err){console.error(err)};
            });
        }
        this.inToken.balanceDisplay(this.address).then((val)=>{
            this.inTokenBal = val;
        });
        this.outToken.balanceDisplay(this.address).then((val)=>{
            this.outTokenBal = val;
        });
    }

    setSelectors(){
        console.debug("this 1: ",this);
        let last_in_token = localStorage["lastInToken"];
        let last_out_token = localStorage["lastOutToken"];
        let xtokens = window.app.XTokens;
        if(!xtokens){
            window.setTimeout(()=>{
                this.setSelectors();
            },1000);
            return;
        }
        let keys = Object.getOwnPropertyNames(xtokens);
        console.debug("this 2: ",this);
        this.in_token_selector.innerHTML = "";
        this.out_token_selector.innerHTML = "";
        for(let key of keys){
            let opt = document.createElement("option");
            opt.value = key;
            opt.innerText = key;
            let opt2 = opt.cloneNode(true);
            if(key == last_in_token){
                opt.setAttribute("selected","true");
            }
            this.in_token_selector.appendChild(opt);
            if(key == last_out_token){
                opt2.setAttribute("selected","true");
            }
            this.out_token_selector.appendChild(opt2);
        }
    }
}