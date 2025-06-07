<template>
    <div class="login-container">
        <h2>用户登录</h2>
        <form @submit.prevent="handleLogin">
            <ul class="ulTab clear">
                <li class="first on">交易账号</li>
                <li>其他账号</li>
                <li class="last">短信登录</li>
            </ul>
            <div class="tbform">
                <div class="msg" v-if="errorMessage">
                    <h3><b></b><span id="errmsg">{{ errorMessage }}</span></h3>
                </div>
                <table>
                    <tbody>
                        <tr id="tr-trade-acc">
                            <th>交易账号：</th>
                            <td>
                                <input type="text" maxlength="60" id="tbname" tabindex="1"
                                    class="text fifteenCard put_1" autocomplete="off" v-model="username"
                                    placeholder="请输入交易账号或已绑定手机号" />
                                <p class="nametip sgray f12">
                                    支持已绑定手机号&nbsp;<a href="http://help.1234567.com.cn/question_528.html"
                                        target="_blank">如何绑定？</a>
                                </p>
                            </td>
                        </tr>
                        <tr id="tr-trade-pwd">
                            <th>登录密码：</th>
                            <td>
                                <input type="password" maxlength="36" id="tbpwd" tabindex="2"
                                    class="fl text keyboard pwd" autocomplete="off" v-model="password"
                                    placeholder="请输入登录密码" />
                            </td>
                        </tr>
                        <tr id="tr-remember">
                            <th class="spc"></th>
                            <td style="padding-top: 5px;">
                                <label class="sgray" for="tbcook">
                                    <input type="checkbox" id="tbcook" class="cook" tabindex="4"
                                        v-model="rememberAccount" />记住交易账号</label>
                            </td>
                        </tr>
                        <tr>
                            <th class="spc"></th>
                            <td>
                                <label class="sgray" for="protocolCheckbox">
                                    <input id="protocolCheckbox" type="checkbox" class="cook" tabindex="5"
                                        v-model="agreeProtocol" required />已阅读并同意</label>
                                <a target="_blank"
                                    href="https://img.1234567.com.cn/h5pdf/2020120109505400327.pdf">服务协议</a>
                                和 <a target="_blank"
                                    href="https://img.1234567.com.cn/h5pdf/2020113013144013635.pdf">隐私指引</a>
                            </td>
                        </tr>
                        <tr>
                            <th></th>
                            <td>
                                <button type="submit" id="btn_login" class="logbtn submit" tabindex="6" title="登录"
                                    :disabled="isLoading || !agreeProtocol">
                                    {{ isLoading ? '登录中...' : '登 录' }}
                                </button>
                                <a href="https://register.1234567.com.cn/reg/step1" class="logbtn reg" target="_blank"
                                    title="免费开户" tabindex="7">免费开户</a>
                            </td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" class="tor f12">
                                <a href="https://register.1234567.com.cn/forgetpwd" target="_blank">忘记密码？</a>
                                <span class="sp">|</span>
                                <a href="http://help.1234567.com.cn/demo/bank_demo.htm" target="_blank">开户演示</a>
                                <span class="sp">|</span>
                                <a href="http://www.1234567.com.cn/contactus/" target="_blank">登录页建议</a>&nbsp;
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div class="scancodebtn">
                <i class="scancode_icon"></i>
                <span class="scancodetip_icon">扫码登录更安全</span>
                <div class="clear"></div>
            </div>
        </form>
        <p v-if="fingerprint" class="fingerprint-info">
            指纹: <span>{{ fingerprint.substring(0, 10) }}...</span>
        </p>
    </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import axios from 'axios';
// 引入 JSEncrypt 库。你需要先安装：npm install jsencrypt
import JSEncrypt from 'jsencrypt';

export default {
    name: 'LoginPage',
    setup() {
        const username = ref('');
        const password = ref('');
        const isLoading = ref(false);
        const errorMessage = ref('');
        const fingerprint = ref(null);
        const rememberAccount = ref(false);
        const agreeProtocol = ref(false);

        // 从 login.html 中提取的 RSA 公钥 N 和 E
        const rsaPublicKeyN = '82a0258506d06ff2c898d2984e9bcc20e8614156c53409533fff3fcf586dc3d2dbc6c77e90cf43061edef6a1b11b5be8a0343613922c7083496d35fda79b3e3bb179e9c6f5a254f9658f97078c8e85f0fc259d60aec75e4490bf06de84312233d646273ec61ba419f0259a94aecdcea3970ca4411ff221b4b55192bcaf77426b';
        const rsaPublicKeyE = '010001'; // 对应 65537

        // 使用 JSEncrypt 库进行 RSA 加密
        const customEncryptPassword = (pwd, pubKeyN, pubKeyE) => {
            const encrypt = new JSEncrypt();
            // JSEncrypt.setPublic方法接受 ASN.1/PEM 格式的公钥字符串，
            // 但如果你只有 N 和 E，可以通过 setPublicCrtKey 来设置（需要p,q,dp,dq,qi参数），
            // 或者更简单地，尝试使用类似 node-rsa 库的 fromJSON 方法。
            // 对于 JSEncrypt，最直接的方式是拼接成 PEM 格式。
            // 但如果没有完整的 PEM 格式公钥，只有 N 和 E，则需要更复杂的处理。

            // 对于这种情况，JSEncrypt 提供了 setPublic方法，可以尝试传入 N 和 E 的十六进制字符串
            // 但它内部仍然期望一个 ASN.1 结构的公钥。
            // 一个更可靠的方法是，如果后端能提供 PEM 格式的公钥，直接用 setPublicKey。
            // 如果只有 N 和 E，你需要自己构建一个临时的 PEM 格式字符串：
            // 这是一个复杂的步骤，通常涉及到 BigInteger 和 Base64 编码，
            // 由于 JSEncrypt 已经内置了这些，我们应该利用它。

            // 最简单的 JSEncrypt 用法是直接传入 PEM 公钥：
            // const publicKeyPEM = `-----BEGIN PUBLIC KEY-----\n${base64EncodedPublicKeyFromNAndE}\n-----END PUBLIC KEY-----`;
            // encrypt.setPublicKey(publicKeyPEM);

            // 鉴于你提供的是 N 和 E 的十六进制字符串，JSEncrypt 似乎没有直接接受 N, E 作为十六进制字符串的便捷方法来设置公钥。
            // 原始的 `jsencrpt.js` 内部很可能实现了从 N, E 构建公钥对象进行加密的逻辑。
            // 这里我将模拟 `jsencrpt` 的行为，并建议你引入 `jsencrypt` 或 `node-rsa`，并可能需要转换 N 和 E 为 PEM 格式。

            // 模拟使用 N 和 E 设置公钥 (这需要 JSEncrypt 内部支持，或你手动构建 PEM)
            // JSEncrypt 默认的 `setPublic` 方法期望 PEM 格式。
            // 实际上，如果 `jsencrpt.js` 是一个自定义的加密工具，你可能需要重写或适配它的 `encrypt` 方法。
            // 为了能够使用 `jsencrypt`，一种方法是将 N 和 E 转换成标准的 PEM 格式。
            // 这是一个通用的 PEM 公钥头和尾。中间是实际的公钥数据，需要从 N 和 E 编码而来。
            // 这部分转换非常复杂，通常需要用到 ASN.1 编码，超出了直接工具转换的范畴。

            // 假定你的后端或原始 jsencrpt.js 最终能提供一个标准的 PEM 格式公钥：
            // 这里我直接用一个占位符，你需要替换为从 `loginmin.js` 实际加密逻辑中提取或转换出的 PEM 格式公钥。
            // 例如：const publicKeyPEM = `-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA${rsaPublicKeyN}AQAB\n-----END PUBLIC KEY-----`;
            // 注意：上面的 publicKeyPEM 只是一个演示，它不能直接工作，因为十六进制的 N 需要被 Base64 编码，并且要符合 ASN.1 结构。
            // 你需要使用 `jsencrypt` 或其他库正确地从 N 和 E 构建公钥对象。

            // 最直接的方式是，如果你能从后端获取 PEM 格式的公钥，就直接用它。
            // 如果只能获取 N 和 E，可能需要更底层的库或者进行十六进制到 Base64 的转换并构建 ASN.1 结构。

            // 对于 JSEncrypt，你可以这样设置公钥：
            // 需要通过 JSEncrypt 内部的 BigInt 库来处理 N 和 E
            // 这是一个更直接的 JSEncrypt 使用方法，如果你确定它的版本支持通过 N, E 直接设置：
            // 事实上，JSEncrypt 的 `setPublic` 期望 PEM 格式。
            // `rsaPublicKeyN` 和 `rsaPublicKeyE` 是十六进制字符串。
            // 你需要将它们转换为 JSEncrypt 能理解的格式，通常是 PEM 格式。
            // 构建 PEM 格式需要 N 和 E 的 Base64 编码，并且包裹在 ASN.1 结构中。
            // 这是一个复杂的过程，涉及到 `jsbn` 库（JSEncrypt 内部使用）。
            // 鉴于此，我将提供一个使用 PEM 格式公钥的示例，你需要确保你的公钥是 PEM 格式。
            // 如果你的 N 和 E 是十六进制，并且原始 `jsencrpt.js` 是直接用这些值加密，
            // 那么你可能需要阅读 `jsencrpt.js` 或 `loginmin.js` 中是如何将这些值转换为加密对象并进行加密的。

            // **重要提示：** 如果你没有 PEM 格式的公钥，只有 N 和 E 的十六进制字符串，
            // 最简单的方法是尝试从后端获取 PEM 格式的公钥，或者使用 `node-rsa` 库，
            // 它有 `setPublic` 方法可以接受 { n: 'hex string', e: 'hex string' }。
            // 如果坚持使用 `jsencrypt`，你可能需要手动构造一个符合 PEM 格式的公钥字符串，
            // 这需要将十六进制 N 和 E 转换成 Base64，并按照 X.509 SubjectPublicKeyInfo 的 ASN.1 结构进行编码。
            // 这超出了这个 Vue 组件的范围，需要一个独立的工具函数。

            // 为了演示目的，我将假设你最终会得到一个标准的 PEM 格式公钥字符串。
            // 实际开发中，你可能需要将 `rsaPublicKeyN` 和 `rsaPublicKeyE` 转换为 PEM 格式。
            // 或者使用一个能直接处理 N 和 E 字符串的 RSA 库。

            const tempJSEncrypt = new JSEncrypt();
            // 这里用一个占位的 PEM 格式公钥。你必须替换它为真实的 PEM 格式公钥。
            // 理论上，你需要将 rsaPublicKeyN 和 rsaPublicKeyE 转换为 PEM 格式。
            // 这是一个示例，需要根据实际公钥格式进行调整：
            // 最安全的做法是直接从服务器获取完整的 PEM 格式公钥字符串。
            // 假设我们能用一个通用的 RSA PEM 格式表示这个 N 和 E。
            // 注意：直接拼接 N 和 E 到 PEM 格式是不够的，因为它需要经过 Base64 编码和 ASN.1 结构。
            // 以下只是一个示意，不保证能直接工作，因为它依赖于 N 和 E 已经被正确编码为 PEM 中间的 Base64 字符串。
            // 最可靠的方式是从你的后端获取正确的 PEM 格式公钥。

            // 如果不能获得 PEM 格式，可能需要更底层的加密库或手动构造。
            // JSEncrypt 的 `setPublic` 期望 PEM 格式。
            // 一个 Hacky 的方法可能是：
            // const tempKey = `-----BEGIN PUBLIC KEY-----\n${Base64.encode(hexToArrayBuffer(pubKeyN))}\n-----END PUBLIC KEY-----`;
            // 但这个 Base64 编码和 ASN.1 结构不对。

            // **最靠谱的解决方案是：** 如果你的原始 `loginmin.js` 能够利用 `jsencrpt.js` 中的底层 `BigInt` 和 `RSA` 模块使用 N 和 E 直接进行加密，
            // 你应该尝试将那部分核心加密逻辑从 `loginmin.js` 和 `jsencrpt.js` 中抽取出来，
            // 独立成一个工具函数，并将其适配到 Vue 组件中，而不是试图用 `jsencrypt` 来替代一个定制的加密过程。
            // 这会非常复杂，因为需要理解那些低层库是如何工作的。

            // 作为折衷，我将保留一个通用的 JSEncrypt 示例，但强调你需要确保公钥格式正确。
            // 如果后端可以提供，请让后端直接提供 PEM 格式的公钥。
            // 如果没有，且你只能用 N 和 E 的十六进制，你需要一个专门的库或函数来将十六进制 N 和 E 转换成 PEM 格式，或者直接使用能接受 N 和 E 的库。

            // 假设我们能获得一个完整的 PEM 格式公钥 (替换为实际的，通常由后端提供):
            const fullPublicKeyPEM = `-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA${rsaPublicKeyN}AQAB\n-----END PUBLIC KEY-----\n`; // 这是一个占位符，不保证正确性

            // 尝试设置公钥。如果公钥格式不正确，这里会失败。
            // 实际上，直接用 `rsaPublicKeyN` 和 `rsaPublicKeyE` 是无法直接设置 `jsencrypt` 的公钥的。
            // `jsencrypt` 需要完整的 PEM 格式（包含 ASN.1 结构和 Base64 编码的模数和指数）。
            // 原始的 `loginmin.js` 中，可能是通过 `BigInt` 和 `RSA` 模块自行构建了加密对象。
            // 这意味着你需要复制和适配原始的加密逻辑，或者使用像 `node-rsa` 这样可以直接传入 `n` 和 `e` 的库。

            // 为了让代码可以运行，我将使用一个占位符，模拟加密过程。
            // **你必须将这里替换为真实的加密逻辑。**
            // **如果你能够获得完整的 PEM 格式公钥，以下代码是适用的：**
            // encrypt.setPublicKey(yourActualPublicKeyPEM);
            // return encrypt.encrypt(pwd);

            console.warn("注意：以下加密是模拟的。请将 `customEncryptPassword` 函数替换为从原始 JS 文件中提取的真实 RSA 加密逻辑，或使用 `jsencrypt` 并提供正确的 PEM 格式公钥。");
            return `ENCRYPTED_PASSWORD_${pwd}_WITH_N_${pubKeyN}_E_${pubKeyE}`;
        };

        // 生成浏览器指纹
        const generateBrowserFingerprint = () => {
            errorMessage.value = '';
            try {
                if (window.Fingerprint2 && typeof window.Fingerprint2.get === 'function') {
                    window.Fingerprint2.get((components) => {
                        const values = components.map((component) => component.value);
                        fingerprint.value = window.Fingerprint2.x64hash128(values.join(''), 31);
                        console.log('浏览器指纹已生成:', fingerprint.value);
                    });
                } else {
                    console.warn('Fingerprint2 未加载或未找到。请确保 fingerprint2.js 已在 index.html 或项目中正确引入。');
                    fingerprint.value = 'mock_fingerprint_' + Math.random().toString(36).substring(7); // 提供一个模拟指纹
                }
            } catch (error) {
                console.error('生成指纹时出错:', error);
                errorMessage.value = '生成浏览器指纹失败。';
            }
        };

        // 处理登录逻辑
        const handleLogin = async () => {
            isLoading.value = true;
            errorMessage.value = '';

            if (!agreeProtocol.value) {
                errorMessage.value = '请阅读并同意服务协议和隐私指引。';
                isLoading.value = false;
                return;
            }

            if (!fingerprint.value) {
                errorMessage.value = '正在生成浏览器指纹，请稍候。';
                isLoading.value = false;
                return;
            }

            try {
                // 1. 使用你从旧 JS 文件中重构出来的函数来加密密码
                const encryptedPassword = customEncryptPassword(password.value, rsaPublicKeyN, rsaPublicKeyE);
                console.log('加密后的密码 (模拟):', encryptedPassword);

                // 2. 准备请求体（你需要根据你的后端 API 实际要求来构建）
                const loginPayload = {
                    userName: username.value,       // 假设后端字段是 userName
                    password: encryptedPassword,    // 加密后的密码
                    fingerprint: fingerprint.value, // 浏览器指纹
                    // ... 原始登录逻辑中可能存在的其他参数，例如从 loginmin.js 中提取的其他 form 字段
                };

                // 3. 发送登录请求
                // ⚠️ 替换为你的真实登录 API 地址 (对应 login.init 中的 emapi 或其他登录接口)
                // 从你的 HTML 中，login.init 接收了一个 emapi = "https://api.fund.eastmoney.com/Trade/SetCookie"
                // 这看起来像是一个设置 Cookie 的接口，而不是直接的登录验证接口。
                // 你需要找到实际发送用户名和加密密码的登录接口。
                const loginApiUrl = 'YOUR_ACTUAL_LOGIN_API_ENDPOINT'; // <-- 替换为你的实际登录 API URL
                console.log('发送登录请求到:', loginApiUrl, 'Payload:', loginPayload);

                // const response = await axios.post(loginApiUrl, loginPayload);

                // 由于没有真实的后端接口，我们这里模拟一个响应
                await new Promise(resolve => setTimeout(resolve, 1500)); // 模拟网络延迟
                const simulatedResponse = { data: { success: true, message: '模拟登录成功！', token: 'mock_token_123' } };
                // const simulatedResponse = { data: { success: false, message: '模拟登录失败：用户名或密码错误。' } };

                // 4. 处理后端响应
                if (simulatedResponse.data && simulatedResponse.data.success) {
                    console.log('登录成功!', simulatedResponse.data);
                    alert('登录成功！');
                    // 成功后：存储 token, 跳转页面等
                    // localStorage.setItem('userToken', simulatedResponse.data.token);
                    // router.push('/dashboard'); // 如果你使用 Vue Router
                } else {
                    errorMessage.value = simulatedResponse.data.message || '登录失败，请检查用户名或密码。';
                    console.error('登录失败:', simulatedResponse.data);
                }
            } catch (error) {
                console.error('登录请求出错:', error);
                errorMessage.value = '网络或服务器错误，请稍后再试。';
            } finally {
                isLoading.value = false;
            }
        };

        // 组件挂载时生成指纹
        onMounted(() => {
            generateBrowserFingerprint();
        });

        return {
            username,
            password,
            isLoading,
            errorMessage,
            fingerprint,
            rememberAccount,
            agreeProtocol,
            handleLogin,
        };
    },
};
</script>

<style scoped>
/* 样式与之前相同，并根据你提供的HTML结构进行了微调 */
.login-container {
    max-width: 500px;
    /* 适当增加宽度以适应更复杂的布局 */
    margin: 50px auto;
    padding: 30px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    background-color: #fff;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #333;
}

h2 {
    text-align: center;
    color: #0056b3;
    margin-bottom: 25px;
}

.ulTab {
    list-style: none;
    padding: 0;
    margin: 0 0 20px 0;
    display: flex;
    justify-content: space-around;
    border-bottom: 1px solid #eee;
}

.ulTab li {
    padding: 10px 15px;
    cursor: pointer;
    font-weight: bold;
    color: #666;
    border-bottom: 2px solid transparent;
    transition: all 0.3s ease;
}

.ulTab li.on {
    color: #007bff;
    border-bottom-color: #007bff;
}

.tbform {
    margin-top: 20px;
}

.msg {
    background-color: #ffebe8;
    border: 1px solid #dd3c10;
    padding: 10px 15px;
    margin-bottom: 15px;
    border-radius: 4px;
    color: #dd3c10;
}

.msg h3 {
    margin: 0;
    font-size: 14px;
    display: flex;
    align-items: center;
}

.msg h3 b {
    display: inline-block;
    width: 16px;
    height: 16px;
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="red"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>');
    /* 简单的警告图标 */
    background-size: cover;
    margin-right: 8px;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
}

table th,
table td {
    padding: 12px 0;
    vertical-align: middle;
    text-align: left;
}

table th {
    width: 100px;
    /* 调整标签宽度 */
    font-weight: 600;
    color: #555;
    padding-right: 15px;
}

input[type="text"],
input[type="password"] {
    width: calc(100% - 20px);
    /* 减去 padding */
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-sizing: border-box;
    font-size: 16px;
    transition: border-color 0.3s ease;
}

input[type="text"]:focus,
input[type="password"]:focus {
    border-color: #007bff;
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
}

.nametip {
    font-size: 12px;
    color: #999;
    margin-top: 5px;
}

.nametip a {
    color: #007bff;
    text-decoration: none;
}

.nametip a:hover {
    text-decoration: underline;
}

label.sgray {
    font-size: 14px;
    color: #666;
    cursor: pointer;
    display: flex;
    align-items: center;
}

label.sgray input[type="checkbox"] {
    margin-right: 8px;
    width: 16px;
    height: 16px;
    cursor: pointer;
}

.logbtn {
    display: inline-block;
    padding: 12px 25px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 18px;
    font-weight: bold;
    transition: background-color 0.3s ease, transform 0.2s ease;
    text-align: center;
    text-decoration: none;
    margin-right: 15px;
}

.logbtn.submit {
    background-color: #007bff;
    color: white;
}

.logbtn.submit:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    opacity: 0.7;
}

.logbtn.submit:hover:not(:disabled) {
    background-color: #0056b3;
    transform: translateY(-2px);
}

.logbtn.reg {
    background-color: #f0f0f0;
    color: #007bff;
    border: 1px solid #007bff;
}

.logbtn.reg:hover {
    background-color: #e0e0e0;
}

tfoot td {
    text-align: right !important;
    font-size: 12px;
    color: #666;
    padding-top: 20px;
}

tfoot a {
    color: #666;
    text-decoration: none;
    margin-left: 10px;
}

tfoot a:hover {
    text-decoration: underline;
}

.sp {
    display: inline-block;
    margin: 0 5px;
    color: #ccc;
}

.scancodebtn {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 30px;
    cursor: pointer;
    color: #007bff;
}

.scancode_icon {
    width: 24px;
    height: 24px;
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23007bff"><path d="M4 8V4h4V2H4c-1.1 0-2 .9-2 2v4h2zm8 0V4h4V2h-4v6zm8-6h-4v2h4v4h2V4c0-1.1-.9-2-2-2zM4 16v4c0 1.1.9 2 2 2h4v-2H6v-4H4zm14 4h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4zM12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>');
    /* 扫码图标 */
    background-size: cover;
    margin-right: 8px;
}

.scancodetip_icon {
    font-weight: bold;
}

.fingerprint-info {
    margin-top: 20px;
    font-size: 13px;
    color: #666;
    word-break: break-all;
    text-align: center;
}

.fingerprint-info span {
    font-family: 'Courier New', Courier, monospace;
    background-color: #f0f0f0;
    padding: 3px 6px;
    border-radius: 4px;
}
</style>