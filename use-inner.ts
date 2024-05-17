import 'dotenv/config';

const PACKAGE_ID = process.env.PACKAGE_ID!;
const WRAPPER = process.env.WRAPPER!;

import { Keypair } from '@mysten/sui.js/cryptography';
import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Secp256k1Keypair } from '@mysten/sui.js/keypairs/secp256k1';
import { Secp256r1Keypair } from '@mysten/sui.js/keypairs/secp256r1';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { fromB64 } from '@mysten/bcs';
import { execSync } from 'child_process';
import * as fs from 'fs';

type KeytoolListEntry = {
    alias: string,
    suiAddress: string,
    publicBase64Key: string,
    keyScheme: string,
    flag: number,
    peerId?: string | null
};

export function getKeypairFromKeystore(): Keypair {

    const output = execSync("sui keytool list --json", { encoding: 'utf-8' });
    const activeAddress = execSync("sui client active-address", { encoding: 'utf-8' }).trim();

    const entries: KeytoolListEntry[] = JSON.parse(output);
    let index = entries.findIndex((entry: KeytoolListEntry) => {
        return entry.suiAddress === activeAddress;
    });
    if (index === -1) {
        throw new Error(`Keypair not found in keytool list`);
    }
    const keyScheme = entries[index].keyScheme;

    const secretKeyB64 = JSON.parse(fs.readFileSync(process.env.HOME + '/.sui/sui_config/sui.keystore', 'utf8'))[index];
    const secretKey = fromB64(secretKeyB64).slice(1)
    switch (keyScheme) {
        case "secp256k1":
            return Secp256k1Keypair.fromSecretKey(secretKey);
        case "secp256r1":
            return Secp256r1Keypair.fromSecretKey(secretKey);
        case "ed25519":
            return Ed25519Keypair.fromSecretKey(secretKey);
        default:
            throw new Error(`Unsupported key scheme: ${keyScheme}`);
    }
}

async function useInnerRef() {
    const client = new SuiClient({url: "http://127.0.0.1:9000"});
    const keypair = getKeypairFromKeystore();

    const txb = new TransactionBlock();
    const innerRef = txb.moveCall({
        target: `${PACKAGE_ID}::contract::inner`,
        arguments: [
            txb.object(WRAPPER)
        ]
    });

    txb.moveCall({
        target: `${PACKAGE_ID}::contract::use_inner_ref`,
        arguments: [
            innerRef
        ]
    });

    const resp = await client.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        signer: keypair,
        options: {
            showEffects: true
        },
        requestType: 'WaitForLocalExecution'
    });
    console.log(resp);
}

useInnerRef();
