// Generated by typings
// Source: https://raw.githubusercontent.com/types/npm-jsonwebtoken/756a6f6b0c599f6f3c9c20183e118f15a8b641cf/index.d.ts
declare module 'jsonwebtoken' {

export type Algorithm = 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512' | 'ES256' | 'ES384' | 'ES512' | 'none';

export interface SignOptions {

    /**
     * Signature algorithm. Could be one of these values :
     *
     *   alg  | Digital Signature or MAC Algorithm
     * -------|------------------------------------
     *  HS256 | HMAC using SHA-256 hash algorithm
     *  HS384 | HMAC using SHA-384 hash algorithm
     *  HS512 | HMAC using SHA-512 hash algorithm
     *  RS256 | RSASSA using SHA-256 hash algorithm
     *  RS384 | RSASSA using SHA-384 hash algorithm
     *  RS512 | RSASSA using SHA-512 hash algorithm
     *  ES256 | ECDSA using P-256 curve and SHA-256 hash algorithm
     *  ES384 | ECDSA using P-384 curve and SHA-384 hash algorithm
     *  ES512 | ECDSA using P-521 curve and SHA-512 hash algorithm
     *  none  | No digital signature or MAC value included
     */
    algorithm?: Algorithm;

    /** Lifetime for the token expressed in a string describing a time span [rauchg/ms](https://github.com/rauchg/ms.js). Eg: `60`, `"2 days"`, `"10h"`, `"7d"` */
    expiresIn?: string | number;

    notBefore?: string | number;
    audience?: string;
    subject?: string;
    issuer?: string;
    jwtid?: string;
    noTimestamp?: boolean;
    header?: Object;
}

export interface VerifyOptions {

    algorithms?: Algorithm[];
    audience?: string;
    issuer?: string;
    jwtid?: string;
    ignoreExpiration?: boolean;
    ignoreNotBefore?: boolean;
    subject?: string;

    /** number of second to tolerate when checking the `nbf` and `exp` claims, to deal with small clock differences among different servers */
    clockTolerance?: number;
}

export interface DecodeOptions {
    json?: boolean;
    complete?: boolean;
}

/**
 * Sign the given payload into a JSON Web Token string
 *
 * @param payload            Payload to sign, could be an literal, buffer or string
 * @param secretOrPrivateKey Either the secret for HMAC algorithms, or the PEM encoded private key for RSA and ECDSA.
 * @param options            Options for the signature
 * @returns The signed token
 */
export function sign(payload: string | Buffer | Object, secretOrPrivateKey: string | Buffer, options?: SignOptions): string;

/**
 * Asynchronously sign the given payload into a JSON Web Token string
 *
 * @param payload            Payload to sign, could be an literal, buffer or string
 * @param secretOrPrivateKey Either the secret for HMAC algorithms, or the PEM encoded private key for RSA and ECDSA.
 * @param options            Options for the signature
 * @param callback           Callback to get the encoded token on
 * @returns The signed token
 */
export function sign(payload: string | Buffer | Object, secretOrPrivateKey: string | Buffer, callback: (err: Error, jwt?: string) => any): void;
export function sign(payload: string | Buffer | Object, secretOrPrivateKey: string | Buffer, options: SignOptions, callback: (err: Error, jwt?: string) => any): void;

/**
 * Synchronously verify given token using a secret or a public key to get a decoded token
 *
 * @param token             JWT string to verify
 * @param secretOrPublicKey Either the secret for HMAC algorithms, or the PEM encoded public key for RSA and ECDSA.
 * @param options           Options for the verification
 * @returns The decoded token.
 */
export function verify(token: string, secretOrPublicKey: string | Buffer, options?: VerifyOptions): any;

/**
 * Asynchronously verify given token using a secret or a public key to get a decoded token
 * @param token             JWT string to verify
 * @param secretOrPublicKey Either the secret for HMAC algorithms, or the PEM encoded public key for RSA and ECDSA.
 * @param options           Options for the verification
 * @param callback          Callback to get the decoded token on
 */
export function verify(token: string, secretOrPublicKey: string | Buffer, callback: (err: Error, payload: any) => any): void;
export function verify(token: string, secretOrPublicKey: string | Buffer, options: VerifyOptions, callback: (err: Error, payload: any) => any): void;

/**
 * Returns the decoded payload without verifying if the signature is valid.
 * @param token JWT string to decode
 * @returns The decoded Token
 */
export function decode(token: string, options?: DecodeOptions): any;

export class JsonWebTokenError extends Error {
    name: string;
    message: string;
}

export class NotBeforeError extends JsonWebTokenError {
    date: Date;
}

export class TokenExpiredError extends JsonWebTokenError {
    expiredAt: Date;
}
}
