//<!--處理網頁預存-->
// window.onload = function () {
//     CheckLocalStorage();
// };
//localStorage 瀏覽器內建儲存
function DeletelocalStorage(key) {
    try {
        localStorage.removeItem(key);
        return true; // 成功刪除
    } catch (err) {
        console.error("刪除 localStorage 發生錯誤:", err);
        return false;
    }
}

// 取得指定 key 的值 (若沒傳 key，則回傳全部資料)
function GetlocalStorage(key) {
    try {
        if (typeof key === "undefined") {
            // 沒有傳 key → 取全部
            let allData = {};
            for (let i = 0; i < localStorage.length; i++) {
                let k = localStorage.key(i);
                let v = localStorage.getItem(k);
                try {
                    allData[k] = JSON.parse(v); // 嘗試 JSON.parse
                } catch {
                    allData[k] = v; // 不是 JSON → 原字串
                }
            }
            //console.log("目前 localStorage 全部內容:", allData);
            return allData;
        } else {
            // 有傳 key → 取單一項
            const value = localStorage.getItem(key);
            if (value === null) return null;
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        }
    } catch (err) {
        console.error("讀取 localStorage 發生錯誤:", err);
        return null;
    }
}

// 設定指定 key 與值 (會自動 JSON.stringify)
function SetlocalStorage(key, value) {
    try {
        if (typeof value === "object") {
            localStorage.setItem(key, JSON.stringify(value));
        } else {
            localStorage.setItem(key, value);
        }
        return true;
    } catch (err) {
        console.error("設定 localStorage 發生錯誤:", err);
        return false;
    }
}

function CheckLocalStorage() {
    const f = document.createElement("div");
    f.className = "form-container";
    f.classList = "my-5";

    const search_row = document.createElement("div");
    search_row.className = "d-flex align-items-center my-2";
    const search_title = document.createElement("h4");
    //search_title.classList = "w-50";
    search_title.textContent = "查詢 LocalStorage(瀏覽器內建儲存)";
    search_row.appendChild(search_title);
    const search_btn = document.createElement("button");
    search_btn.type = "button";
    search_btn.className = "btn btn-primary mx-5";
    search_btn.textContent = "搜尋";
    search_row.appendChild(search_btn);
    f.appendChild(search_row);

    const del_row = document.createElement("div");
    del_row.className = "align-items-center my-2";
    del_row.style.display = "none";
    const del_title = document.createElement("h4");
    del_title.className = "my-0";
    del_title.textContent = "刪除預存：";
    del_row.appendChild(del_title);
    const del_input = document.createElement("input");
    del_input.className = "form-container w-25";
    del_row.appendChild(del_input);
    const del_btn = document.createElement("button");
    del_btn.type = "button";
    del_btn.classList = "btn btn-danger mx-2";
    del_btn.textContent = "刪除";
    del_row.appendChild(del_btn);
    f.appendChild(del_row);

    const search_show = document.createElement("textarea");
    search_show.style.display = "none";
    search_show.rows = 10;
    search_show.className = "form-control my-2";
    search_show.style.width = "100%";
    f.appendChild(search_show);

    document.body.appendChild(f);

    search_btn.onclick = function () {
        let _localStorage = GetlocalStorage();
        search_show.value = JSON.stringify(_localStorage, null, 2);
        del_row.style.display = "flex";
        search_show.style.display = "block";
    };

    del_btn.onclick = function () {
        DeletelocalStorage(del_input.value);
        search_btn.onclick();
    };
};
