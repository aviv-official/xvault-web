import {TelepathicElement} from "https://telepathic-elements.github.io/telepathic-element/telepathic-element.js";

export default class SettingsViewElement extends TelepathicElement{
    static describe(){return `An element to provide settings info for XVault.`};
	constructor(fileName,noshadow,delayRender){
        super(fileName,noshadow,delayRender);
        this.mnemonic = "";
    }

    static get observedAttributes() {
        return ["address","network"];
    }

    async onReady(){
        this.pinform = this.$.querySelector("#pinform");
        this.pinput = this.$.querySelector("#pinput");
        this.$.querySelector("#unlock-btn").addEventListener("click",async (event)=>{
            console.debug("unlock-btn clicked!");
            console.debug("pinput: ",this.pinput);
            event.preventDefault();
            await this.unlock(this.pinput.value);
            this.pinput.value = "";
        });
        this.$.querySelector("#lock-btn").addEventListener("click",async (event)=>{ this.onLock(event);});
        this.$.querySelector("#export-btn").addEventListener("click",(evt)=>{this.exportWallet(evt);});
        this.$.querySelector("#reset-btn").addEventListener("click",(evt)=>{this.onResetEvent(evt);});
        this.$.querySelector('#generate-btn').addEventListener("click",(evt)=>{this.onGenerateEvent(evt);});
        if(!localStorage["web3js_wallet"]){
            this.$.querySelector("#pin-area").style.display = "none";
            this.$.querySelector("#unlock-btn").style.display = "none";
            this.$.querySelector("#export-btn").style.display = "none";
        }else{
            this.$.querySelector('#mnemonic-area-div').style.display = "none";
        }
    }

    async onGenerateEvent(evt){
        evt.preventDefault();
        this.mnemonic = await app.randomMnemonic();
    }

    async onResetEvent(evt){
        evt.preventDefault();
        if(window.confirm("Do you really want to erase your account and reset the app to it's default settings?")){
            await localStorage.clear();
            await indexedDB.deleteDatabase("history");
            await indexedDB.deleteDatabase("allowances");
            setTimeout(()=>{
                window.location.hash = "";
                setTimeout(()=>{
                    window.location.reload(true);
                },100);
            },500);
        }
    }
    
    async onLock(evt){
        evt.preventDefault();
        console.debug("lock-btn clicked!");
        if(this.mnemonic.length > 10 && this.mnemonic !== this.newmonic){
            if(window.confirm("Do you want to clear all settings and use the seed phrase to import a new account?")){
                localStorage.clear();
                await indexedDB.deleteDatabase("history");
                await indexedDB.deleteDatabase("allowances");
                let pin1 = window.prompt("Please enter your PIN");
                let pin2 = window.prompt("Please enter PIN for the second time");
                if(pin1 == pin2){
                    window.alert("This process can take some time, the screen will reset when the process is complete");
                    setTimeout(()=>{
                        window.app.encryptMnemonic(this.mnemonic,pin1).then(()=>{
                            setTimeout(()=>{
                                window.location.hash = "";
                                setTimeout(()=>{
                                    window.location.reload(true);
                                },100);
                            },500);
                        })
                    },1000);
                }else{
                    this.onResetEvent(evt);
                }
            }
        }else{
            this.mnemonic = "";
            this.pinput.value = "";
            setTimeout(()=>{
                window.location.hash = "";
                setTimeout(()=>{
                    window.location.reload(true);
                },100);
            },500);
        }
    }
    
    async unlock(pin){
        await window.alert("Unlocking account, please wait...");
        setTimeout(()=>{
            window.app.decryptMnemonic(pin).then((seed)=>{
                this.mnemonic = seed;
                this.newmonic = this.mnemonic;
                this.$.querySelector('#mnemonic-area-div').style.display = "block";
            }).catch(window.alert);
        },1000);
    }

    async exportWallet(evt){
        evt.preventDefault();
        if(window.confirm("Would you like to export your wallet?")){
            let filename = "xvault.wallet.encrypted.json";
            let text = localStorage["web3js_wallet"];
            let element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
            element.setAttribute('download', filename);
            element.setAttribute('target', "new");
            this.appendChild(element);
            element.click();
            this.removeChild(element);
        }
    }
}