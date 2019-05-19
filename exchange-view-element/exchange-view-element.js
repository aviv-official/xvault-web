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
        this.tokenBal = (0).toFixed(18);
        this.current_symbol = "";
        this.token_selector = this.$.querySelector("#token-selector");
    }

    static get observedAttributes() {
        return ["address","network"];
    }
}