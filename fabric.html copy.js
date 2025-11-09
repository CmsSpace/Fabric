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
const JSON_PROPS = ['selectable', 'evented', 'rx', 'ry', 'fill', 'stroke', 'strokeWidth', 'fontSize', 'fontFamily', 'text', 'strokeUniform']; // 確保序列化完整

// --------------------------------
// === 狀態管理與歷史記錄 (Undo/Redo) ===
// --------------------------------

/**
 * 將當前畫布狀態儲存到 history 堆疊中。
 */
function saveState() {
    if (isLoading) return;

    const currentState = JSON.stringify(canvas.toJSON(JSON_PROPS));

    // 避免重複儲存相同的狀態
    if (history.length === 0 || history[history.length - 1] !== currentState) {
        history.push(currentState);

        // 限制歷史記錄長度
        if (history.length > MAX_HISTORY) history.shift();

        // 任何新的操作都清除 Redo 堆疊
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
    isLoading = true; // 鎖定 saveState

    canvas.loadFromJSON(stateString, () => {
        canvas.renderAll();
        isLoading = false; // 解鎖 saveState
        refreshLayers();
        // 確保選取狀態正確 (通常載入後選取會被清除)
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
    if (isZKey && isYKey) {
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
        const name = `${obj.type}` + (obj.type == 'textbox' || obj.type == 'qrcode' ? ` (${obj.propId})` : '');

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
            if (confirm(`確定要刪除圖層: ${name} 嗎?`)) {
                item.remove();
                canvas.remove(obj);
                canvas.requestRenderAll();
                // 'object:removed' 事件會自動處理 saveState, refreshLayers, updatePropertyPanel
            }
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
        #propTop,
        #propLeft,
        #propWidth,
        #propHeight,
        #fontSize,
        #strokeWidth,
        #propRadius,
        #fontSize`;

function PropertyBar(obj) {
    $(".propTr").css({ 'display': 'none' });

    switch (obj.type) {
        case 'line':
            $('.WidthBar').css({ 'display': 'table-row' });
            $('.WidthLabel').hide();
            $('.LengthLabel').show();
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
            $('.HeightBar').css({ 'display': 'table-row' });
            $('.fontSizeBar').css({ 'display': 'table-row' });

            break;
        }
        case 'qrcode': {
            $('.IdBar').css({ 'display': 'table-row' });
            $('.TextBar').css({ 'display': 'table-row' });
            $('.WidthBar').css({ 'display': 'table-row' });
            $('.HeightBar').css({ 'display': 'table-row' });
            break;
        }
        case 'strokeWidth':

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
    // 1. 基本屬性 (所有物件幾乎都有)
    $('#propTop').val(Math.trunc(obj.top));
    $('#propLeft').val(Math.trunc(obj.left));
    // 2. 尺寸屬性 (需使用 getScaledXXX() 取得縮放後的實際尺寸)
    // 對於 Textbox 來說，若有 scaleX/Y 則需特別注意
    const currentWidth = obj.type === 'textbox' ? obj.width : obj.getScaledWidth();
    const currentHeight = obj.type === 'textbox' ? obj.height : obj.getScaledHeight();
    $('#propWidth').val(Math.trunc(currentWidth));
    $('#propHeight').val(Math.trunc(currentHeight));
    $('#propRadius').val(obj.rx ? obj.rx : 0);
    $('#strokeWidth').val(obj.strokeWidth ?? 0);

    switch (obj.type) {
        case 'line':
            break;
        case 'rect':
            break;
        case 'textbox':
            $("#propId").val(obj.propId);
            $('#propText').val(obj.text);
            $('#fontSize').val(obj.fontSize || 20);
            break;
        case 'qrcode':
            $("#propId").val(obj.propId);
            $('#propText').val(obj.text);

            break;
    }
    // TODO: 擴展此處以處理 Fill, Stroke Color, Left, Top, Width, Height 等屬性
}

$(PorpInput).on('change', function () {
    const active = canvas.getActiveObject();
    const val = parseFloat($(this).val());

    if (!active) return;

    const propId = $(this).prop('id');

    switch (propId) {
        case 'propId':
            active.set('propId', $(this).val());
            break;
        case 'propText':
            console.log(active.type)
            active.set('text', $(this).val());
            if (active.type == 'qrcode') {
                refreshQRCodeImage(active, $(this).val())
            }
            break;
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
            active.set('fontSize', val);
            break;
        case 'qrcode':
            console.log(active.type)
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
/**
 * 監聽 'object:modified' 事件：
 * 確保在拖動結束後，Textbox 尺寸最終被正確計算並穩定。
 */
canvas.on('object:modified', (e) => {
    const target = e.target;
    if (target && target.type === 'textbox') {
        // 最終校正尺寸
        target.initDimensions();
        target.setCoords();
        canvas.renderAll();
    }
});

canvas.on('object:scaling', () => updatePropertyPanel(canvas.getActiveObject())); // 調整時即時更新屬性面板
/**
 * 監聽 'object:scaling' 事件：
 * 這是實現「固定文字大小」和「範圍換行」的核心邏輯。
 */
canvas.on('object:scaling', (e) => {
    const t = e.target;
    if (t && t.type === 'textbox') {
        // 限制最小寬度
        const minWidth = 50;
        const newWidth = Math.max(t.getScaledWidth(), minWidth);

        // 固定文字大小，不拉伸文字
        t.set({
            width: newWidth,
            scaleX: 1,
            scaleY: 1
        });

        // 重新計算文字排版
        t.initDimensions();
        t.setCoords();
        canvas.renderAll();
    }
});


// 選取事件：更新圖層列表與屬性面板
canvas.on('selection:created', e => { refreshLayers(); updatePropertyPanel(e.selected[0]); PropertyBar(e.selected[0]); });
canvas.on('selection:updated', e => { refreshLayers(); updatePropertyPanel(e.selected[0]); PropertyBar(e.selected[0]); });
canvas.on('selection:cleared', e => { refreshLayers(); updatePropertyPanel(null); });
// 移動或縮放時，即時更新面板數據 (選單屬性)
canvas.on('object:moving', e => updatePropertyPanel(e.target));
canvas.on('object:scaling', e => updatePropertyPanel(e.target));

// 2. DOM (jQuery) 事件：

// === 畫布大小 ===
$('#canvasSize').on('change', function () {
    const [w, h] = $(this).val().split('x').map(Number);
    canvas.setWidth(w);
    canvas.setHeight(h);
    canvas.renderAll();
    saveState(); // 畫布尺寸變動也視為一個狀態
});

// === 新增元件：將所有新增邏輯統一化 ===
function addObject(obj) {
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    // saveState 和 refreshLayers 會透過 canvas.on('object:added') 自動觸發
}

//新增元件時讓位置錯動
var position = [50, 50];
$('#addLine').click(() => {
    //直線
    const line = new fabric.Line([50, position[0], 150, position[1]], { stroke: 'black', strokeWidth: 2, strokeUniform: true });
    addObject(line);
    position[0] += 10;
    position[1] += 10;
});

$('#addRectangle').click(() => {
    //框線
    const rect = new fabric.Rect({
        left: position[0], top: position[1], width: 100, height: 80, fill: '', stroke: 'black', strokeWidth: 2, strokeUniform: true
    });
    addObject(rect);
    position[0] += 10;
    position[1] += 10;
})
$('#addRect').click(() => {
    //方框
    const rect = new fabric.Rect({
        left: 50, top: 50, width: 100, height: 80, fill: '', stroke: 'black', strokeWidth: 2, strokeUniform: true
    });
    addObject(rect);
});

$('#addRoundRect').click(() => {
    //圓角方框
    const rect = new fabric.Rect({ left: position[0], top: position[1], width: 100, height: 80, rx: 10, ry: 10, fill: '', stroke: 'black', strokeWidth: 2, strokeUniform: true });
    addObject(rect);
    position[0] += 10;
    position[1] += 10;
});


/**
 * 建立支援中英文換行、最大寬度固定的 Textbox
 */
function createSmartTextbox(text, options = {}) {
    //文字 fuction
    const maxWidth = options.maxWidth || 300;
    const fontSize = options.fontSize || 20;
    const left = options.left || position[0];
    const top = options.top || position[1];
    position[0] += 10;
    position[1] += 10;
    // === 中文換行處理：插入零寬空白，讓 Fabric 能自動分行 ===
    const processedText = text.split('').join('\u200B');

    const textbox = new fabric.Textbox(processedText, {
        propId: options.propId,
        left,
        top,
        width: maxWidth,
        fontSize,
        fill: '#000',
        strokeUniform: true,
        breakWords: true,
        editable: true,
        //lockScalingY: true,
        objectCaching: false,
        //transparentCorners: false,
        cornerStyle: 'circle',
        borderColor: '#2196F3',
        cornerColor: '#2196F3'
    });

    // === 限制最大寬度 ===
    textbox.on('scaling', () => {
        const newWidth = Math.min(textbox.getScaledWidth(), maxWidth);
        textbox.set({
            width: newWidth,
            scaleX: 1,
            scaleY: 1
        });
        textbox.initDimensions();
        textbox.setCoords();
    });

    return textbox;
}

// 使用範例
$('#addText').click(() => {
    //文字
    const textboxes = canvas.getObjects().filter(obj => obj.type === 'textbox');
    const count = textboxes.length;
    const t = createSmartTextbox('文字方塊', {
        maxWidth: 300,
        fontSize: 20,
        propId: 'textbox' + count
    });
    canvas.add(t);
    canvas.setActiveObject(t);
    canvas.requestRenderAll();
});
$('#addQR').click(async function () {
    // QRCode
    const qrcodes = canvas.getObjects().filter(obj => obj.type === 'qrcode');
    const count = qrcodes.length;

    // 先建立一個空白圖片當佔位
    const emptyCanvas = document.createElement('canvas');
    emptyCanvas.width = 128;
    emptyCanvas.height = 128;

    const qr = new fabric.Image(emptyCanvas, {
        propId: 'QR' + count,
        left: position[0] || 100,
        top: position[1] || 100,
        width: 128,
        height: 128,
        selectable: true,
        hasControls: true,
        type: 'qrcode', // 自訂類型方便辨識
        comment: '模擬QRCode',
        text: "Hello QR"
    });

    position[0] += 10;
    position[1] += 10;

    canvas.add(qr);

    // ✅ 生成真實 QRCode 圖像並替換內容
    await refreshQRCodeImage(qr, qr.text);

});

async function refreshQRCodeImage(fabricObj, text, size = 128) {
    if (!fabricObj || fabricObj.type !== 'qrcode') return;

    const qrText = text || fabricObj.text || '';
    const qrSize = size || 128;

    const tempDiv = document.createElement('div');
    new QRCode(tempDiv, {
        text: qrText,
        width: qrSize,
        height: qrSize,
        correctLevel: QRCode.CorrectLevel.L
    });

    // ✅ 使用 Promise + setTimeout 等待生成完成
    await new Promise(r => setTimeout(r, 200));

    const img = tempDiv.querySelector('img') || tempDiv.querySelector('canvas');
    if (img) {
        fabricObj.setElement(img);
        fabricObj.text = qrText; // 更新屬性文字
        canvas.requestRenderAll();
    }
}

$('#addBarcode').click(() => {
    alert('這部分可自行接API產生 QRCode / 條碼圖，目前以方塊佔位。');
    const rect = new fabric.Rect({ left: 50, top: 50, width: 100, height: 100, fill: 'black' });
    addObject(rect);
});

// === 手動層級控制按鈕 ===
$('#bringToFront').click(() => {
    const obj = canvas.getActiveObject();
    if (obj) {
        obj.bringToFront();
        canvas.renderAll();
        refreshLayers();
    }
});

$('#sendToBack').click(() => {
    const obj = canvas.getActiveObject();
    if (obj) {
        obj.sendToBack();
        canvas.renderAll();
        refreshLayers();
    }
});

$('#bringForward').click(() => {
    const obj = canvas.getActiveObject();
    if (obj) {
        obj.bringForward();
        canvas.renderAll();
        refreshLayers();
    }
});

$('#sendBackward').click(() => {
    const obj = canvas.getActiveObject();
    if (obj) {
        obj.sendBackwards();
        canvas.renderAll();
        refreshLayers();
    }
});

// // === 屬性編輯 ===
// $('#fontSize').on('change', function () {
//     const active = canvas.getActiveObject();
//     const val = parseInt($(this).val());
//     if (active && active.type === 'i-text' && !isNaN(val)) {
//         active.set('fontSize', val);
//         canvas.requestRenderAll();
//         // 狀態儲存會由 'object:modified' 事件間接觸發
//     }
// });


// // === 右鍵刪除 (事件處理已優化) ===
// canvas.on('mouse:down', function (opt) {
//     if (opt.e.button === 2) { // 右鍵
//         opt.e.preventDefault();
//         const active = opt.target || canvas.getActiveObject();
//         if (active) {
//             if (confirm("確定要刪除選取的物件嗎？")) {
//                 canvas.remove(active);
//                 canvas.requestRenderAll();
//                 // 'object:removed' 會自動處理後續狀態
//             }
//         }
//     }

// });
// // 阻擋整頁右鍵選單
// document.addEventListener('contextmenu', e => {
//     if ($(e.target).closest('#canvas').length) e.preventDefault();
// });


// --------------------------------
// === 程式碼啟動 (Init) ===
// --------------------------------
(function init() {
    // 儲存畫布的空白初始狀態
    saveState();
    refreshLayers();
    updateUndoRedoButtons();
})();