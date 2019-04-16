import {TelepathicElement} from "https://telepathic-elements.github.io/telepathic-element/telepathic-element.js";
export default class BuyViewElement extends TelepathicElement{
    static describe(){return `An element to purchase of tokens.`};
    constructor(fileName,noshadow,delayRender){
        super(fileName,noshadow,delayRender);
    }
    async onReady(){
        console.warn(`${this.constructor.name} entering onReady!`);
        console.debug(`${this.constructor.name} is ready!`);
    }

    async onReset(){
        
    }
}