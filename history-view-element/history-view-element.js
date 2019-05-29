import {TelepathicElement} from "https://telepathic-elements.github.io/telepathic-element/telepathic-element.js";
export default class HistoryViewElement extends TelepathicElement{
    static describe(){return `An element for viewing account history.`};
    constructor(fileName,noshadow,delayRender){
        super(fileName,noshadow,delayRender);
        this.history = document.createElement("ul");
    }

    async onReady(){
        let data;
        if(localStorage["history"]){
            data = JSON.parse(localStorage["history"]);
            if(data.length > 2){
                data.sort((a,b)=>{
                    return a.blockNumber - b.blockNumber;
                });
            }
            console.debug("sorted history: ",data);
            data.forEach(item => {
                let el = document.createElement("li");
                let addr = item.from == localStorage["selectedAddress"] ? item.to : item.from;
                if(addr == "0x0000000000000000000000000000000000000000"){
                    addr = item.contract;
                }
                el.innerHTML = `<a href="https://rinkeby.etherscan.io/tx/${item.transactionHash}" target="new">${item.symbol}&nbsp;${item.tokens}</a>`;
                
                this.history.appendChild(el);
            });
            console.debug("history: ",history);
        }
    }
}