function isPC() {
    const ua = navigator.userAgent;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isMobileClient = navigator.userAgentData?.mobile === true;
    // iPadOS 的桌面 UA 会伪装成 Mac，但仍支持多点触控。
    const isIPadDesktopUA = /Macintosh|MacIntel/i.test(`${ua} ${navigator.platform || ''}`)
        && navigator.maxTouchPoints > 1;
    // 窗口宽度、鼠标类型和微信标识都不能单独决定设备是否为移动端。
    return !isMobileUA && !isMobileClient && !isIPadDesktopUA;
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
