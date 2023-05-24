import axios from 'axios';
async function getRequestGet(url, param) {
    let data = '';
    param && param.length && param.length == 0 ? param : {};
    try {
        const response = await axios.get(url, param); // 发起 GET 请求
        data = response.data; // 获取响应数据
        // 在这里可以对获取到的数据进行处理或使用
    } catch (error) {
        console.error('Error fetching data:', error);
    }
    return data
}
async function getRequestPost(url, param) {
    let data = '';
    param && param.length && param.length == 0 ? param : {};
    try {
        const response = await axios.post(url, param); // 发起 GET 请求
        data = response.data; // 获取响应数据
        // 在这里可以对获取到的数据进行处理或使用
    } catch (error) {
        console.error('Error fetching data:', error);
    }
    return data
}
async function getRequestHead(url, param) {
    let data = '';
    param && param.length && param.length == 0 ? param : {};
    try {
        const response = await axios.head(url, param); // 发起 GET 请求
        data = response.data; // 获取响应数据
        // 在这里可以对获取到的数据进行处理或使用
    } catch (error) {
        console.error('Error fetching data:', error);
    }
    return data
}
export { getRequestGet, getRequestPost, getRequestHead } 
