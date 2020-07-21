import { DIDSDK } from "./DID";

export namespace Hive {
    // Any object, but made of string keys and any values
    // Ex: myObj["aKey"] = anyValue
    type StringIndexableObject = {
        [k:string]:any
    };

    // Make sure all classes that inherit from this are serializable to JSON, because they are going to be
    // Deserialized and executed remotely later (conditions, acl).
    class Serializable {
        serialize(): string {
            return "";
        }
    }

    // Ex: did:elastos:userdid-did:elastos:appdid-fileref
    export class ResourceRef extends String {
    }

    export namespace Conditions {
        export class Condition extends Serializable {}

        export class NoCondition extends Condition {}

        // At least one condition in the list must pass, to get this condition pass
        export class OrCondition extends Condition {
            constructor(private conditions: Condition[]) {
                super();
            }
        }

        // All conditions in the list must pass, to get this condition pass
        export class AndCondition extends Condition {
            constructor(public conditions: Condition[]) {
                super();
            };
        }
    }

    export namespace ACL {
        export class ACLManager {
            constructor(private provider: VaultProviderBase) {}
            registerSubCondition(conditionName: string, condition: Hive.Conditions.Condition) {}
        }
    }

    export namespace QoS {
        export namespace Conditions {
            // No more than N calls per second.
            // The refKey is used here to let the backend remember keys and timestamps for a while, so later it can
            // check when were the latest calls.
            export class CallsPerMinuteCondition extends Hive.Conditions.Condition {
                constructor(private refKey: string, private maxCallsPerMinute: number) {
                    super();
                }
            }
        }
    }

    export namespace File {
        export class File {
            ref: ResourceRef;
        }

        export class StreamableFile {
            // TODO: make sure to make it easy to use stream here, and no big buffer allocation anywhere
            //  - in app, trinity plugin or native.
            constructor(private bytes: string) {}
            private uploadChunks() {}
        }

        export class FileManager {
            constructor(private provider: VaultProviderBase) {}

            // Friends could be allowed to upload files to a user's vault, depending on the application.
            // But each uploaded file is sandboxed for that friend did, to make sure it does not conflict with
            // other friends files.
            writeFile(stream: StreamableFile, fileRef?: string): Promise<File> {
                return Promise.resolve(new File());
            }

            readFile(fileRef: string): ReadableStream { return null; }

            // NOTE: we may not want to provide a way to list disk folders directly. Instead, rely on database
            // queries for this.
        }

        export namespace Executables {
            export class FileStreamer {
                constructor(private fileRed: string) {}
            }
        }
    }

    export namespace Database {
        // Database specific conditions
        export namespace ACL {
            // The given find query must return at least 1 result to pass
            export class QueryHasResultsCondition extends Hive.Conditions.Condition {
                constructor(collectionName: string, public findQueryFields?: StringIndexableObject, public options?: { projectionName: string }) {
                    super();
                }
            }

            // The parameters passed to the query must match the given fields and values (mongo format)
            export class ParameterCondition extends Hive.Conditions.Condition {
                constructor(public paramFieldsCheck: StringIndexableObject) {
                    super();
                }
            }

            export class SubCondition extends Hive.Conditions.Condition {
                constructor(private subConditionName: string) {
                    super();
                }
            }
        }

        export class DBManager {
            constructor(private provider: VaultProviderBase) {}

            findOne(findQuery: Database.FindQuery | Database.AggregateQuery): Promise<StringIndexableObject> {
                return Promise.resolve([]);
            }

            findMany(findQuery: Database.FindQuery | Database.AggregateQuery): Promise<StringIndexableObject[]> {
                return Promise.resolve([]);
            }
        }

        export class SelfDBManager extends DBManager {
            createCollectionIfNotExists(collectionName: string, collectionSchema?: StringIndexableObject) {
            }

            addIndex(collectionName: string, indexFields: StringIndexableObject) {
            }

            // By default if no acl provided, only the owner is allow to use this entry.
            insert(collectionName: string, insertedEntry: StringIndexableObject): Promise<string> {
                return Promise.resolve("insertedId");
            }

            update(collectionName: string, matchQuery: StringIndexableObject, updateQuery: StringIndexableObject) {
                return Promise.resolve([]);
            }

            delete(collectionName: string, deletedEntry: StringIndexableObject) {
            }
        }

        export class Query {
            constructor(public collectionName: string) {}
        }

        export class FindQuery extends Query {
            constructor(collectionName: string, public queryFields?: StringIndexableObject) {
                super(collectionName);
            }
        }

        export class AggregateQuery extends Query {
            constructor(collectionName: string, public aggregates?: StringIndexableObject[]) {
                super(collectionName);
            }
        }

        export namespace Executables {
            export class FindQuery {
                constructor(private collectionName: String, private findQuery?: StringIndexableObject) {}
            }

            export class InsertQuery {
                constructor(private collectionName: String, private insertQuery: StringIndexableObject) {}
            }

            export class UpdateQuery {
                constructor(private collectionName: String, private matchQuery: StringIndexableObject, private updateQuery: StringIndexableObject) {}
            }

            export class DeleteQuery {
                constructor(private collectionName: String, private deleteQuery: StringIndexableObject) {}
            }
        }
    }

    export namespace VaultScripting {
        export class Executable {
        }

        export class VaultScriptingManager {
            constructor(private provider: VaultProviderBase) {}

            setScript(functionName: string, executionSequence: Executable[], accessCondition?: Hive.Conditions.Condition) {}

            call(functionName: string, params?: StringIndexableObject): Promise<StringIndexableObject> { return Promise.resolve({}); }
        }
    }

    class VaultProviderBase {
        address: string; // Vault provider carrier or http address
        file: File.FileManager;
        scripts: VaultScripting.VaultScriptingManager;

        constructor() {
            this.file = new File.FileManager(this);
            this.scripts = new VaultScripting.VaultScriptingManager(this);
        }
    }

    // Helper to resolve vaults, authenticate with vaults.
    export class RemoteVaultProvider extends VaultProviderBase {
        constructor() {
            super();
        }

        static async resolveProvider(userDID: string): Promise<RemoteVaultProvider> {
            let userDidDocument = await DIDSDK.DIDStore.resolveDidDocument(userDID);

            let provider = new RemoteVaultProvider();
            provider.address = await userDidDocument.getCredential("hiveprovider");

            return provider;
        }

        // Resolved the provider of the currently signed in user
        static async resolveSelfProvider(): Promise<SelfVaultProvider> {
            let myDID = await DIDSDK.DIDStore.getMyDID();
            let userDidDocument = await DIDSDK.DIDStore.resolveDidDocument(myDID);

            let provider = new SelfVaultProvider();
            provider.address = await userDidDocument.getCredential("hiveprovider");

            return provider;
        }
    }

    export class SelfVaultProvider extends VaultProviderBase {
        database: Database.SelfDBManager;
        acl: ACL.ACLManager;

        constructor() {
            super();
            this.database = new Database.SelfDBManager(this);
            this.acl = new ACL.ACLManager(this);
        }
    }
}