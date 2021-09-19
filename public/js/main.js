var ctx = document.getElementById("myChart").getContext('2d');
let prices = [];
let labels = [];
setInterval(async () => {
    await fetch("https://api.coingecko.com/api/v3/coins/bitcoin").then(res => res.json()).then(data => {
        let currentPrice = data.market_data.current_price.vnd;
        let currentDate = new Date().toTimeString().replace('GMT+0700 (Indochina Time)', '');
        if (prices.length >= 180) {
            prices.shift();
            labels.shift();
            prices = [...prices, currentPrice];
            labels = [...labels, currentDate];
        } else {
            prices.push(currentPrice);
            labels.push(currentDate);
        }
        console.log(prices);
        var myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Btc Price (vnđ)', // Name the series
                    data: prices, // Specify the data values array
                    fill: false,
                    borderColor: '#ff9900', // Add custom color border (Line)
                    backgroundColor: '#ff9900', // Add custom color background (Points and Fill)
                    borderWidth: 1 // Specify bar border width
                }]
            },
            options: {
                responsive: true, // Instruct chart js to respond nicely.
                maintainAspectRatio: false,
                scales: {
                    yAxes: [
                        {
                            ticks: {
                                callback: function (label, index, labels) {
                                    return label.toLocaleString() + ' vnđ';
                                }
                            }
                        }
                    ]
                }
            }
        });
    });
}, 10000);


async function getData() {
    let coinBase = await fetch('https://api.coinbase.com/v2/prices/spot?currency=USD');
    let products = await fetch('/get-btc-price');
    coinBase = await coinBase.json();
    products = await products.json();
    return {coinBase, products};
}
async function getApi() {
    let currencyOld = await fetch('https://blockchain.info/frombtc?value=100000000&currency=USD&time=1630121400000');
    currencyOld = await currencyOld;
    return currencyOld;
}
async function getMessage() {
    let newMessage = await fetch('/get-mesage-history');
    newMessage = await newMessage.json();
    return newMessage;
   
}

const deletedIDs = [];

async function mapData(){
    const newMessage = await getMessage();
    const {coinBase, products} = await getData();
    const tbody = document.querySelector('#bang tbody');
    // console.log(currencyOld);
    console.log(newMessage);
    newMessage.forEach((history) => {
        const p = document.createElement('p');
        p.textContent = `${new Date(history.sentTime).toLocaleString()}: ${history.coinType} giá ${history.currentMoney}& (${history.change} ${history.price} so với ${history.timeago} trước)- được thông báo tới ${history.target}`;
        document.getElementById("message-history").append(p);
    })
    console.log(products);


    let tbodyContent = '';
    products.forEach((product, index) => {

        console.log(coinBase.data.amount);
        var amount = Number(coinBase.data.amount).toLocaleString();

        tbodyContent += `
            <tr data-id="${product._id}">
                <td data-row="${index}" data-name="coinType">${product['coinType']}</td>
                <td>${amount} ${coinBase.data.currency}</td>
                <td>
                    <span data-row="${index}" data-name="increase/decrease">
                        ${product["increase/decrease"] === "increase" ? "Tăng" : "Giảm"}
                    </span>
                    <span data-row="${index}" data-name="number">${product.number}</span>
                </td>
                <td data-row="${index}" data-name="hour">${product['hour']}m</td>
                <td data-row="${index}" data-name="Telename">${product['Telename']}</td>
                <td>
                    <button type="button" class="btn-edit btn btn-primary">Sửa</button>
                    <button type="button" class="btn-delete btn btn-danger">Xóa</button>
                </td>
            </tr>`
    });
    tbody.innerHTML += tbodyContent;
    const [...btnEdits] = document.querySelectorAll('#bang .btn-edit');
    const [...btnDeletes] = document.querySelectorAll('#bang .btn-delete');
    btnEdits.forEach((btnEdit) => {
        btnEdit.onclick = function() {
            const closestTr = this.closest('tr');
            for (let i = 0; i < closestTr.childElementCount - 1; i++) {
                closestTr.children[i].setAttribute('contentEditable', true);
            }
            document.querySelector('.edit-actions').style.display = "block";
        }
    })
    btnDeletes.forEach((btnDelete) => {
        btnDelete.onclick = function() {
            const closestTr = this.closest('tr');
            closestTr.parentElement.removeChild(closestTr);
            deletedIDs.push(closestTr.getAttribute('data-id'));
        }
    })
 
    document.querySelector('#btc .current-btc').innerHTML = Number(coinBase.data.amount).toLocaleString()+coinBase.data.currency;
    document.querySelector('#now .priceNow').innerHTML = Number(coinBase.data.amount).toLocaleString()+coinBase.data.currency;

}

/**
 * @returns {Array}
 */
function getTableData() {
    const trs = document.querySelectorAll('#bang tbody tr');
    const increment = {
        'Giảm': 'decrease',
        'Tăng': 'increase',
    };
    const dataArr = [];
    for (let i = 0; i < trs.length; i++) {
        const data = {};
        data['_id'] = trs[i].getAttribute('data-id');
        const dataEl = [...document.querySelectorAll(`[data-row="${i}"]`)];
        dataEl.forEach((item) => {
            data[item.getAttribute('data-name')] = item.innerText.trim();
        });
        for (const key in data) {
            if (key === "increase/decrease")
                data["increase/decrease"] = increment[data["increase/decrease"]];
            if (key === "hour")
                data["hour"] = data["hour"].replace("m", "");
        }
        dataArr.push(data);
    }
    return dataArr;
}

function updateData(dataToUpdate) {
    const request = new Request('/update-data', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(dataToUpdate)
    });
    console.log(request)
    fetch(request).then((response) => {
        console.log(response);
    })
}

document.querySelector('#btnSave').onclick = function() {
    const tableData = getTableData();
    updateData(tableData)
    // console.log(deletedIDs); 
}



window.onload = mapData