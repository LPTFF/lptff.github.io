function isPC() {
    const ua = navigator.userAgent;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isWeChat = /MicroMessenger/i.test(ua);
    const hasMouse = window.matchMedia('(pointer: fine)').matches;
    const isWideScreen = window.innerWidth >= 1024;
    // 条件组合判断：非移动UA + 非微信 + 有鼠标 + 宽屏
    return !isMobileUA && !isWeChat && hasMouse && isWideScreen;
}
function gotoOutPage(url) {
    // 判断是否为 PC
    let result = isPC();
    if (result) {
        window.open(url, '_blank');
    } else {
        window.location.href = url;
    }
}
async function initEruda() {
    try {
        if (window.eruda) {
            window.eruda.init();
            return;
        }
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/eruda';
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
        window.eruda && window.eruda.init();
    } catch (error) {
        console.log('initEruda', error);
    }
}

export { isPC, gotoOutPage, initEruda }
