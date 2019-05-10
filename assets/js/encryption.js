const secretbox = nacl.secretbox;
const randomBytes = nacl.randomBytes;
const decodeUTF8 = nacl.util.decodeUTF8;
const encodeUTF8 = nacl.util.encodeUTF8;
const encodeBase64 = nacl.util.encodeBase64;
const decodeBase64 = nacl.util.decodeBase64;

const newNonce = () => randomBytes(secretbox.nonceLength);

const generateKey = () => encodeBase64(randomBytes(secretbox.keyLength));

const pbkdf = async (p) => {
  let bytes = (new TextEncoder()).encode(p);
  return new Uint8Array(await kdf(bytes,262144));
}

export const kdf = async (bytes, rounds)=>{
  console.debug("before: ",bytes);
  let start = performance.now();
  while(rounds-- > 0){
    bytes = nacl.hash(bytes);
    //bytes = await window.crypto.subtle.digest("SHA-512",bytes);
  }
  let end = performance.now();
  let elapsed = end - start;
  console.debug(`kdf: ${elapsed}ms`);
  console.debug("after: ",bytes);
  return bytes;
}

const encrypt = (json, key) => {
  console.log("Encrypting ",json," with ",key);
  let keyUint8Array;
  if(typeof key == "string"){
    keyUint8Array = decodeBase64(key);
  }else{
    keyUint8Array = key;
  }
  if(keyUint8Array.length > secretbox.keyLength){
    keyUint8Array = keyUint8Array.slice(0,secretbox.keyLength);
  }
  console.log("key length is ",keyUint8Array.length);
  const nonce = newNonce();
  const messageUint8 = decodeUTF8(JSON.stringify(json));
  const box = secretbox(messageUint8, nonce, keyUint8Array);

  const fullMessage = new Uint8Array(nonce.length + box.length);
  fullMessage.set(nonce);
  fullMessage.set(box, nonce.length);

  const base64FullMessage = encodeBase64(fullMessage);
  return base64FullMessage;
};

const decrypt = (messageWithNonce, key) => {
  let keyUint8Array;
  if(typeof key == "string"){
    keyUint8Array = decodeBase64(key);
  }else{
    keyUint8Array = key;
  }
  if(keyUint8Array.length > secretbox.keyLength){
    keyUint8Array = keyUint8Array.slice(0,secretbox.keyLength);
  }
  const messageWithNonceAsUint8Array = decodeBase64(messageWithNonce);
  const nonce = messageWithNonceAsUint8Array.slice(0, secretbox.nonceLength);
  const message = messageWithNonceAsUint8Array.slice(
    secretbox.nonceLength,
    messageWithNonce.length
  );

  const decrypted = secretbox.open(message, nonce, keyUint8Array);

  if (!decrypted) {
    throw new Error("Could not decrypt message");
  }

  const base64DecryptedMessage = encodeUTF8(decrypted);
  return JSON.parse(base64DecryptedMessage);
};

export const crypto = {
  secretbox : secretbox,
  randomBytes : randomBytes,
  decodeUTF8 : decodeUTF8,
  encodeUTF8 : encodeUTF8,
  decodeBase64 : decodeBase64,
  encodeBase64 : encodeBase64,
  decrypt : decrypt,
  encrypt : encrypt,
  pbkdf : pbkdf,
  kdf : kdf,
  generateKey : generateKey,
  subtle : window.crypto.subtle
}
