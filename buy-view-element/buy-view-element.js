import {TelepathicElement} from "https://telepathic-elements.github.io/telepathic-element/telepathic-element.js";
export default class BuyViewElement extends TelepathicElement{
    static describe(){return `An element for purchase of tokens.`};
    constructor(fileName,noshadow,delayRender){
        super(fileName,noshadow,delayRender);
        this.qty = "";
    }

    static get observedAttributes() {
        return ["symbol"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if(newValue){
            console.log(`${name} changed from ${oldValue} to ${newValue}`);
            this.update(name,newValue);
        }
    }

    async update(name, val){
        this.buy_now_btn = this.$.querySelector("#buy-now-btn");
        this.buy_now_btn.onClick = (evt)=>{
            console.debug("buy now pressed!",evt);
            this.onBuyNow(evt);
        }
        this.current_token = window.app.XTokens[val];
        console.debug("current_token",this.current_token);
        let decimals = await this.current_token.decimals();
        console.debug("decimals: ",decimals);
        let pattern=`^\d+(?:,\d{3})*\.\d{${decimals}}$`;
        this.buy_qty.setAttribute("pattern",pattern);
    }

    onBuyNow(evt){
        console.debug("evt",evt);
    }

    async onReady(){
        console.warn(`${this.constructor.name} entering onReady!`);
        console.debug(`${this.constructor.name} is ready!`);
        this.buy_qty = this.$.querySelector("#buy-qty");
    }

    async onReset(){
        
    }
}