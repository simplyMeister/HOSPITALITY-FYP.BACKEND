/**
 * EcoTrack E2EE Utility
 * Uses Web Crypto API (AES-GCM) for browser-native encryption.
 */

const ALGO = 'AES-GCM';

/**
 * Encrypts a plain text string using a base64 encoded key.
 */
export async function encryptMessage(text, base64Key) {
    try {
        if (!text || !base64Key) return text;

        const keyBuffer = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
        const key = await crypto.subtle.importKey('raw', keyBuffer, ALGO, false, ['encrypt']);

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encodedText = new TextEncoder().encode(text);

        const ciphertext = await crypto.subtle.encrypt(
            { name: ALGO, iv },
            key,
            encodedText
        );

        // Combine IV and ciphertext for storage (IV is needed for decryption)
        const combined = new Uint8Array(iv.length + ciphertext.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(ciphertext), iv.length);

        return btoa(String.fromCharCode(...combined));
    } catch (e) {
        console.error("Encryption failed:", e);
        return text; // Fallback to plain text on error
    }
}

/**
 * Decrypts a base64 encoded ciphertext using a base64 encoded key.
 */
export async function decryptMessage(base64Cipher, base64Key) {
    try {
        if (!base64Cipher || !base64Key) return base64Cipher;

        const keyBuffer = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
        const key = await crypto.subtle.importKey('raw', keyBuffer, ALGO, false, ['decrypt']);

        const combined = Uint8Array.from(atob(base64Cipher), c => c.charCodeAt(0));
        const iv = combined.slice(0, 12);
        const ciphertext = combined.slice(12);

        const decrypted = await crypto.subtle.decrypt(
            { name: ALGO, iv },
            key,
            ciphertext
        );

        return new TextDecoder().decode(decrypted);
    } catch (e) {
        // If decryption fails, it might be a legacy plain text message
        return base64Cipher;
    }
}
