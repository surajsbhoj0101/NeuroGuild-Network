import { PinataSDK } from "pinata";
import dotenv from 'dotenv'

dotenv.config()

const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: "scarlet-naval-lizard-255.mypinata.cloud",
});

export async function uploadToIpfs(json) {
    try {
        const upload = await pinata.upload.public.json(json);
        const cid = upload.cid.toString();
        return cid;
        console.log(cid);
    } catch (error) {
        console.log("Error uploading file to ipfs",error);
    }
}

