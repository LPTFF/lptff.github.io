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
        const response = await axios.post(url, param);
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
function isPC() {
    // 判断是否为 PC
    return !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
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
import eruda from 'eruda';
function initEruda() {
    try {
        eruda.init();
    } catch (error) {
        console.log('initEruda', error);
    }
}

import { Configuration, OpenAIApi } from "openai";
async function generateText(prompt) {
    console.log('js', prompt);
    const messages = [
        { role: "system", content: "You are a helpful assistant" },
        { role: "user", content: `${prompt}` }
    ];
    let openaiKey = "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";
    const configuration = new Configuration({
        apiKey: openaiKey,
    });
    configuration.baseOptions.headers = {
        Authorization: "Bearer " + `${openaiKey}`,
    };
    const openai = new OpenAIApi(configuration);
    const response = await openai.createChatCompletion({
        messages,
        model: "gpt-3.5-turbo",
    });
    console.log(response.data.choices[0].message.content);
    return response.data.choices[0].message.content
}
export { getRequestGet, getRequestPost, getRequestHead, isPC, gotoOutPage, initEruda, generateText } 
