export namespace DIDSDK {
    export class DIDDocument {
        getCredential(credentialName: string): Promise<any> {
            return Promise.resolve("anydata");
        }
    }

    export class DIDStore {
        static getMyDID(): Promise<string> {
            return Promise.resolve("did:elastos:mydid");
        }

        static resolveDidDocument(userDID: string): Promise<DIDDocument> {
            return Promise.resolve(new DIDDocument());
        }
    }
}

