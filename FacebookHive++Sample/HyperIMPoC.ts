import { Hive } from "./Hive";
import { DIDSDK } from "./DID";

namespace HyperTest {
    namespace HyperIM {
        class Group extends Hive.JSONObject {
            id?: string;

            constructor(public name: string) {
                super();
            }
        }

        class Friend extends Hive.JSONObject {
            constructor(public name: string, public did: string) {
                super();
            }
        }

        class Message extends Hive.JSONObject {
            id?: string;

            constructor(public content: string, public groupVisibilityId: string) {
                super();
            }
        }

        class App {
            static GROUPS_COLLECTION_NAME = "groups";
            static GROUP_MESSAGES_COLLECTION_NAME = "messages";

            myDID: string;
            myProvider: Hive.SelfVaultProvider;

            // Setup
            async initialize() {
                this.myDID = await DIDSDK.DIDStore.getMyDID();
                this.myProvider = new Hive.SelfVaultProvider();

                this.myProvider.scripts.registerSubCondition("userInGroup",
                    /**
                     * Serialized in json:
                     * {
                     *      "type":"queryhasresults",
                     *      "collection":"groups",
                     *      "query": id, friends... 
                     * }
                     */
                    new Hive.Database.ACL.QueryHasResultsCondition(App.GROUPS_COLLECTION_NAME, {
                        id: "$groupid", // $groupid is passed by the calling script
                        friends: {
                            $contains: "$callerdid" // Forgot the right mongo syntax here.
                        }
                    })
                );

                this.myProvider.scripts.setScript("getGroupMessages",
                    // Data query:
                    [
                        new Hive.Database.Executables.FindQuery(App.GROUP_MESSAGES_COLLECTION_NAME, {
                            id: "$groupid"
                        })
                    ],
                    // Access condition:
                    new Hive.Conditions.SubCondition("userInGroup") // Only users in a group can view group messages
                );

                // Let external users access my groups list.
                // For now we make it simple, no friends management. In reality we may need to check if
                // the caller is already a friend of ours before letting view our groups list.
                this.myProvider.scripts.setScript("getGroups",
                    // Data query:
                    [
                        // Just get all groups
                        new Hive.Database.Executables.FindQuery(App.GROUPS_COLLECTION_NAME, {
                        })
                    ],
                    // Access condition:
                    // None
                );

                this.myProvider.scripts.setScript("addGroupMessage", [
                    new Hive.Database.Executables.InsertQuery(App.GROUP_MESSAGES_COLLECTION_NAME, {
                        groupid: "$groupid",
                        friendDID: "$callerdid",
                        message: "$params.message",
                        requestDate: "$now"
                    })],
                    // Access condition(s):
                    new Hive.Conditions.AndCondition ([
                        new Hive.Conditions.SubCondition("userInGroup") // Only users in a group can post group messages
                    ])
                );

                this.initializeDatabase();
            }

            initializeDatabase() {
                // Create collections
                this.myProvider.database.createCollectionIfNotExists(App.GROUPS_COLLECTION_NAME)
                this.myProvider.database.createCollectionIfNotExists(App.GROUP_MESSAGES_COLLECTION_NAME)
            }

            // We ourself create a group and we are owner of that group.
            // We must add users ourselves to the group for them to be allowed to get the content (choice
            // made for this demo code, but this could be done differently)
            async createGroup(groupName: string): Promise<Group> {
                let group = new Group(groupName);
                group.id = await this.myProvider.database.insert(App.GROUPS_COLLECTION_NAME, group);
                return group;
            }

            // Get groups created by the given friend
            async getFriendSGroups(friend: Friend): Promise<Group[]> {
                let myFriendVaultProvider = await Hive.RemoteVaultProvider.resolveProvider(friend.did);
                return await myFriendVaultProvider.scripts.call("getGroups") as Group[];
            }

            // Called by the group owner, after getting a request from his friend to join the group.
            async addFriendInGroup(friend: Friend, group: Group) {
                await this.myProvider.database.update(App.GROUPS_COLLECTION_NAME, {
                    id: group.id
                }, {
                    // Mongo: to update only those fields, not overwrite everything
                    "$set": {
                        friends: {
                            "$push": friend.did // Forgot the real mongo syntax here - we just want to append one friend to the existing list.
                        }
                    }
                });
            }

            // Owner posts to his own group
            async postMessageInOneOfMyGroups(messageContent: string, group: Group) {
                let message = new Message(messageContent, group.id);
                message.id = await this.myProvider.database.insert(App.GROUP_MESSAGES_COLLECTION_NAME, message);
            }

            // I post a message to a friend's group. I need to call a script for this, no direct db access
            async postMessageInAFriendSGroup(friend: Friend, group: Group, messageContent: string) {
                let myFriendVaultProvider = await Hive.RemoteVaultProvider.resolveProvider(friend.did);
                return await myFriendVaultProvider.scripts.call("addGroupMessage", {
                    groupid: group.id,
                    message: messageContent
                }) as Message[];
            }

            async getFriendSGroupMessages(friend: Friend, group: Group): Promise<Message[]> {
                let myFriendVaultProvider = await Hive.RemoteVaultProvider.resolveProvider(friend.did);
                return await myFriendVaultProvider.scripts.call("getGroupMessages", {
                    groupid: group.id
                }) as Message[];
            }
        }
    }
}

