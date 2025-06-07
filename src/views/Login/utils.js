// src/views/Login/utils.js
export function getQueryString(name) {
    const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`);
    const match = window.location.search.substr(1).match(reg);
    return match ? unescape(match[2]) : '';
}

export function setWebCookie(data, lToken, returnURL) {
    try {
        if (data && lToken) {
            const params = { fund_trade_trackid: data, LToken: lToken, ReturnURL: returnURL };
            const encoded = btoa(JSON.stringify(params));
            if (location.origin.includes('login.1234567.com.cn')) {
                location.href = `https://fundpclogin.eastmoney.com/middlepage.html?c=${encoded}`;
            } else {
                location.href = `https://fundpclogin.eastmoney.com/middlepage.html?c=${encoded}`;
            }
        } else {
            location.href = 'https://trade.1234567.com.cn/';
        }
    } catch (error) {
        location.href = 'https://trade.1234567.com.cn/';
    }
}