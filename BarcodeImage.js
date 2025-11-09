async function generateBarcode(fabricObj, _text) {

    // 注意：JsBarcode 的 width 參數實際上是 X-dimension，建議用 CSS 寬度或設定 scale 屬性
    const barcodeFormat = fabricObj.barcodeFormat ?? 'CODE128';//預設
    const text = fabricObj.text ?? _text ?? '123456789012';//禁止中文
    const fontSize = fabricObj.fontSize ?? 20;//fabric 拉伸後無法保持，參考比例大小
    const displayValue = fabricObj.displayValue ?? true;//顯示數值
    const scale = fabricObj.scale ?? 2;//預設長寬比    
    const defaultheight = fabricObj.height ?? 100;
    const margin = fabricObj.porpmargin ?? 10;
    const height = defaultheight - (margin * 2) - (displayValue ? fontSize : 0) - 2
    // --- 1. 驗證數值 ---
    const validation = validateBarcodeData(barcodeFormat, text);

    if (!validation.isValid) {
        console.warn(validation.message);
        document.getElementById("previewStatus").textContent = ` ⚠️ ${validation.message}`;
        return validation;
    }


    // 建立暫時 canvas 並生成條碼
    const tempCanvas = document.createElement('canvas');
    try {
        JsBarcode(tempCanvas, text, {
            format: barcodeFormat,
            displayValue: displayValue,
            width: scale,
            height: height,
            margin: margin,
            fontSize: fontSize,
            xml: true
        });

        // 等待載入完成
        await new Promise(r => setTimeout(r, 100));

        fabricObj.setElement(tempCanvas);
        canvas.requestRenderAll();
        //updatePropertyPanel(canvas.getActiveObject());
        document.getElementById("previewStatus").textContent = validation.message;

        // ✅ 回傳 <img> 元素，可直接加進 fabric.Image 或 DOM
        return tempCanvas;
    } catch (e) {
        console.error("JsBarcode error:", e);
        console.error(validation.message);
        return null;
    }
}

/**
 * 根據選定的格式驗證條碼數據
 * (程式碼與前次回應相同，用於數據驗證)
 */
function validateBarcodeData(format, data) {
    const result = { isValid: false, message: '', hint: '' };

    if (!data || data.trim() === '') {
        result.message = "數值不能為空。";
        result.hint = "請輸入數值";
        return result;
    }

    switch (format) {
        case 'EAN13':
            // EAN13 必須是 12 位數字 (JsBarcode 會自動計算第 13 位校驗碼)
            if (!/^\d{12}$/.test(data)) {
                result.message = "EAN13 格式需要嚴格的 12 位數字。";
                result.hint = "需輸入 12 位數字";
            } else {
                result.message = `✅ 條碼格式: ${format}，已成功生成。`;
                result.isValid = true;
            }
            break;
        case 'CODE39':
            // CODE39 限制為大寫字母、數字和特定符號 ( - . $ / + % ) 及空格
            if (!/^[A-Z0-9\-\.\$\/\+\% ]+$/.test(data.toUpperCase())) {
                result.message = "Code 39 僅支援大寫字母、數字和特定符號。";
                result.hint = "支援 A-Z, 0-9, -.$/+% ";
            } else {
                result.message = `✅ 條碼格式: ${format}，已成功生成。`;
                result.isValid = true;
            }
            break;
        case 'CODE128':
            // 正則表達式：
            // ^[\x00-\x7F]+$
            // [\x00-\x7F] 匹配所有標準 ASCII 字符 (範圍 0x00 到 0x7F，共 128 個)
            // + 表示至少一個字符
            // ^ 與 $ 確保整個字串都是 ASCII 字符
            if (!/^[\x00-\x7F]+$/.test(data)) {
                // 如果條件成立 (表示字串中包含非 ASCII 字符，例如中文、日文、或特殊的 Unicode 符號)
                result.isValid = false;
                //result.message = "Code 128 僅支援標準 ASCII 字符。";
                result.message = "請勿包含中文、全形符號或 ASCII 127 以上的特殊字符。";
                result.hint = "請勿包含中文、全形符號或 ASCII 127 以上的特殊字符。";
            } else {
                result.isValid = true;
                result.message = "支援幾乎所有字元，無固定長度限制";
            }
            break;
        default:
            // CODE128 最通用，幾乎沒有字元集限制
            result.isValid = true;
            result.message = "支援幾乎所有字元，無固定長度限制";
            break;
    }

    return result;
}