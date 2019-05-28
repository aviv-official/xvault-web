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
        this.statusMsg = "";
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
        this.progress_area = this.$.querySelector("#progress-area");
        this.progress_area.style.display = "none";
        this.main_form = this.$.querySelector("#main-form");
        this.onSelect();
    }

    async onTrade(evt){
        if(evt){
            evt.preventDefault();
        } 
        if(this.outAmt == 0){
            await this.onSelect(evt);
            window.setTimeout((evt)=>{this.onTrade(evt)},1000);
            return;
        }            
        console.debug("onTrade: ",evt);
        this.statusPct = 10;
        if(window.confirm(`Would you like to exchange this ${this.inSymbol} ${this.amount_fld.value} for ${this.outSymbol} ${this.outAmt}`)){
            this.main_form.style.display = "none";
            this.progress_area.style.display = "block";
            this.handleStage1(evt);
        }else{
            this.statusPct = 0;
        }
    }

    async handleStage1(evt){
        try{
            let wallet = await window.app.pinPrompt();
            this.ctr = setInterval(()=>{
                if(this.statusPct++ > 100){
                    this.statusPct = 90;
                }
            },1000);
            
            let params = {
                from: wallet[0].address
            }
            params.gas = await this.inToken.methods.approveAndCall(this.xchange.address, ""+this.inRaw, [0x0]).estimateGas(params);
            console.debug("params: ",params);
            this.statusPct++;
            this.statusMsg = "Transfering funds to initiate exchange request";
            let result = await this.inToken.methods.approveAndCall(this.xchange.address, ""+this.inRaw, [0x0]).send(params);
            if(result){
                console.debug("result: ",result);
                this.handleStage2(evt,params,wallet);
            }
        }catch(err){
            console.error(err);
            window.alert(err);
        }
    }

    async handleStage2(evt, params,wallet){
        try{
            this.statusPct = 25;
            delete params.gas;
            params.gas = await this.xchange.methods.swapTokens(""+this.inRaw, this.inToken.address, this.outToken.address).estimateGas(params);
            this.statusPct++;
            this.statusMsg = "Initiating exchange request";
            let result = await this.xchange.methods.swapTokens(""+this.inRaw, this.inToken.address, this.outToken.address).send(params);
            if(result){
                console.debug("result: ",result);
                this.statusMsg = "Exchange completed";
                this.handleStage3(evt,params,wallet);
            }
        }catch(err){
            console.error(err);
            window.alert(err);
        }
    }

    async handleStage3(evt,params,wallet){
        try{
            this.statusPct = 50;
            delete params.gas;
            let amount = await this.xchange.methods.balanceOf(wallet[0].address, this.outToken.address).call(params);
            console.debug(`${this.outSymbol} ${amount}`);
            this.statusPct++;
            params.gas = await this.xchange.methods.withdraw(""+amount, this.outToken.address).estimateGas(params);
            this.statusMsg = `Withdrawing ${this.outSymbol} from exchange`;
            let result = await this.xchange.methods.withdraw(""+amount, this.outToken.address).send(params);
            if(result){
                console.debug("result: ",result);
                this.handleFinalStage(evt,params,wallet);
            }
        }catch(err){
            console.error(err);
            window.alert(err);
        }
    }

    async handleFinalStage(evt,params,wallet){
        try{
            this.statusPct = 75;
            delete params.gas;
            let allowance = await this.outToken.methods.allowance(this.xchange.address, wallet[0].address).call(params);
            console.debug("allowance: ",allowance);
            this.statusPct = 80;
            params.gas = await this.outToken.methods.transferFrom(this.xchange.address, wallet[0].address, ""+allowance).estimateGas(params);
            this.statusMsg=`Depositing ${this.outSymbol} to wallet`;
            let result = await this.outToken.methods.transferFrom(this.xchange.address, wallet[0].address, ""+allowance).send(params);
            if(result){
                window.clearInterval(this.ctr);
                console.debug("result: ",result);
                this.statusPct = 100;
                this.statusMsg = "All Done!";
                window.setTimeout((evt)=>{
                    window.alert("Exchange complete!  Your balances will update shortly");
                    this.statusPct = 0;
                    this.statusMsg = "";
                    this.progress_area.style.display = "none";
                    this.main_form.style.display = "block";
                    this.onSelect(evt);
                },1000);
            }
        }catch(err){
            console.error(err);
            window.alert(err);
        }
    }
    async onSelect(evt){
        console.debug("onSelect: ",evt);
        if(!window.app.xchange){
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
        //console.debug("this 1: ",this);
        let last_in_token = localStorage["lastInToken"];
        let last_out_token = localStorage["lastOutToken"];
        let xtokens = window.app.XTokens;
        if(!xtokens){
            window.setTimeout(()=>{
                this.setSelectors();
            },10000);
            return;
        }
        let keys = Object.getOwnPropertyNames(xtokens);
        //console.debug("this 2: ",this);
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