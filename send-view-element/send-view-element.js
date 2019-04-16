import {TelepathicElement} from "https://telepathic-elements.github.io/telepathic-element/telepathic-element.js";
import {QrScanner} from "/assets/js/qr-scanner.min.js";
export default class SendViewElement extends TelepathicElement{
    static describe(){return `An element to permit entry of dest and amount.`};
    constructor(fileName,noshadow,delayRender){
        super(fileName,noshadow,delayRender);
        QrScanner.WORKER_PATH = '/assets/js/qr-scanner-worker.min.js';
        this.destAddr = "";
        this.destAmt = "";
        this.isCameraOpen = false;
        window.sendView = this;
    }

    async onReady(){
        console.warn(`${this.constructor.name} entering onReady!`);
        this.scanBtn = this.$.querySelector("#qrScanBtn");
        this.scanBtn.addEventListener("click",(evt)=>{this.toggleCamera(evt);});
        this.sendBtn = this.$.querySelector("#sendBtn");
        this.sendBtn.addEventListener("click",(evt)=>{this.sendFunds(evt);});
        //this.reset();
        console.debug(`${this.constructor.name} is ready!`);

    }

    async reset(){}
    setParent(obj){
        console.debug("parent set to ",obj);
        this.parent = obj;
    }
    async sendFunds(evt){
        let amount = this.destAmt;
        let destAddr = this.destAddr;
        this.parent.sendCB(destAddr,amount);
    }

    async toggleCamera(evt){
        //console.debug("camera btn clicked! ",evt);
        //console.debug("this is: ",this);
        if(this.isCameraOpen){
            await this.closeCamera();
        }else{
            await this.openCamera();
        }
        this.isCameraOpen = !this.isCameraOpen;
    }

    async openCamera(){
        this.scanBtn = this.$.querySelector("#qrScanBtn");
        let v = this.$.querySelector("#videoEl");
        this.qrScanner = new QrScanner(v, (result) =>{ 
            console.log('decoded qr code:', result);
            result = result.split(":");
            if(Array.isArray(result)){
                this.currentSymbol = result[0].toUpperCase();
                let remains = result[1].split("/\?|\&/");
                this.destAddr = remains[0];
                for(let remain of remains){
                    let pair = remain.split("=");
                    let key = pair[0];
                    let value = pair[1];
                    this[key] = value;
                }
            }else{
                this.destAddr = result;
            }
            this.toggleCamera();
        });
        this.qrScanner.setInversionMode("both");
        console.debug("this.qrScanner: ",this.qrScanner);
        this.qrScanner.start();
    }

    async closeCamera(){
        this.qrScanner.destroy();
        this.scanBtn.removeEventListener("clicked",this.closeCamera);
        this.scanBtn.addEventListener("clicked",this.openCamera);
    }
}
