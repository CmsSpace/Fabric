function toolboxInit(_Envent) {
    const toolbox = document.getElementById(_Envent.bodyid);
    const _darg = document.getElementById(_Envent.dargid || _Envent.bodyid);

    let dragging = false;
    let offsetX = 0, offsetY = 0;
    const SNAP_DISTANCE = 50; // 吸附距離
    const _canvasmain = document.getElementById('canvas-main');
    _darg.addEventListener('mousedown', e => {
        dragging = true;
    });
    _darg.ondblclick = () => {
        dragging = false;
        if (toolbox.classList == "layer-draggable") {
            toolbox.classList.remove('layer-draggable');
            toolbox.classList.add('sidebar-right');
            _canvasmain.style.flexDirection = 'row';  //flex-direction
        };
    };
    _darg.addEventListener('mousedown', e => {
        //dragging = true;
        offsetX = e.clientX - toolbox.offsetLeft;
        offsetY = e.clientY - toolbox.offsetTop;
    });

    window.addEventListener('mousemove', e => {
        if (!dragging) return;

        let x = e.clientX - offsetX;
        let y = e.clientY - offsetY;

        // // 限制在視窗範圍內
        // x = Math.max(0, Math.min(x, window.innerWidth - toolbox.offsetWidth));
        // y = Math.max(0, Math.min(y, window.innerHeight - toolbox.offsetHeight));

        toolbox.style.left = x + 'px';
        toolbox.style.top = y + 'px';
        toolbox.style.right = ''; // 清除 Dock 模式  
        toolbox.classList.add('layer-draggable');
        toolbox.classList.remove('sidebar-right');
    });

    window.addEventListener('mouseup', e => {
        if (!dragging) return;
        dragging = false;
        //toolbox.style.transition = 'all 0.25s ease';

        const midX = window.innerWidth / 2;
        const boxCenter = toolbox.offsetLeft + toolbox.offsetWidth / 2;

        // Dock 左側
        if (boxCenter < midX && toolbox.offsetLeft < SNAP_DISTANCE) {
            toolbox.classList.remove('layer-draggable');
            toolbox.classList.add('sidebar-right');
            _canvasmain.style.flexDirection = 'row-reverse';  //flex-direction
        }
        // Dock 右側
        else if (boxCenter >= midX &&
            window.innerWidth - (toolbox.offsetLeft + toolbox.offsetWidth) < SNAP_DISTANCE) {
            toolbox.classList.remove('layer-draggable');
            toolbox.classList.add('sidebar-right');
            _canvasmain.style.flexDirection = 'row';  //flex-direction
        }
        if (typeof _Envent.onmouseup === 'function') {
            _Envent.onmouseup();
        }
    });

    // // 視窗大小改變時保持 Dock 高度
    // window.addEventListener('resize', () => {
    //     if (toolbox.classList.contains('docked')) {
    //         toolbox.style.height = '100vh';
    //     }
    // });
}
