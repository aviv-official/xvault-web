

export default class AppController{
    constructor(){
        setTimeout(async()=>{
            let data = await (await fetch("/assets/js/web3-1.0.0-beta.37.min.js")).text();
            await eval(data);
            this.xtokenAddrs = await JSON.parse(await (await fetch("/assets/json/xtoken/xtoken.deployment.json")).text());
            console.debug("this.xtokens: ",this.xtokens);
            this.xtokenABI = await JSON.parse(await (await fetch("/assets/json/xtoken/xtoken.abi.json")).text());
            this.chains = await JSON.parse(await (await fetch("/assets/json/chains.json")).text());
            console.debug("this.chains: ",this.chains);
        },100);
    }
    async connect(){
        if(ethereum){
            console.debug("Metamask or other wallet detected")
            if(await ethereum.enable()){
                this.web3 = new Web3(ethereum);
                console.debug("Connected to MetaMask! ",this.web3);
                delete localStorage["selectedAddress"];
                delete localStorage["network_id"];
                setInterval(async ()=>{
                    let primaryViews = [...document.getElementsByTagName("primary-view-element")];
                    let oldAddr = localStorage["selectedAddress"];
                    let oldNet = localStorage["network_id"];
                    let addr = ethereum.selectedAddress;
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
                    
                    
                },1000);
                return true;
            }else{
                return false;
            }
        }else{
            //TODO:  Add our own wallet code here!
            return false;
        }
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
        //TODO:  If there is more than one we should be prompting the user, 
        //it appears with this version of web3 
        //we cannot get the chainId of the current network, 
        //so we just have to guess based on network_id 
        //and this will be wrong for ETC vs ETH
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
}

window.app = new AppController();