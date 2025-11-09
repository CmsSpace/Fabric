openModalDraggable = () => {


    ModalDraggable({
        id: 'customModal',
        title: '可移動的 Modal',
        content: `
                    <label>姓名：</label>
                    <input type="text" id="nameInput" style="width: 100%; margin-bottom: 0.5rem;"><br>
                    <label>選擇類型：</label>
                    <select id="typeSelect" style="width: 100%;">
                    <option value="A">類型 A</option>
                    <option value="B">類型 B</option>
                    </select>
                `,
        confirm: function (m) {
            const name = m.querySelector('#nameInput')?.value;
            const type = m.querySelector('#typeSelect')?.value;
            console.log('姓名：', name);
            console.log('類型：', type);
            m.remove();

        }
    });
}

function ModalDraggable(Event) {
    if (Event.id === undefined || Event.id === '') Event.id = Math.random().toString(36).slice(2, 10);
    const modal = document.createElement('div');
    modal.id = Event.id
    //modal.classList.add('modal');
    modal.style = `position: fixed;
                        top: 100px;
                        left: 100px;
                        width: 400px;
                        background-color: #fff;
                        border: 1px solid #ccc;
                        border-radius: 0.5rem;
                        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
                        display: none;
                        z-index: 1000;
                        transition: opacity 0.3s ease;`;

    const modalHeader = document.createElement('div');
    modalHeader.classList.add('modal-header');
    modalHeader.innerHTML = Event.title ?? '提示視窗';
    modalHeader.style = `padding: 0.75rem 1rem;
                        background-color: #f1f1f1;
                        border-bottom: 1px solid #ddd;
                        cursor: move;
                        font-weight: bold;
                        border-radius: 0.5rem 0.5rem 0 0;`;

    const modalBody = document.createElement('div');
    modalBody.classList.add('modal-body');
    modalBody.style = `padding: 1rem;`;
    modalBody.innerHTML = Event.content ?? '這是一個模仿 Bootstrap 的 modal，使用純 JS 和 CSS 製作，沒有遮罩。';

    const modalFooter = document.createElement('div');
    modalFooter.classList.add('modal-footer');
    modalFooter.style = `padding: 0.75rem 1rem;
                        text-align: right;
                        border-top: 1px solid #ddd;
                        background-color: #f9f9f9;
                        border-radius: 0 0 0.5rem 0.5rem;`;


    const btncss = `padding: 0.25rem 0.5rem;
                            font-size: 0.875rem;
                            border: none;
                            border-radius: 0.25rem;
                            cursor: pointer;
                            transition: background-color 0.2s ease;
                            margin-left: 0.5rem;`;

    const okBtn = document.createElement('button');
    okBtn.classList.add('btn');
    okBtn.style = btncss + ` background-color: #0d6efd;color: white;`;
    okBtn.innerHTML = '確定';
    okBtn.addEventListener('click', () => {
        if (typeof Event.confirm === 'function') Event.confirm(modal);
    });

    const closeBtn = document.createElement('button');
    closeBtn.classList.add('btn');
    closeBtn.classList.add('close-btn');
    closeBtn.id = 'closeModal';
    closeBtn.style = btncss + `  background-color: #6c757d;color: white;`;
    closeBtn.innerHTML = '關閉';
    closeBtn.addEventListener('click', () => {
        if (typeof modal._onHidden === 'function') modal._onHidden(modal);
        modal.remove();
    });

    modal.appendChild(modalHeader);
    modal.appendChild(modalBody);
    modal.appendChild(modalFooter);
    modalFooter.appendChild(okBtn);
    modalFooter.appendChild(closeBtn);

    document.body.appendChild(modal);

    // 儲存 callback 到 modal 元素上
    modal._onShown = Event.onShown;
    modal._onHidden = Event.onHidden;

    //顯示
    modal.style.display = 'block';
    if (typeof modal._onShown === 'function') modal._onShown(modal);

    // 拖曳功能
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    modalHeader.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = modal.getBoundingClientRect();
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