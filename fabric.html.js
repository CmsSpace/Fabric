// 初始化：畫布、狀態堆疊與常數
// --------------------------------
let canvas = new fabric.Canvas('c', {
    selection: true,
    preserveObjectStacking: true // 確保 Z-index 操作不會影響選取
});
let history = []; // 歷史狀態堆疊
let redoStack = []; // 取消復原堆疊
let isLoading = false; // 載入狀態標記
const MAX_HISTORY = 50;
const JSON_PROPS = [
    'selectable', 'evented', 'rx', 'ry', 'fill', 'stroke', 'strokeWidth', 'comment',
    'fontSize', 'fontFamily', 'text', 'displayValue', 'strokeUniform', 'propId', 'propText',
    'type', 'proptype', 'barcodeFormat', 'scale', 'porpmargin', 'propQRLevel', 'imageData', 'absPoints'
];

// --------------------------------
// === 狀態管理與歷史記錄 (Undo/Redo) ===
// --------------------------------

// --------------------------------
// === 🧩 儲存狀態前，附加 QR/Bar 的影像資料 ===
// --------------------------------
function prepareCanvasForSave() {
    canvas.getObjects().forEach(obj => {
        if (obj.proptype === 'qrcode' || obj.proptype === 'barcode') {
            try {
                obj.imageData = obj._element?.src ?? (obj.getElement()?.toDataURL() || null);
            } catch {
                obj.imageData = null;
            }
        } else if (obj.proptype === 'line') {

        }
    });
}

// --------------------------------
// === 狀態管理與歷史記錄 (Undo/Redo) ===
// --------------------------------
function saveState() {
    if (isLoading) return;

    prepareCanvasForSave(); // ✅ 附加影像資料
    const currentState = JSON.stringify(canvas.toJSON(JSON_PROPS));

    if (history.length === 0 || history[history.length - 1] !== currentState) {
        history.push(currentState);
        if (history.length > MAX_HISTORY) history.shift();
        redoStack = [];
    }

    updateUndoRedoButtons();
}

/**
 * 載入指定的畫布 JSON 狀態字串。
 * @param {string} stateString - 畫布 JSON 字串
 */
function loadStateString(stateString) {
    if (!stateString) return;
    isLoading = true;

    canvas.loadFromJSON(stateString, async () => {
        const objs = canvas.getObjects();

        // for (const obj of objs) {
        //     let _proptype = obj.proptype ?? obj.type;
        //     if (_proptype === 'qrcode') {
        //         if (obj.imageData) {
        //             const img = new Image();
        //             img.src = obj.imageData;
        //             await new Promise(r => (img.onload = r));
        //             obj.setElement(img);
        //         } else {
        //             await refreshQRCodeImage(obj, obj.text);
        //         }
        //     }
        //     if (_proptype === 'barcode') {
        //         if (obj.imageData) {
        //             const img = new Image();
        //             img.src = obj.imageData;
        //             await new Promise(r => (img.onload = r));
        //             obj.setElement(img);
        //         } else {
        //             await generateBarcode(obj, obj.text);
        //         }
        //     }
        //     if (_proptype === 'textbox') {
        //         obj.initDimensions();
        //     }
        // }

        canvas.renderAll();
        isLoading = false;
        refreshLayers();
        updatePropertyPanel(canvas.getActiveObject());
        updateUndoRedoButtons();
    });
}

/**
 * 啟用/禁用 Undo/Redo 按鈕。
 */
function updateUndoRedoButtons() {
    $('#btnUndo').prop('disabled', history.length <= 1);
    $('#btnRedo').prop('disabled', redoStack.length === 0);
}


// === 復原 / 取消復原 按鈕事件 ===
$('#btnUndo').click(() => {
    if (history.length <= 1) return;

    // 將當前狀態彈出並推入 redoStack
    const currentState = history.pop();
    redoStack.push(currentState);

    // 載入前一個狀態 (history 陣列的最後一個元素)
    const previousState = history[history.length - 1];
    loadStateString(previousState);
});

$('#btnRedo').click(() => {
    if (redoStack.length === 0) return;

    // 將 redoStack 中的狀態彈出 (最近一次被 Undo 的狀態)
    const nextState = redoStack.pop();

    // 將此狀態推回 history (作為新的最新狀態)
    history.push(nextState);

    // 載入狀態
    loadStateString(nextState);
});

document.addEventListener('keydown', function (event) {

    // 檢查 Ctrl (Windows/Linux) 或 Cmd (Mac) 是否被按下
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    if (!isCtrlOrCmd) return;

    // 檢查是否是 Z 鍵 (無論大小寫)
    const isZKey = event.key === 'z' || event.key === 'Z';
    if (isZKey && isCtrlOrCmd) {
        // 阻止瀏覽器預設的「復原/Undo」行為，如果您想自己處理
        event.preventDefault();
        if (history.length <= 1) return;

        // 將當前狀態彈出並推入 redoStack
        const currentState = history.pop();
        redoStack.push(currentState);

        // 載入前一個狀態 (history 陣列的最後一個元素)
        const previousState = history[history.length - 1];
        loadStateString(previousState);
    }

    // 檢查是否是 Z 鍵 (無論大小寫)
    const isYKey = event.key === 'y' || event.key === 'Y';
    if (isCtrlOrCmd && isYKey) {
        // 阻止瀏覽器預設的「復原/Undo」行為，如果您想自己處理
        event.preventDefault();
        if (redoStack.length === 0) return;

        // 將 redoStack 中的狀態彈出 (最近一次被 Undo 的狀態)
        const nextState = redoStack.pop();

        // 將此狀態推回 history (作為新的最新狀態)
        history.push(nextState);

        // 載入狀態
        loadStateString(nextState);
    }

});

// --------------------------------
// === 🧩 JSON 儲存與載入功能 ===
// --------------------------------
$('#btnSaveJson,#btnSave').click(() => {
    prepareCanvasForSave();

    ModalDraggable({
        id: 'saveModal',
        title: '儲存畫布 JSON',
        width: 800,

        content: `<textarea id="saveJsonText" style="width:100%;height:300px;">${JSON.stringify(canvas.toJSON(JSON_PROPS), null, 2)}</textarea>`,
    });
    return;
    const jsonData = canvas.toJSON(JSON_PROPS);
    jsonData.canvasWidth = canvas.getWidth();
    jsonData.canvasHeight = canvas.getHeight();
    jsonData.unit = $("#unit").val(); // 或 'px'、'cm'、自訂單位
    const json = JSON.stringify(jsonData, null, 2);

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'canvas.json';
    a.click();
    URL.revokeObjectURL(url);
});

$('#btnLoadJson').change(function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async evt => {
        const json = evt.target.result;
        await loadStateString(json);
    };
    reader.readAsText(file);
});


// --------------------------------
// === 畫布/圖層/屬性互動 ===
// --------------------------------

/**
 * 刷新圖層列表，並加入刪除按鈕。
 */
function refreshLayers() {
    const list = $('#layerList').empty();
    const activeObj = canvas.getActiveObject();
    // 啟用/禁用 Undo/Redo 按鈕的邏輯... (略)

    // 顯示從上層 (最前面) 開始列出，故使用 reverse
    canvas.getObjects().slice().reverse().forEach((obj) => {
        const _proptype = obj.proptype ?? obj.type;
        if (_proptype == "circle") return;
        const name = `${_proptype}` + (_proptype == 'textbox' || (_proptype == 'qrcode' || _proptype == 'barcode') ? ` (${obj.propId})` : '');

        const item = $('<div>').addClass('layer-item');
        const nameSpan = $('<span>').addClass('layer-item-name').text(name).prop('title', name);
        const deleteBtn = $('<button>').addClass('delete-layer-btn').text('X');

        if (obj === activeObj) {
            item.addClass('active');
        }

        // 點擊項目：選取物件
        nameSpan.click(() => {
            canvas.setActiveObject(obj);
            canvas.requestRenderAll();
            updatePropertyPanel(obj);
            refreshLayers(); // 刷新高亮狀態
        });

        // 點擊刪除按鈕：移除物件
        deleteBtn.click((e) => {
            e.stopPropagation(); // 阻止事件冒泡到 layer-item 的選取邏輯
            item.remove();
            canvas.remove(obj);
            canvas.requestRenderAll();
            // 'object:removed' 事件會自動處理 saveState, refreshLayers, updatePropertyPanel
            //if (confirm(`確定要刪除圖層: ${name} 嗎?`)) { }
        });

        item.append(nameSpan, deleteBtn);
        list.append(item);
    });
}

/**
 * 更新屬性面板內容。 (簡化版，您應擴展此處以顯示更多屬性)
 * @param {fabric.Object | null} obj - 當前選取的物件。
 */

const PorpInput = `
        #propId,
        #propText,
        #BarCodeText,
        #propTop,
        #propLeft,
        #propWidth,
        #propHeight,
        #fontSize,
        #strokeWidth,
        #propRadius,
        #fontSize,
        #propScale,
        #barcodeFormat,
        #propTextAlign,
        #propFontFamily,
        #displayValue,
        #propQRLevel`;

function PropertyBar(obj) {
    $(".propTr").css({ 'display': 'none' });
    const _proptype = obj.proptype ?? obj.type;
    switch (_proptype) {
        case 'line':

            $('.strokeWidthBar').css({ 'display': 'table-row' });
            break;
        case 'rect':
            $('.WidthBar').css({ 'display': 'table-row' });
            $('.WidthLabel').show();
            $('.LengthLabel').hide();
            $('.HeightBar').css({ 'display': 'table-row' });
            $('.strokeWidthBar').css({ 'display': 'table-row' });
            $('.RadiusBar').css({ 'display': 'table-row' });
            break;
        case 'textbox': {
            $('.IdBar').css({ 'display': 'table-row' });
            $('.TextBar').css({ 'display': 'table-row' });
            $('.WidthBar').css({ 'display': 'table-row' });
            //$('.HeightBar').css({ 'display': 'table-row' });//禁止修改防止變形
            $('.fontSizeBar').css({ 'display': 'table-row' });
            $('.TextAlignBar').css({ 'display': 'table-row' });
            $('.FontFamilyBar').css({ 'display': 'table-row' });

            break;
        }
        case 'qrcode': {
            $('.IdBar').css({ 'display': 'table-row' });
            $('.TextBar').css({ 'display': 'table-row' });
            $('.WidthBar').css({ 'display': 'table-row' });
            $('.WidthLabel').show();
            $('.LengthLabel').hide();
            $('.HeightBar').css({ 'display': 'table-row' });
            $('.QRLevelBar').css({ 'display': 'table-row' });

            break;
        }
        case 'barcode':
            $('.IdBar').css({ 'display': 'table-row' });
            $('.BarCodeBar').css({ 'display': 'table-row' });//統一存到 text ,使用input(不給換行)
            $('.HeightBar').css({ 'display': 'table-row' });
            $('.ScaleBar').css({ 'display': 'table-row' });
            $('.fontSizeBar').css({ 'display': 'table-row' });
            $('.BarFormatBar').css({ 'display': 'table-row' });
            $('.BarFormatPreviewBar').css({ 'display': 'unset' });
            break;
        case 'propRadius':

            break;

        case 'fontSize':

            break;
    }
}
function updatePropertyPanel(obj) {

    // 重置所有屬性欄位
    $(PorpInput).val('');
    if (!obj) return;
    const _proptype = obj.proptype ?? obj.type;
    // 1. 基本屬性 (所有物件幾乎都有)
    $('#propTop').val(Math.trunc(obj.top));
    $('#propLeft').val(Math.trunc(obj.left));
    // 2. 尺寸屬性 (需使用 getScaledXXX() 取得縮放後的實際尺寸)
    // 對於 Textbox 來說，若有 scaleX/Y 則需特別注意
    const currentWidth = _proptype === 'textbox' ? obj.width : obj.getScaledWidth();
    const currentHeight = _proptype === 'textbox' ? obj.height : obj.getScaledHeight();
    $('#propWidth').val(Math.trunc(currentWidth));
    $('#propHeight').val(Math.trunc(currentHeight));
    $('#propRadius').val(obj.rx ? obj.rx : 0);
    $('#strokeWidth').val(obj.strokeWidth ?? 0);

    switch (_proptype) {
        case 'line':
            break;
        case 'rect':
            break;
        case 'textbox':
            $("#propId").val(obj.propId);
            $('#propText').val(obj.text);
            $('#fontSize').val(obj.fontSize || 20);
            $('#propTextAlign').val(obj.textAlign);
            $('#propFontFamily').val(obj.fontFamily);
            break;
        case 'qrcode':
            $("#propId").val(obj.propId);
            $('#propText').val(obj.text);
            $('#propQRLevel').val(obj.propQRLevel);
            break;
        case 'barcode':
            $("#propId").val(obj.propId);
            $('#BarCodeText').val(obj.text);//統一存到 text
            $('#fontSize').val(obj.fontSize || 20);
            $('#propScale').val(Math.trunc(obj.scale));
            $('#barcodeFormat').val(obj.barcodeFormat ?? '');
            $('#propScale').val(obj.scale);
            break;
    }
}

//BarCode & qrcode 改開窗??
$("#BarCodeText").on('change', function () {
    const active = canvas.getActiveObject();
    if (!active) return;

    const _proptype = active.proptype ?? active.type;
    if (_proptype === 'barcode') {
        active.set('text', $(this).val());
        generateBarcode(active, $(this).val());
    }
});

$(PorpInput).on('change', function () {
    const active = canvas.getActiveObject();
    const val = parseFloat($(this).val());

    if (!active) return;

    const propId = $(this).prop('id');
    const _proptype = active.proptype ?? active.type;
    switch (propId) {
        case 'propId':
            active.set('propId', $(this).val());
            break;
        case 'propText':
            active.set('text', $(this).val());
            if (_proptype === 'qrcode') {
                refreshQRCodeImage(active, $(this).val());
            }
            break;
        //條碼需要及時運算額外寫
        // case 'BarCodeText':
        //     active.set('text', $(this).val());
        //     if (_proptype === 'barcode') {
        //         generateBarcode(active, $(this).val());
        //     }
        //     break;
        case 'propTop':
            if (isNaN(val)) return;
            active.set('top', val);
            break;
        case 'propLeft':
            if (isNaN(val)) return;
            active.set('left', val);
            break;
        case 'propWidth':
            if (isNaN(val)) return;
            const displayWidth = active.width * active.scaleX;
            const scaleX = val / active.width;
            active.set('scaleX', scaleX);
            break;
        case 'propHeight':
            if (isNaN(val)) return;
            const displayHeight = active.height * active.scaleY;
            const scaleY = val / active.height;
            active.set('scaleY', scaleY);
            if (_proptype === 'barcode') {
                generateBarcode(active);
            }
            break;

        case 'strokeWidth':
            if (isNaN(val)) return;
            active.set('strokeWidth', val);
            break;
        case 'propRadius':
            if (isNaN(val)) return;
            active.set('rx', val);
            active.set('ry', val);
            break;

        case 'fontSize':
            if (isNaN(val)) return;
            if (_proptype === 'barcode') {
                active.fontSize = val;
                generateBarcode(active);
            } else {
                active.set('fontSize', val);
            }
            break;
        case 'propScale':
            if (isNaN(val)) return;
            if (_proptype === 'barcode') {
                active.scale = val;
                generateBarcode(active);
            }
            break;
        case 'displayValue':
            if (_proptype === 'barcode') {
                active.displayValue = $(this).prop('checked');
                generateBarcode(active);
            }
            break;
        case 'barcodeFormat':

            if (_proptype === 'barcode') {
                active.barcodeFormat = $(this).val();
                generateBarcode(active);
            }
            break;
        case 'propQRLevel':
            active.set('propQRLevel', $(this).val());
            if (_proptype === 'qrcode') {
                refreshQRCodeImage(active);
            }
            break;
        case 'propTextAlign':
            //對齊
            active.set({ textAlign: $(this).val() });
            break;
        case 'propFontFamily':
            //字型
            active.set({ fontFamily: $(this).val() });

            break;
    }

    active.setCoords();
    saveState();
    canvas.requestRenderAll();
})
// --------------------------------
// === 事件監聽與物件操作 ===
// --------------------------------

// 1. 畫布事件監聽：任何變動都觸發 saveState
canvas.on('object:added', saveState);
canvas.on('object:removed', saveState);
canvas.on('object:modified', saveState);
canvas.on('object:scaling', () => updatePropertyPanel(canvas.getActiveObject())); // 調整時即時更新屬性面板
canvas.on('selection:created', e => { refreshLayers(); updatePropertyPanel(e.selected[0]); PropertyBar(e.selected[0]); });// 選取事件：更新圖層列表與屬性面板
canvas.on('selection:updated', e => { refreshLayers(); updatePropertyPanel(e.selected[0]); PropertyBar(e.selected[0]); });
canvas.on('selection:cleared', e => { refreshLayers(); updatePropertyPanel(null); });
canvas.on('object:moving', e => updatePropertyPanel(e.target));// 移動或縮放時，即時更新面板數據 (選單屬性)


// 雙擊偵測邏輯
let lastClickTime = 0;
const doubleClickThreshold = 300; // 毫秒內視為雙擊

canvas.on('mouse:down', function (e) {
    return;
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - lastClickTime;
    lastClickTime = currentTime;

    const target = e.target;
    if (target && timeDiff < doubleClickThreshold) {

        //console.log(active);

        if (document.getElementById('customModal')) return;
        const active = canvas.getActiveObject();
        var clonedHTML = "";
        var openModalBool = false;
        switch (active.proptype) {
            case 'textbox':
                clonedHTML = document.getElementById('textboxModal').innerHTML;
                //openModalBool = true;
                break;
            case 'qrcode':

                break;
        }

        const porpObj = {};
        const openModalDraggable = () => ModalDraggable({
            id: 'customModal',
            title: active.propId,
            content: clonedHTML,
            confirm: function (m) {
                console.log(porpObj);
                m.remove();

            },
            onShown: function (modal) {
                //JQuery
                const $this = $(modal);
                switch (active.proptype) {
                    case 'textbox':
                        porpObj.propText = $this.find("#propText");
                        porpObj.fontSize = $this.find("#fontSize");
                        porpObj.propTextAlign = $this.find("#propTextAlign");
                        porpObj.propFontFamily = $this.find("#propFontFamily");

                        porpObj.propText.val(active.text);
                        porpObj.fontSize.val(parseFloat(active.fontSize));
                        porpObj.propTextAlign.val(active.textAlign);
                        porpObj.propFontFamily.val(active.fontFamily);

                    case 'propTextAlign':
                        //對齊
                        active.set({ textAlign: $(this).val() });
                        break;
                    case 'propFontFamily':
                        //字型
                        active.set({ fontFamily: $(this).val() });
                        break;


                }


                // console.log('Modal 已顯示');
                // modal.querySelector('#nameInput')?.focus();
            },
            onHidden: function (modal) {
                console.log('Modal 已關閉');
            }
        });

        if (openModalBool) openModalDraggable();
    }
});

// 2. DOM (jQuery) 事件：

// === 畫布大小 ===
$('#canvasSize').on('change', function () {
    if (!$(this).val()) {
        $('.CustomCanvasSize').show();
    } else {
        const [w, h] = $(this).val().split('x').map(Number);
        canvas.setWidth(w);
        canvas.setHeight(h);
        canvas.renderAll();
        saveState(); // 畫布尺寸變動也視為一個狀態
        $("#canvasWidth").val(w);
        $("#canvasHeight").val(h);
        $('.CustomCanvasSize').hide();
        drawRulers(w, h);//修改尺規size
    }

});
$("#canvasWidth").on('change', function () {
    canvas.setWidth($(this).val());
    canvas.renderAll();
    saveState(); // 畫布尺寸變動也視為一個狀態
    drawRulers($(this).val(), $("#canvasHeight").val());//修改尺規size

})
$("#canvasHeight").on('change', function () {
    canvas.setHeight($(this).val());
    canvas.renderAll();
    saveState(); // 畫布尺寸變動也視為一個狀態
    drawRulers($("#canvasWidth").val(), $(this).val());//修改尺規size
})

// === 新增元件：將所有新增邏輯統一化 ===
function addObject(obj) {
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    // saveState 和 refreshLayers 會透過 canvas.on('object:added') 自動觸發
}

//#region 新增元件

//新增元件時讓位置錯動
var position = [50, 50];
function getModuleCount(_type) {
    const qrcodes = canvas.getObjects().filter(obj => obj.proptype === _type);
    return qrcodes.length;
}

var LineActive = false;
$('#addLine').click(() => {
    // //直線
    // const line = new fabric.Line([50, position[0], 150, position[1]], { stroke: 'black', strokeWidth: 2, strokeUniform: true });
    // addObject(line);
    // position[0] += 10;
    // position[1] += 10;
    const x1 = 100, y1 = 100, x2 = 150, y2 = 150;
    const line = new fabric.Line([x1, y1, x2, y2], {
        stroke: '#0088ff',
        strokeWidth: 4,
        selectable: true,         // 可選取
        hasControls: false,       // 不顯示變形控制點
        lockScalingX: true,       // 鎖定 X 軸縮放
        lockScalingY: true,       // 鎖定 Y 軸縮放
        lockRotation: true,       // 鎖定旋轉
        lockSkewingX: true,       // 鎖定 X 軸傾斜
        lockSkewingY: true,       // 鎖定 Y 軸傾斜
        lockScalingFlip: true     // 禁止翻轉縮放

    });
    let d = new Date();
    var movingactive = false;
    var origin_X_Y = [];
    line.on('moving', function (e) {
        if (!movingactive) {
            movingactive = true;
            origin_X_Y = [line.left, line.top];
            console.log(line.target);
        }
    });
    line.on('modified', function (e) {


        const curr_X_Y = [line.left, line.top];
        const Offset_X_Y = [(curr_X_Y[0] - origin_X_Y[0]), (curr_X_Y[1] - origin_X_Y[1])];
        console.log(Offset_X_Y);
        line.set({ x1: line.x1 + Offset_X_Y[0], y1: line.y1 + Offset_X_Y[1], x2: line.x2 + Offset_X_Y[0], y2: line.y2 + Offset_X_Y[1] });
        console.log(e.target.toJSON())
        movingactive = false;
        line.setCoords();
        canvas.requestRenderAll();

    });
    addObject(line);
    line.set({ absPoints: [{ x: line.x1, y: line.y1 }, { x: line.x2, y: line.y2 }] });
});


var Circle = [];
canvas.on('mouse:down', (e) => {

    const target = e.target;

    if (!target && LineActive) {
        Circle.forEach(c => {
            canvas.remove(c);
        });
        LineActive = false;
        canvas.requestRenderAll();
        Circle = [];
        return;
    }
    if (target && target.type === 'line' && !LineActive) {
        LineActive = true;
        const line_json = target.toJSON();//取出線的json，用於計算
        const lint_center = { x: target.left + target.width / 2, y: target.top + target.height / 2 };

        const absPoints = { x1: lint_center.x + line_json.x1, y1: lint_center.y + line_json.y1, x2: lint_center.x + line_json.x2, y2: lint_center.y + line_json.y2 };
        target.setCoords();
        canvas.requestRenderAll();
        const handle1 = makeHandle(absPoints.x1, absPoints.y1);
        const handle2 = makeHandle(absPoints.x2, absPoints.y2);
        handle1.on('moving', () => {
            target.set({ x1: handle1.left, y1: handle1.top });
            target.setCoords();
            canvas.requestRenderAll();
        });
        handle2.on('moving', () => {
            target.set({ x2: handle2.left, y2: handle2.top });
            target.setCoords();
            canvas.requestRenderAll();
        });


        Circle.push(handle1);
        Circle.push(handle2);
        // 將 handle 加到 canvas（讓它們在線上方）
        canvas.add(handle1, handle2);
    }
});


function makeHandle(left, top) {
    return new fabric.Circle({
        left, top,
        radius: 8,
        fill: '#fff',
        stroke: '#0088ff',
        strokeWidth: 1,
        hasControls: false,
        hasBorders: false,
        originX: 'center',
        originY: 'center',
    });
}

$('#addRectangle').click(() => {
    //框線
    const rect = new fabric.Rect({
        left: position[0], top: position[1], width: 100, height: 80, fill: '', stroke: 'black', strokeWidth: 2, strokeUniform: true
    });
    addObject(rect);
    position[0] += 10;
    position[1] += 10;
})


// 使用範例
$('#addText').click(() => {

    //文字
    let textbox = new fabric.Textbox('文字框', {
        propId: 'Text' + getModuleCount('textbox'),
        left: position[0] || 100,
        top: position[1] || 100,
        width: 200,
        fontSize: 20,
        //type:'',
        proptype: 'textbox',// 自訂類型方便辨識
        splitByGrapheme: true, // 自动换行
        fontFamily: 'Arial',
        textAlign: 'left',
        lockScalingY: true,
        fill: '#333'

    });
    position[0] += 10;
    position[1] += 10;

    addObject(textbox);
    // // 将文本添加到画布中
    // canvas.add(textbox)
    // canvas.setActiveObject(textbox);
    // canvas.requestRenderAll();

});

$('#addQR').click(async function () {
    //QRCode

    // 1️⃣ 生成 QRCode (使用 tempDiv)
    var defaulttext = "模擬QRCode";
    //注意qrcode.js不能吃中文
    const encodedText = encodeURI(defaulttext);
    const defaultsize = 128;

    const tempDiv = document.createElement('div');
    new QRCode(tempDiv, {
        text: encodedText,
        width: defaultsize,
        height: defaultsize,
        correctLevel: QRCodeCorrectLevel(QRCode.CorrectLevel, "L")
    });

    // 2️⃣ 等待影像生成
    await new Promise(r => setTimeout(r, 200));
    const img = tempDiv.querySelector('img') || tempDiv.querySelector('canvas');
    if (!img) return null;

    // 3️⃣ 轉成 Fabric.Image
    const qr = new fabric.Image(img, {
        propId: 'QR' + getModuleCount('qrcode'),
        left: position[0] || 100,
        top: position[1] || 100,
        width: defaultsize,
        height: defaultsize,
        selectable: true,
        hasControls: true,
        //type: , 
        proptype: 'qrcode',// 自訂類型方便辨識
        comment: '模擬QRCode',
        text: defaulttext,
        propQRLevel: 'L'
    });

    position[0] += 10;
    position[1] += 10;

    addObject(qr);
    // //addObject(qr);
    // // ✅ 生成真實 QRCode 圖像並替換內容
    // await refreshQRCodeImage(qr, qr.text);

});

async function refreshQRCodeImage(fabricObj, text, size = 128) {
    if (!fabricObj || fabricObj.proptype !== 'qrcode') return;

    const qrText = text || fabricObj.text || '';
    const encodedText = encodeURI(qrText);
    //const qrSize = size || 128;
    const qrWidth = fabricObj.width ?? size;
    const qrheight = fabricObj.height ?? size;
    const qrLv = fabricObj.propQRLevel ?? "L";

    const tempDiv = document.createElement('div');
    new QRCode(tempDiv, {
        text: encodedText,
        width: qrWidth,
        height: qrheight,
        correctLevel: QRCodeCorrectLevel(QRCode.CorrectLevel, qrLv)
    });

    // ✅ 使用 Promise + setTimeout 等待生成完成
    await new Promise(r => setTimeout(r, 200));

    const img = tempDiv.querySelector('img') || tempDiv.querySelector('canvas');
    if (img) {
        fabricObj.setElement(img);
        //fabricObj.text = qrText; // 更新屬性文字
        canvas.requestRenderAll();
    }
}
//對應QRCode容錯等級
function QRCodeCorrectLevel(e, lv) {
    switch (lv) {
        case "H":
            return e.H
            break;
        case "Q":
            return e.Q
            break;
        case "M":
            return e.M
            break;
        default:
            return e.L
            break;

    }
}

$('#addBarcode').click(async () => {
    //條碼
    //Code 128 (通用):CODE128 
    //EAN 13 (商品):EAN13
    //Code 128 (通用):CODE128
    const barcodeFormat = 'CODE128';//預設
    const text = '123456789012';//禁止中文
    const fontSize = 20;//fabric 拉伸後無法保持，參考比例大小
    const displayValue = true;//顯示數值
    const defaultscale = 2;//預設長寬比
    const defaultheight = 100;
    const defaultmargin = 10;

    // 1️⃣ 建立暫時 canvas 並生成條碼
    const tempCanvas = document.createElement('canvas');
    JsBarcode(tempCanvas, text, {
        format: barcodeFormat,
        displayValue: displayValue,
        width: defaultscale,
        height: defaultheight - (defaultmargin * 4) - 2,
        margin: defaultmargin,
        fontSize: fontSize,
        xml: true
    });

    // 2️⃣ 等待生成
    await new Promise(r => setTimeout(r, 100));
    let tempheight = tempCanvas.height;
    let tempwidth = tempCanvas.width;

    // 3️⃣ 轉成 Fabric.Image
    const barcode = new fabric.Image(tempCanvas, {
        propId: 'BAR' + getModuleCount('barcode'),
        left: position[0] || 100,
        top: position[1] || 100,
        width: tempwidth,
        height: tempheight,
        scale: defaultscale,
        porpmargin: defaultmargin,//紀錄邊距
        selectable: true,
        hasControls: true,
        proptype: 'barcode',
        comment: '模擬條碼',
        //BarCodeText: "123456",// 預設內容
        text: text,// 預設內容
        fontSize: fontSize,
        displayValue: true,
        barcodeFormat: barcodeFormat,
        // 🚫 禁止非等比縮放
        lockUniScaling: true,
        lockScalingFlip: true,// 防止負縮放導致反轉        
    });


    position[0] += 10;
    position[1] += 10;

    addObject(barcode);
});

//#endregion

// === 手動層級控制按鈕 ===
$('#bringToFront').click(() => {
    const obj = canvas.getActiveObject();
    if (obj) {
        obj.bringToFront();
        canvas.renderAll();
        refreshLayers();
        saveState();
    }
});

$('#sendToBack').click(() => {
    const obj = canvas.getActiveObject();
    if (obj) {
        obj.sendToBack();
        canvas.renderAll();
        refreshLayers();
        saveState();
    }
});

$('#bringForward').click(() => {
    const obj = canvas.getActiveObject();
    if (obj) {
        obj.bringForward();
        canvas.renderAll();
        refreshLayers();
        saveState();
    }
});

$('#sendBackward').click(() => {
    const obj = canvas.getActiveObject();
    if (obj) {
        obj.sendBackwards();
        canvas.renderAll();
        refreshLayers();
        saveState();
    }
});


// --------------------------------
// === 程式碼啟動 (Init) ===
// --------------------------------
(function init() {
    // 儲存畫布的空白初始狀態
    saveState();
    refreshLayers();
    updateUndoRedoButtons();
    const [w, h] = $("#canvasSize").val().split('x').map(Number);
    $("#canvasWidth").val(w);
    $("#canvasHeight").val(h)
})();

