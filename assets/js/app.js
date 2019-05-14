import {crypto} from "./encryption.js";
import {BASE16,BASE64,convert} from "./basecvt.js";

export default class AppController{
    constructor(){
        setTimeout(async()=>{

            let data = await (await fetch("/xvault-web/assets/js/web3-1.0.0-beta.37.min.js")).text();
            await eval(data);
            this.web3 = new Web3();
            let promises = [];
            promises.push(this.fetchJSON("xtokenAddrs", "/xvault-web/assets/json/xtoken/xtoken.deployment.json"));
            promises.push(this.fetchJSON("xtokenABI","/xvault-web/assets/json/xtoken/xtoken.abi.json"));
            promises.push(this.fetchJSON("chains","/xvault-web/assets/json/chains.json"));
            promises.push(this.fetchJSON("wordList","/xvault-web/assets/json/wordlists/english.json"));
            await Promise.all(promises);
            console.debug("App done loading .json files!");
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
        if(window.ethereum){
            console.debug("Metamask or other wallet detected");
            return await this.connectExternal();
        }else{
            return await this.connectInternal();
        }
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
            let primaryViews = [...document.getElementsByTagName("primary-view-element")];
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
        this.pollTimer = setInterval(async ()=>{this.onPoll();},30000);
        this.onPoll();
        return true;
    }

    async decryptWallet(pin){
        return this.web3.eth.accounts.wallet.load(await this.pbkdf(pin));
    }

    async pinPrompt(){
        //Prompt for PIN to ensure decryption
        let pin = prompt("Please Enter Your PIN To Continue");
        return await this.decryptWallet(pin);
    }

    async connectInternal(){
        let provider;
        for(let obj of this.chains){
            if(obj.network == "rinkeby"){
                provider = obj.rpc[0];
                break;
            }
        }
        this.web3.setProvider(provider);
        //Detect if there is a stored wallet
        if(localStorage["web3js_wallet"]){
            //Prompt for PIN to ensure decryption
            this.wallet = JSON.parse(localStorage["web3js_wallet"]);
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
        let contracts = this.xtokenAddrs[network];
        for(let contract of contracts){
            let keys = Object.getOwnPropertyNames(contract);
            try{
                let ctr = await new this.Web3.eth.Contract(this.xtokenABI,contract[keys[0]]);
                ctr.rawToDisplay = async function(val){
                    let dec = await this.methods.decimals().call();
                    console.debug(`val: ${val} : decimals ${dec}`);
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
                    console.debug("this: ",this);
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

    async sendCB(symbol, dest, amount){
        console.debug(`Sending ${amount} ${symbol} to ${dest}`);
        let ctr = await this.XTokens[symbol];
        let fin = (await ctr.displayToRaw(amount)).toString();
        let result = await ctr.methods.transfer(dest,fin).send({
            from : this.currentAddress
        });
        console.debug("result: ",result);
        window.alert(`Sent ${amount} ${symbol} to ${dest}!`);

        return result;
    }

    async decryptMnemonic(pin){
        let mnText = crypto.decrypt(localStorage["mnemonic"],await crypto.pbkdf(pin));
        console.debug(`mnemonic: ${mnText}`);
        return JSON.parse(mnText);
    }

    async encryptMnemonic(mnemonic,pin){
        localStorage.clear();
        localStorage["mnemonic"] = crypto.encrypt(JSON.stringify(mnemonic),await crypto.pbkdf(pin));
        console.debug("encrypted mnemonic: ",localStorage["mnemonic"]);
        window.alert("Please write down the following words before continuing, you will need them later: "+mnemonic);
        let seed = await (await bip39.mnemonicToSeed(mnemonic)).toString('hex');
        if(this.wallet){
           await this.wallet.clear();
        }
        let wallet = this.web3.eth.accounts.wallet.create(0);
        let pke = await this.pbkdf(seed);
        console.debug("pke: ",pke);
        await wallet.add(pke);
        console.debug("wallet: ",this.wallet);
        wallet.save(await this.pbkdf(pin));
        this.wallet = JSON.parse(localStorage["web3js_wallet"]);;

    }

    async pbkdf(p){
        return this.web3.utils.keccak256(this.web3.utils.bytesToHex(await crypto.pbkdf(""+p)));
    }

}

window.app = new AppController();