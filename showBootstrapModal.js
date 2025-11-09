//範例 2024/06/30
//2024/09/18 修改:showFooter參數刪除，改為buttonPosition按鈕位置
function ModalExample() {
    showBootstrapModal({
        id: 'ttttt_20240918',
        title: '測試提示視窗ModalExample',
        modalSize: 'sm', //互動視窗大小 sm(300px),預設(500px),lg(800px),xl(1140px)
        fullscreen: 'sm', //滿版互動視窗 預設不變 full(滿版),sm(576px),md(768px),lg(992px),xl(1200px),xxl(1400px)
        StaticBackdrop: false, //靜態背景 true(開啟,預設)/false(關閉)
        isDragging: true, //是否允許拖曳 true(開啟,預設)/false(關閉)
        //showHead: false, //標題列顯示 true(開啟,預設)/false(隱藏)
        showCloseBtn: true, ////標題列關閉按鈕 true(開啟,預設)/false(隱藏)
        // 刪除該參數showFooter: false, //頁尾列顯示 true(開啟,預設)/false(隱藏)
        buttonPosition: 'bottom',//按鈕位置 預設不顯示, top(上) ,bottom(下)
        Url: '/login.html', //Url
        method: 'get', //請求方法， GET(預設) / POST
        data: {
            UserID: "sysadmin",
            Password: "sysadmin1"
        },
        //buttonLeft: [{
        //    id: 'Alert1',
        //    title: 'Alert1',
        //    class: '',
        //    style: '',
        //    function: function () {
        //        alert('Alert1');
        //    }
        //}],
        buttonRight: [
            {
                id: 'Alert3',
                title: 'Alert3',
                class: '',
                style: '',
                function: function () {
                    alert('Alert1');
                }
            },
            {
                id: 'Close',
                title: '關閉',
                class: '',
                style: '',
                function: function () {
                    bootstrap.Modal.getInstance(document.getElementById('ttttt')).hide();
                }
            }
        ],
        onShown: function () { },
        onHidden: function () { },
        detailFormatter: function () {
            return `<span>asfdasdfa46f8as41d6a4sd</span>`
        },
    });
}


const showBootstrapModal = (Event) => {

    //2.定義新創建的modal物件
    const modal = document.createElement('div');
    //賦予modal ID
    ////沒傳入ID給一串亂碼
    if (Event.id === undefined || Event.id === '') Event.id = Math.random().toString(36).slice(2, 10);
    modal.id = Event.id;
    //賦予modal class
    modal.className = 'modal fade';
    modal.setAttribute('data-modal', 'true');
    //modal.setAttribute("tabindex", "-1");
    modal.setAttribute("role", "dialog");

    if (Event.StaticBackdrop === undefined || Event.StaticBackdrop === true) {
        //控制靜態背景避免不小心關閉
        modal.setAttribute("data-bs-backdrop", "static");
        modal.setAttribute("data-bs-keyboard", "false");
    }

    //<!-- Modal -->

    ////互動視窗大小 sm(300px),預設(500px),lg(800px),xl(1140px)
    Event.modalSize = (!['sm', 'lg', 'xl'].includes(Event.modalSize)) ? '' : `modal-${Event.modalSize}`;

    ////滿版互動視窗
    Event.fullscreen = [undefined, ''].includes(Event.fullscreen) ? '' : (!['sm', 'md', 'lg', 'xl', 'xl'].includes(Event.fullscreen)) ? 'modal-fullscreen' : `modal-fullscreen-${Event.fullscreen}-down`;

    ////頁尾列顯示按鈕
    let buttonLeft = '', buttonRight = ''; var buttonEvent = () => { }; var removebuttonEvent = () => { }; btn_html = "";
    //////按鈕位置
    if (Event.buttonPosition != undefined && (Event.buttonPosition == "top" || Event.buttonPosition == "bottom")) {
        //生成頁尾按鍵html
        if (typeof Event.buttonLeft === 'object') {
            (Event.buttonLeft).forEach(e => {
                if (e.id) { buttonLeft += `<button id='${e.id}' type="button" class="btn ${e.class == undefined ? 'btn-primary' : e.class}" style='margin:0px 4px; ${e.style}'>${e.title}</button>` };
            });
        }
        if (typeof Event.buttonRight === 'object') {
            (Event.buttonRight).forEach(e => {
                if (e.id) { buttonRight += `<button id='${e.id}' type="button" class="btn ${e.class == undefined ? 'btn-primary' : e.class}" style='margin:0px 4px;${e.style}'>${e.title}</button>` };
            });
        }
        //生成button html
        btn_html = `
            <div class="d-flex justify-content-between">
                <div>${buttonLeft}</div>
                <div>${buttonRight}</div>
            </div>
        `;

        //頁尾列顯示按鈕的功能 function 
        buttonEvent = () => {
            if (typeof Event.buttonLeft === 'object') {
                (Event.buttonLeft).forEach(e => {
                    if (e.id && typeof e.function === 'function') {
                        document.getElementById(e.id).addEventListener('click', e.function)
                    };
                });
            }
            if (typeof Event.buttonRight === 'object') {
                (Event.buttonRight).forEach(e => {
                    if (e.id && typeof e.function === 'function') {
                        document.getElementById(e.id).addEventListener('click', e.function)
                    };
                });
            }
        };
        //頁尾列顯示按鈕 清除事件監聽器  
        removebuttonEvent = () => {
            if (typeof Event.buttonLeft === 'object') {
                (Event.buttonLeft).forEach(e => {
                    if (e.id && typeof e.function === 'function') {
                        document.getElementById(e.id).removeEventListener('click', e.function)
                    };
                });
            }
            if (typeof Event.buttonRight === 'object') {
                (Event.buttonRight).forEach(e => {
                    if (e.id && typeof e.function === 'function') {
                        document.getElementById(e.id).removeEventListener('click', e.function)
                    };
                });
            }
        };
    }


    //建立頁面
    modal.innerHTML = `<div class="modal-dialog modal-dialog-centered ${Event.modalSize} ${Event.fullscreen}">
                        <div class="modal-content">
                            <div class="modal-header" ${Event.showHead === false ? 'hidden' : ''}>
                                <h5 class="modal-title" id="${Event.id}_Label">${Event.title === undefined ? '提示視窗' : Event.title}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" ${Event.showCloseBtn === false ? 'hidden' : ''}></button>
                            </div>
                            <div style="padding:12px" ${Event.buttonPosition === "top" ? '' : 'hidden'}>
                               ${Event.buttonPosition == "top" ? btn_html : ''}
                            </div>
                            <div class="modal-body">
                                <button class="btn btn-primary" type="button" disabled>
                                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                Loading...
                                </button>
                            </div>
                            <div class="modal-footer" ${Event.buttonPosition === "bottom" ? '' : 'hidden'}>
                                 ${Event.buttonPosition == "bottom" ? btn_html : ''}
                            </div>
                        </div>
                    </div>`;

    //3.新增至DOM
    document.querySelector('body').appendChild(modal);

    //5.modal顯示時執行的回呼函式
    $(`#${Event.id}`).on('shown.bs.modal', function (e) {
        //console.log('shown.bs.modal');
        if (typeof Event.detailFormatter === "function") {
            document.getElementById(Event.id).getElementsByClassName('modal-body')[0].innerHTML = Event.detailFormatter();
            //*避免多次注入或執行事件，改判斷Url 那邊加載*
            // //執行傳入事件
            // if (typeof Event.onShown === "function") Event.onShown();
            // //注入button功能
            // buttonEvent();
        }
        if (Event.Url) {
            // 使用 XMLHttpRequest 動態載入頁面內容
            const xhttp = new XMLHttpRequest();
            Event.method = Event.method ? Event.method : "GET";
            xhttp.open(Event.method, Event.Url, true);  // true:非同步
            if ((Event.method).toUpperCase() === "POST") {
                xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                // 如果需要的話，可以加入 __RequestVerificationToken
                // xhttp.setRequestHeader('__RequestVerificationToken', document.getElementsByName("__RequestVerificationToken")[0].value);
            }
            xhttp.send(new URLSearchParams(Event.data));
            xhttp.onload = function () {
                const responseHTML = this.responseText;
                const modalBody = document.getElementById(Event.id).getElementsByClassName('modal-body')[0];
                modalBody.innerHTML = responseHTML;

                // 自動執行內嵌的 <script> 代碼
                const scripts = modalBody.getElementsByTagName('script');
                for (let i = 0; i < scripts.length; i++) {
                    const script = document.createElement('script');
                    script.text = `(function() { ${scripts[i].text} })()`;
                    modalBody.appendChild(script).parentNode.removeChild(script);
                }

                // 避免動態加載的 CSS 影響其他部分
                const styles = modalBody.getElementsByTagName('style');
                for (let i = 0; i < styles.length; i++) {
                    const style = document.createElement('style');
                    style.textContent = `#${Event.id} .modal-body { ${styles[i].textContent} }`;
                    document.head.appendChild(style);
                }

                //document.getElementById(Event.id).getElementsByClassName('modal-body')[0].innerHTML = this.responseText;

                //執行傳入事件
                if (typeof Event.onShown === "function") Event.onShown();
                //注入button功能
                buttonEvent();

            };
        } else {
            //執行傳入事件
            if (typeof Event.onShown === "function") Event.onShown();
            //注入button功能
            buttonEvent();

        }
    });


    //6.隱藏時移除modal
    $(`#${Event.id}`).on('hidden.bs.modal', function (e) {
        //console.log('hidden.bs.modal');
        //執行傳入事件
        if (typeof Event.onHidden === "function") Event.onHidden();

        //頁尾列顯示按鈕 清除事件監聽器  
        removebuttonEvent();
        const el = document.querySelector(`#${Event.id}`);
        if (!el) {
            console.error(`❌ 找不到 modal 元素：#${Event.id}`);
        } else {
            el.remove();
        }
        modal.remove();
    });

    //4.執行跳出modal
    $(`#${Event.id}`).modal('show');
    setTimeout(() => {
        if (Event.isDragging) {
            document.getElementsByClassName('modal-backdrop')[0].remove();
            const header = modal.getElementsByClassName('modal-header');
            // 拖曳功能
            let isDragging = false;
            let offsetX = 0;
            let offsetY = 0;

            header.addEventListener('mousedown', (e) => {
                isDragging = true;
                const rect = modal;
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
            });

            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    modal.style.left = `${e.clientX - offsetX}px`;
                    modal.style.top = `${e.clientY - offsetY}px`;
                }
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
            });
        }
    }, 100);
};

//bs style 提示視窗
showBsModalMessage = function (id, title, msag) {
    id += (id == "undefined" || id == '' ? "modal_" : "-modal_") + Math.random().toString(36).slice(2, 10);
    if (title == "") title = "提示視窗";

    showBootstrapModal({
        id: id,
        title: title,
        buttonRight: [
            {
                id: "close",
                title: "<i class='fx-4 bi-x'></i> 關閉",

                function: function () {
                    bootstrap.Modal.getInstance(document.getElementById(id)).hide();
                },
            },
        ],
        detailFormatter: function () {
            return msag;
        }
    });

}
