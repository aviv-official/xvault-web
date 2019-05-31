import {TelepathicElement} from "https://telepathic-elements.github.io/telepathic-element/telepathic-element.js";
export default class HistoryViewElement extends TelepathicElement{
    static describe(){return `An element for viewing account history.`};
    constructor(fileName,noshadow,delayRender){
        super(fileName,noshadow,delayRender);
        this.history = document.createElement("ol");
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

    async update(name, value){
        
        let data = await window.app.getHistory(value);
        if(data.length > 1){
            data.sort((a,b)=>{
                return b.blockNumber - a.blockNumber;
            });
        }
        console.debug("sorted history: ",data);
        let nodes =[];
        data.forEach(item => {
            let el = document.createElement("li");
            let type = item.from.toLowerCase().includes(localStorage["selectedAddress"]) ? "-" : "+";
            let addr = item.from == localStorage["selectedAddress"] ? item.to : item.from;
            if(addr == "0x0000000000000000000000000000000000000000"){
                addr = item.contract;
            }
            el.innerHTML = `<a href="https://rinkeby.etherscan.io/tx/${item.transactionHash}" target="new">${type}${item.tokens}&nbsp;${item.symbol}</a>`;
            
            nodes.push(el);
        });
        while(this.history.firstChild) {
            this.history.removeChild(this.history.firstChild);
        }
        while(nodes.length){
            this.history.appendChild(nodes.shift());
        }

        console.debug("history: ",history);
    }
    async onReady(){
        console.debug("history-view-element ready!");
    }
}