import {crypto} from "./encryption.js";
import {BASE16,BASE64,convert} from "./basecvt.js";

export default class AppController{
    constructor(){
        
        /*
        if(localStorage["history"]){
            this.history = JSON.parse(localStorage["history"]);
        }else{
            this.history = [];
        }

        if(localStorage["allowances"]){
            this.allowances = JSON.parse(localStorage["allowances"]);
        }else{
            this.allowances = [];
        }
        */
        window.alert = window.toastr.info;
        window.alert("Loading resources please wait...");
        this.history = new Worker("/xvault-web/assets/js/history-worker.js");
        this.history.onmessage = (msg)=>{ 
            console.debug("msg from history worker: ",msg);
            this.history[msg.data.value] = msg.data.result;
         }
        this.allowances = new Worker("/xvault-web/assets/js/allowance-worker.js");
        
        console.debug("history: ",this.history);
        console.debug("allowances: ",this.allowances);

        setTimeout(async()=>{
            let data = await (await fetch("/xvault-web/assets/js/web3-1.0.0-beta.37.min.js")).text();
            await eval(data);
            this.web3 = new Web3();
            this.wss3 = new Web3();
            let promises = [];
            promises.push(this.fetchJSON("xtokenAddrs", "/xvault-web/assets/json/xtoken/xtoken.deployment.json"));
            promises.push(this.fetchJSON("xtokenABI","/xvault-web/assets/json/xtoken/xtoken.abi.json"));
            promises.push(this.fetchJSON("chains","/xvault-web/assets/json/chains.json"));
            promises.push(this.fetchJSON("wordList","/xvault-web/assets/json/wordlists/english.json"));
            promises.push(this.fetchJSON("xchangeABI","/xvault-web/assets/json/xchange/xchange.abi.json"));
            promises.push(this.fetchJSON("xchangeAddrs","/xvault-web/assets/json/xchange/xchange.deployment.json"));
            await Promise.all(promises);
            window.alert("Resources loaded");
        },100);
    }

    fetchJSON(v,url){
        return fetch(url)
                .then(async (response)=>{
                    this[v] = await response.json();
                    console.debug("this."+v+" : ",this[v]);
                }).catch(console.error);
    }

    async connect(){
        /*
        if(window.ethereum){
            console.debug("Metamask or other wallet detected");
            return await this.connectExternal();
        }else{
            return await this.connectInternal();
        }
        */
       return await this.connectInternal();
    }

    async connectExternal(){
        if(await ethereum.enable()){
            console.debug("ethereum: ",ethereum);
            this.web3 = new Web3(ethereum);
            return this.postConnect();
        }else{
            return false;
        }
    }

    async onPoll(){
        try{
            let primaryViews = [...document.getElementsByTagName("wallet-view-element")];
            let oldAddr = localStorage["selectedAddress"];
            let oldNet = localStorage["network_id"];
            //console.debug("this: ",this);
            let addr = this.wallet[0].address;
            if(addr[0] != "0"){
                addr = "0x"+addr;
            }
            let network_id;
            
            if(this.web3.eth.getChainId !== undefined){
                console.debug("getChainId method exists!");
                network_id = await this.web3.eth.getChainId();
            }else{
                //console.debug("getChainId method does not exist!");
                network_id = await this.web3.eth.net.getNetworkType();
            }

            if(oldNet != network_id){
                console.debug("network changed");
                localStorage["network_id"] = network_id;
                await this.loadContracts();
                await primaryViews.forEach(element => {
                    element.setAttribute("network",network_id);
                });
            }
            if(oldAddr != addr){
                console.debug("addr changed");
                localStorage["selectedAddress"] = addr;
                await this.setDefaults(addr);
                await primaryViews.forEach(element => {
                    element.setAttribute("address",addr);
                });
            }
        }catch(err){
            console.error(err);
            console.error("Cancelling polltimer");
            clearInterval(this.pollTimer);
        }
    }

    postConnect(){
        console.debug("Connected! ",this.web3);
        delete localStorage["selectedAddress"];
        delete localStorage["network_id"];
        this.pollTimer = setInterval(async ()=>{this.onPoll();},60000);
        this.onPoll();
        return true;
    }

    async decryptWallet(pin){
        return await this.web3.eth.accounts.wallet.load(await this.pbkdf(pin));
    }

    pinPrompt(){
        return new Promise((resolve,reject)=>{
            let pin = prompt("Please Enter Your PIN To Continue");
            window.alert("Decrypting wallet, this can take some time, please standby...");
            setTimeout(()=>{
                resolve(this.decryptWallet(pin));
            },500);
        });
    }

    async connectInternal(){
        let provider;
        for(let obj of this.chains){
            if(obj.network == "rinkeby"){
                provider = obj.wss[0];
                break;
            }
        }
        this.web3.setProvider(provider);
        //Detect if there is a stored wallet
        if(localStorage["web3js_wallet"]){
            this.wallet = JSON.parse(localStorage["web3js_wallet"]);
            if(!localStorage["selectedAddress"]){
                localStorage["selectedAddress"] = this.wallet[0].address;
            }
            return await this.postConnect(provider);
        }else{
            let pin = prompt("You must set a PIN to continue, it must be between 10 and 16 digits long");
            let pin2 = prompt("Please re-enter pin to confirm");
            if(pin == pin2 && pin.length >=10 && pin.length <= 16 && !isNaN(pin)){
                localStorage.clear();
                try{
                    await this.encryptMnemonic(bip39.generateMnemonic(256),pin);
                    return await this.postConnect();
                }catch(err){
                    console.debug(err);
                }
            }else{
                window.alert("PIN Mismatch!  Please try again!");
                return await this.connectInternal();
            }
        }
        return false;
    }

    get Web3(){
        return this.web3;
    }

    async loadContracts(){
        await this.loadTokens();
    }

    async loadTokens(){
        this.xtokens = {};
        let network = localStorage["network_id"];
        this.xchange = await new this.Web3.eth.Contract(this.xchangeABI,this.xchangeAddrs[network]);
        this.xchange.address = this.xchangeAddrs[network];
        let contracts = this.xtokenAddrs[network];
        let fromBlock = 0;
        if(localStorage["lastBlock"]){
            fromBlock = localStorage["lastBlock"];
        }else{
            localStorage["lastBlock"] = fromBlock;
        }
        for(let contract of contracts){
            let keys = Object.getOwnPropertyNames(contract);
            try{
                let ctr = await new this.Web3.eth.Contract(this.xtokenABI,contract[keys[0]]);
                ctr.address = contract[keys[0]];
                ctr.events.Approval(null,(error,event)=>{this.onApprovalEvent(error,event,ctr);});
                ctr.events.Transfer(null,(error,event)=>{this.onTransferEvent(error,event,ctr);});
                ctr.getPastEvents("Transfer", {fromBlock: fromBlock,toBlock: 'latest'},(error,event)=>{this.onTransferEvent(error,event,ctr);});
                ctr.getPastEvents("Approval", {fromBlock: fromBlock,toBlock: 'latest'},(error,event)=>{this.onApprovalEvent(error,event,ctr);});
                this.fetchHistory(keys[0]);
                ctr.rawToDisplay = async function(val){
                    let dec = await this.methods.decimals().call();
                    if(val != 0){
                        return math.multiply(val,math.pow(10,0-dec)).toFixed(dec);
                    }else{
                        return (0).toFixed(dec).toString();
                    }
                }
                ctr.displayToRaw = async function(val){
                    let dec = await this.methods.decimals().call();
                    return math.multiply(val,math.pow(10,dec));
                }

                ctr.balanceDisplay = async function(account){
                    //console.debug("this: ",this);
                    let bal = await this.methods.balanceOf(account).call();
                    return await this.rawToDisplay(bal);
                }
                ctr.decimals = async function(){
                    return await this.methods.decimals().call();
                }
                this.xtokens[keys[0]] = ctr;
                console.debug("loadTokens: "+keys[0]+" : ",this.xtokens[keys[0]].options.address);
            }catch(err){
                console.debug(err);
                console.debug(`${keys[0]} : ${contract[keys[0]]}`);
            }
        }
        console.debug("xtokens: ",this.xtokens);
        let lastBlock = localStorage["lastBlock"];
        lastBlock = lastBlock == "" ? null : lastBlock;

    }

    async processApprovalEvent(data,contract){
        data.owner = data.returnValues.owner;
        data.spender = data.returnValues.spender;
        if(data.owner !== undefined && data.spender !== undefined){
            if(data.owner.toLowerCase().includes(this.wallet[0].address) || data.spender.toLowerCase().includes(this.wallet[0].address)){
                data.value = data.returnValues.value;
                data.tokens = await contract.rawToDisplay(data.value);
                data.symbol = await contract.methods.symbol().call();
                delete data.returnValues;
                delete data.raw;
                this.allowances.postMessage(data);
            }
        }
        
    }
    async onApprovalEvent(error,data,contract){
        if(error){
            console.error(error);
        }else{
            if(Array.isArray(data)){
                data.forEach((item)=>{ this.processApprovalEvent(item,contract);});
            }else{
                this.processApprovalEvent(data,contract);
            }
        }
    }

    async processTransferEvent(data,contract){
        data.from = data.returnValues.from;
        data.to = data.returnValues.to;
        if(data.from !== undefined && data.to !== undefined){
            if(data.from.toLowerCase().includes(this.wallet[0].address) || data.to.toLowerCase().includes(this.wallet[0].address)){
                data.value = data.returnValues.value;
                data.tokens = await contract.rawToDisplay(data.value);
                data.symbol = await contract.methods.symbol().call();
                delete data.returnValues;
                delete data.raw;
                this.history.postMessage(data);
            }
        }
        if(data.blockNumber > localStorage["lastBlock"]){
            localStorage["lastBlock"] = data.blockNumber;
        }
    }

    async onTransferEvent(error,data,contract){
        
        if(error){
            console.error(error);
        }else{
            if(Array.isArray(data)){
                data.forEach((item)=>{ this.processTransferEvent(item,contract);});
            }else{
                this.processTransferEvent(data,contract);
            }
        }
    }

    async setDefaults(addr){
        let tokens = Object.getOwnPropertyNames(this.xtokens);
        console.debug(`Setting addr of ${addr} on ${JSON.stringify(tokens)}`);
        await tokens.forEach((token)=>{
            console.debug(`Setting defaultAccount of ${addr} on ${JSON.stringify(token)}`);
            this.xtokens[token].defaultAccount = addr;
        });
        console.debug("this.xtokens: ",this.xtokens);
    }
    
    get netInfo(){
        let network = localStorage["network_id"];
        console.log("network id: ",network);
        console.debug("chains: ",this.chains);
        let netInfo = this.chains.filter((net)=>{
            return net.network == network;
        });
        console.debug("netInfo: ",netInfo);
        return netInfo[0];
    }

    get currentAddress(){
        return localStorage["selectedAddress"];
    }

    get XTokens(){
        return this.xtokens;
    }

    async approveAndCall(params,token, dest, amount, memo){
        console.debug("memo: ",memo);
        params.gas = await token.methods.approveAndCall(dest,amount,memo).estimateGas(params);
        return await token.methods.approveAndCall(dest,amount,memo).send(params);
    }

    async transfer(params,token, dest, amount){
        params.gas = await token.methods.transfer(dest,amount).estimateGas(params);
        console.debug("params: ",params);
        result = await ctr.methods.transfer(dest,fin).send(params);
        console.debug("result: ",result);
        return result;
    }

    async sendCB(symbol, dest, amount, memo){
        console.debug("memo in sendCB: ",memo);
        let result;
        if(window.confirm(`Would you like to send ${amount} ${symbol} to ${dest}?`)){
            try{
                let wallet = await this.pinPrompt();
                let token = await this.XTokens[symbol];
                let net = (await token.displayToRaw(amount)).toString();
                let params = {
                    from: wallet[0].address
                }
                window.alert("Initiating Transfer");
                if(memo !==""){
                    memo = new TextEncoder("utf-8").encode(memo);
                    result = await this.approveAndCall(params,token,dest,net,memo);
                }else{
                    result = await this.transfer(params,token,dest,net);
                }
                console.debug("result: ",result);
                window.alert(`Successfully sent ${amount} ${symbol} to ${dest}! Transaction Hash is ${result.transactionHash}`);
            }catch(err){
                console.error(err);
                window.alert(err);
            }
        }
        return result;
    }

    async decryptMnemonic(pin){
        window.alert("Decrypting mnemonic");
        let mnText = crypto.decrypt(localStorage["mnemonic"],await crypto.pbkdf(pin));
        console.debug(`mnemonic: ${mnText}`);
        return JSON.parse(mnText);
    }

    async encryptMnemonic(mnemonic,pin){
        localStorage.clear();
        window.alert("Encrypting mnemonic...");
        localStorage["mnemonic"] = crypto.encrypt(JSON.stringify(mnemonic),await crypto.pbkdf(pin));
        console.debug("encrypted mnemonic: ",localStorage["mnemonic"]);
        window.alert("Please write down the following words before continuing, you will need them later: "+mnemonic);
        let seed = await (await bip39.mnemonicToSeed(mnemonic)).toString('hex');
        let wallet = this.web3.eth.accounts.wallet.create(0);
        await wallet.clear();
        window.alert("Creating seed...");
        let pke = await this.pbkdf(seed);
        console.debug("pke: ",pke);
        await wallet.add(pke);
        window.alert("Creating wallet...");
        console.debug("wallet: ",this.wallet);
        wallet.save(await this.pbkdf(pin));
        window.alert("Wallet saved succesfully!");
        this.wallet = JSON.parse(localStorage["web3js_wallet"]);;

    }

    async pbkdf(p){
        await window.alert("Calculating encryption key...");
        return this.web3.utils.keccak256(this.web3.utils.bytesToHex(await crypto.pbkdf(""+p)));
    }

    fetchHistory(symbol){
        if(!this.history[symbol]){
            this.history[symbol] = [];
        }
        this.history.postMessage({query : {key : "symbol",value : symbol}});
    }

    getHistory(symbol){
        return this.history[symbol];
    }

}

window.app = new AppController();