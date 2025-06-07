// src/views/Login/encrypt.js
import { RSAKeyPair, encrypt as rsaEncrypt } from './RSA'; // Adjust path to RSA module

export function encrypt(exponent, modulus, data) {
    setMaxDigits(129); // Ensure setMaxDigits is defined or imported
    const key = new RSAKeyPair(exponent, '', modulus);
    return rsaEncrypt(key, data);
}