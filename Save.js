


function btnSaveJson(_uid, dataJson) {
    const fabric_datalist = GetlocalStorage('fabric_datalist');
    const datalist = !Array.isArray(fabric_datalist) ? [] : fabric_datalist;

    if (datalist.includes(_uid)) {
        let msg = SetlocalStorage(_uid, dataJson);
    } else {
        datalist.push(_uid);
        SetlocalStorage('fabric_datalist', datalist);
        let msg = SetlocalStorage(_uid, dataJson);
    }
}

function btnLoadJson() {

    ModalDraggable({
        id: 'saveModal',
        title: '儲存畫布 JSON',
        width: 800,
        height: 600,
        content: `<div id="showlist"></div>`,
    });

    const showlist = document.getElementById('showlist');
    // showlist.style.height = '100%';
    showlist.style.overflow = 'auto';
    //showlist.innerHTML = "12346";

    const fabric_datalist = GetlocalStorage('fabric_datalist');
    const datalist = !Array.isArray(fabric_datalist) ? [] : fabric_datalist;
    const _ol = document.createElement("ol");


    datalist.forEach(element => {
        let _li = document.createElement('li');
        _li.innerHTML = element;
        _li.style.cursor = 'pointer';
        _li.onclick = function () {
            isLoading = true;
            console.log(GetlocalStorage(element));
            loadStateString(GetlocalStorage(element));
            let _uid = document.getElementById('FabricUid');
            _uid.value = element;
            history = [];
            setTimeout(() => {
                isLoading = false;

            }, 50);
        }
        _ol.appendChild(_li);
    });

    showlist.append(_ol);
}

function test000001() {
    var buffer = new QRBitBuffer();
    for (var i = 0; i < dataList.length; i++) {
        var data = dataList[i];
        buffer.put(data.mode, 4);
        buffer.put(data.getLength(),
            QRUtil.getLengthInBits(data.mode, typeNumber)
        );
        data.write(buffer);
    }
    var totalDataCount = 0; for (var i = 0; i < rsBlocks.length; i++) { totalDataCount += rsBlocks[i].dataCount; }
    if (buffer.getLengthInBits() > totalDataCount * 8) {
        throw new Error("code length overflow. ("
            + buffer.getLengthInBits()
            + ">"
            + totalDataCount * 8
            + ")");
    }
}