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
        this.$.querySelector("#lock-btn").addEventListener("click",async (event)=>{
            console.debug("lock-btn clicked!");
            if(this.mnemonic !== this.newmonic){
                if(window.confirm("Do you want to clear all settings and use the new account?")){
                    let pin1 = window.prompt("Please enter your PIN");
                    let pin2 = window.prompt("Please enter PIN for the second time");
                    if(pin1 == pin2){
                        await window.app.encryptMnemonic(this.mnemonic,pin1);
                        window.location ="./app.html";
                    }
                }
            }else{
                this.mnemonic = "";
                event.preventDefault();
                window.location = "./app.html";
            }
        });
    }

    async unlock(pin){
        this.mnemonic = await window.app.decryptMnemonic(pin);
        this.newmonic = this.mnemonic;
    }
}