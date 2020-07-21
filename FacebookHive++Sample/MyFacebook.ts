import { Hive } from "./Hive";
import { DIDSDK } from "./DID";

// TODO: DB maintenance/changes: rename/remove/add/migrate collection fields...
    // Need a deep study how of to do this in mongo, and provide an api that can to it too.
// TODO: no matter where we store uploaded files, we probably need quotas. Then what happen after quotas are reached, 
// or disk is full, on user's vault or friend's vault? How to cleanup the mess?
    // Could we have a human readable description or context (+deletable yes/no) attached to each db  entry or file? So that users 
    // know what can be cleaned up
// TODO: CLI publish dapp use case: how to publish a public EPK? As dapps need to authenticate to write data on hive, which
    // dapp is writing?
    // elastOS would need its own app on the id chain, so that runtime backup or EPKs can be published in that scope?
        // or should it be the app store app that stores the EPK?
        // Standard ref:
        // - hive://myprovider-mydid-dappstoreappdid/scripts/getEPK ?

namespace MyFacebookTest1 {
    namespace MyFacebook {
        class SentFriendRequest {
            id?: string; // mongo entry id
            name: string; // friend name
            targetDID: string; // DID of the requested friend
            requestDate: number; // request timestamp
            acceptedDate?: number; // date at which the invitation was accepted by the friend
        }

        class ReceivedFriendRequest {
            id?: string; // mongo entry id
            name: string; // friend name
            requesterDID: string; // DID of the requesting friend
            requestDate: number; // request timestamp
        }

        class Friend {
            isBlocked: boolean;

            constructor(public did: string, public name: string) {}
        }

        class Group {
            id?: string;

            constructor(public name: string) {}
        }

        class Message {
            id?: string;

            constructor(public content: string, public groupVisibilityId: string) {}
        }

        class FriendGroupPair {
            constructor(public friendDID: string, public groupId: string) {}
        }

        type Comment = {
            friendDID: string;      // DID of the friend publishing the comment
            messageId: string;        // ID of the related message in the MESSAGES collection
            message: string;        // Comment raw text
            // Standard reference to the attached comment picture, on another storage location
            // A file reference cannot be access directly, except by the vault owner. A vault must be called for this.
            picture?: Hive.ResourceRef;
        }

        class PrivateMessage {
            id?: string;
            date: number;

            constructor(public fromDID: string, public toDID: string, public message: string) {}
        }

        class App {
            static FRIENDS_COLLECTION_NAME = "friends";
            static GROUPS_COLLECTION_NAME = "groups";
            static FRIENDS_GROUPS_COLLECTION_NAME = "friendsgroups";
            static SENT_FRIEND_REQUESTS_COLLECTION_NAME = "sentfriendrequests";
            static RECEIVED_FRIEND_REQUESTS_COLLECTION_NAME = "receivedfriendrequests";
            static MESSAGES_COLLECTION_NAME = "messages";
            static COMMENTS_COLLECTION_NAME = "comments";
            static PRIVATE_MESSAGES_COLLECTION_NAME = "privatemessages";

            myDID: string;
            myProvider: Hive.SelfVaultProvider;

            // Setup
            async initialize() {
                this.myDID = await DIDSDK.DIDStore.getMyDID();
                this.myProvider = new Hive.SelfVaultProvider();

                this.myProvider.acl.registerSubCondition("callerIsAFriend",
                    new Hive.Database.ACL.QueryHasResultsCondition(App.FRIENDS_COLLECTION_NAME, {
                        did: "$callerdid"
                    })
                );

                this.myProvider.acl.registerSubCondition("callerCanReadCommentMessage",
                    // Either the message is group-private and caller must be in one of the groups,
                    // or the message must be public
                    new Hive.Conditions.OrCondition([
                        // Message is public?
                        // null group visibility id means "public"
                        new Hive.Database.ACL.QueryHasResultsCondition(App.MESSAGES_COLLECTION_NAME, { id: "$params.messageId", groupVisibilityId: null }),
                        // Message is group private?
                        new Hive.Conditions.AndCondition([
                            // Find groups in which the caller is
                            new Hive.Database.ACL.QueryHasResultsCondition(App.FRIENDS_GROUPS_COLLECTION_NAME, { friendDID: "$callerdid" }, { projectionName: "friendGroups" }),
                            // Make sure the message with id messageId matches caller's groups
                            new Hive.Database.ACL.QueryHasResultsCondition(App.MESSAGES_COLLECTION_NAME, {
                                id: "$params.messageId",
                                groupVisibilityId: { $in: "$friendGroups" }
                            })
                        ])
                    ])
                );

                // This sequence is executed on the backend side, so we have a more secure context
                this.myProvider.scripts.setScript("onFriendInvitationAccepted", [
                    // Retrieve the sent request
                    new Hive.Database.Executables.FindQuery(App.SENT_FRIEND_REQUESTS_COLLECTION_NAME, {
                        did:"$callerdid"       // this is serializable
                    }),
                    // Add friend to friends list
                    new Hive.Database.Executables.InsertQuery(App.FRIENDS_COLLECTION_NAME, {
                        did:"$callerdid",       // this is serializable
                        name: "$prev.name",     // Get friend's "name" from the previous executable in this sequence
                        customValue: "$params.customValue"    // this is serializable
                    }),
                    // Remove from sent requests
                    new Hive.Database.Executables.DeleteQuery(App.SENT_FRIEND_REQUESTS_COLLECTION_NAME, {
                        targetDID:"$callerdid",       // this is serializable
                    }),

                    // NOTE: as we have "executables", we could imagine to also have simple non-database executions here,
                    // such as a basic file copy, send an email notification, etc. That could help creating some kind of restricted server side execution code?
                ]);

                this.myProvider.scripts.setScript("sendFriendInvitation", [
                    new Hive.Database.Executables.InsertQuery(App.RECEIVED_FRIEND_REQUESTS_COLLECTION_NAME, {
                        name: "$params.name",
                        requesterDID: "$callerdid",
                        requestDate: "$now" // Special keyword to get the current date. TODO: should be allow to eval() simple JS code here instead?
                    }),
                ]);

                // We want to allow only our friends to view our friends list
                this.myProvider.scripts.setScript("getFriendsList",
                    // Data query:
                    [
                        new Hive.Database.Executables.FindQuery(App.FRIENDS_COLLECTION_NAME)
                    ],
                    // Access condition(s):
                    // Caller must already be one of our friends to be able to see our friends list
                    new Hive.Database.ACL.SubCondition("callerIsAFriend")
                );

                this.myProvider.scripts.setScript("getMessages",
                    // Data query:
                    [
                        // Get groups in which the friend is
                        new Hive.Database.FindQuery(App.FRIENDS_GROUPS_COLLECTION_NAME, {
                            friendId: "$callerdid"
                        }), // FriendGroupPair
                        new Hive.Database.Executables.FindQuery(App.MESSAGES_COLLECTION_NAME, {
                            groupVisibilityId: {
                                $in: "$prev.groupId" // Array of group ID (group type) to which this user belongs. Pure mongo syntax
                            }
                        })
                    ]
                );

                this.myProvider.scripts.setScript("addComment", [
                    new Hive.Database.Executables.InsertQuery(App.COMMENTS_COLLECTION_NAME, {
                        friendDID: "$callerdid",
                        message: "$params.message",
                        messageId: "$params.messageId",
                        picture: "$params.picture", // Picture has been automatically streamed, saved to disk and converted to a reference
                        requestDate: "$now"
                    })],
                    // Access condition(s):
                    new Hive.Conditions.AndCondition ([
                        new Hive.Database.ACL.SubCondition("callerCanReadCommentMessage"),

                        // Rate limitating: the same friend is not allowed to write more than 5 comments per minute.
                        new Hive.QoS.Conditions.CallsPerMinuteCondition("add_comment_$callerdid", 5)
                    ])
                );

                // From a picture reference, streams the related file
                this.myProvider.scripts.setScript("getCommentPicture", [
                        // Retrieve the comment from the id
                        new Hive.Database.FindQuery(App.FRIENDS_GROUPS_COLLECTION_NAME, {
                            friendId: "$callerdid"
                        }), // FriendGroupPair
                        new Hive.File.Executables.FileStreamer("$prev.picture")
                    ],
                    // Access condition(s):
                    new Hive.Database.ACL.SubCondition("callerCanReadCommentMessage")
                );

                this.myProvider.scripts.setScript("sendPrivateMessage", [
                    new Hive.Database.Executables.InsertQuery(App.PRIVATE_MESSAGES_COLLECTION_NAME, {
                        fromDID: "$callerdid",
                        toDID: "$userdid",
                        message: "$params.message",
                        date: "$now"
                    }),
                    // Access condition(s):
                    new Hive.Database.ACL.SubCondition("callerIsAFriend")
                ]);

                this.myProvider.scripts.setScript("editPrivateMessage", [
                    new Hive.Database.Executables.UpdateQuery(App.PRIVATE_MESSAGES_COLLECTION_NAME, {
                        fromDID: "$callerdid", // Make sure the friend can edit only its own messages, not fake someone else's
                        id: "$params.id"
                    }, {
                        $set: {
                            message: "$params.message" // Save the new message
                        }
                    })
                ]);

                this.initializeDatabase();
            }

            initializeDatabase() {
                // Create collections
                this.myProvider.database.createCollectionIfNotExists(App.FRIENDS_COLLECTION_NAME, {
                    // Optional mongo schema format here to be able to define default field values
                    id: "string",
                    isBlocked: {type:"boolean", default: false},
                    did: "string",
                    name: "string"
                })
                this.myProvider.database.createCollectionIfNotExists(App.SENT_FRIEND_REQUESTS_COLLECTION_NAME)
                this.myProvider.database.createCollectionIfNotExists(App.RECEIVED_FRIEND_REQUESTS_COLLECTION_NAME)
                this.myProvider.database.createCollectionIfNotExists(App.GROUPS_COLLECTION_NAME)
                this.myProvider.database.createCollectionIfNotExists(App.FRIENDS_GROUPS_COLLECTION_NAME)
                this.myProvider.database.createCollectionIfNotExists(App.MESSAGES_COLLECTION_NAME)
                this.myProvider.database.createCollectionIfNotExists(App.PRIVATE_MESSAGES_COLLECTION_NAME);

                // Mongo indexes - Examples only, not all indexes created
                this.myProvider.database.addIndex(App.FRIENDS_COLLECTION_NAME, {
                    did: 1
                });
                this.myProvider.database.addIndex(App.FRIENDS_COLLECTION_NAME, {
                    name: 1
                });
            }

            onDatabaseUpgrade(oldVersion, newVersion) {
            }

            // Friends management
            async getFriends(): Promise<Friend[]> {
                // Retrieve friends list
                return (await this.myProvider.database.findMany(new Hive.Database.FindQuery(App.FRIENDS_COLLECTION_NAME))) as Friend[];
            }

            async inviteFriend(friendDID: string, name: string) {
                let sentFriendRequest: SentFriendRequest = {
                    targetDID: this.myDID,
                    name: name,
                    requestDate: Date.now()
                };

                let receivedFriendRequest: ReceivedFriendRequest = {
                    requesterDID: this.myDID,
                    name: name,
                    requestDate: Date.now()
                };

                // Send invitation request to this friend, to his vault, then just wait for the friend to answer.
                let myFriendVaultProvider = await Hive.RemoteVaultProvider.resolveProvider(friendDID);
                myFriendVaultProvider.scripts.call("sendFriendInvitation", { name: name });

                // Save this invitation request locally to later be able to check that the friend is able to accept our invitation
                // and add himself as a friend
                await this.myProvider.database.insert(App.SENT_FRIEND_REQUESTS_COLLECTION_NAME, sentFriendRequest);
            }

            async getReceivedFriendRequests(): Promise<ReceivedFriendRequest[]> {
                return (await this.myProvider.database.findMany(new Hive.Database.FindQuery(App.RECEIVED_FRIEND_REQUESTS_COLLECTION_NAME))) as ReceivedFriendRequest[];
            }

            // We have received a friend invitation and we want to accept it
            async acceptFriend(friendRequest: ReceivedFriendRequest) {
                // Accepting a friend means adding him to our friends list, and letting him know that we 
                // accepted so he can also add us.

                // Add as a friend in our friends collection
                let friend = new Friend(friendRequest.requesterDID, friendRequest.name);
                await this.myProvider.database.insert(App.FRIENDS_COLLECTION_NAME, friend);

                // Remove the friend request entry
                await this.myProvider.database.delete(App.RECEIVED_FRIEND_REQUESTS_COLLECTION_NAME, {
                    id: friendRequest.id
                });

                // Notify the friend vault
                let myFriendVaultProvider = await Hive.RemoteVaultProvider.resolveProvider(friendRequest.requesterDID);
                myFriendVaultProvider.scripts.call("onFriendInvitationAccepted", {
                    customValue: "123"
                });
            }

            removeFriend(friendDID: string) {
                this.myProvider.database.delete(App.FRIENDS_COLLECTION_NAME, {
                    did: friendDID
                })
            }

            blockFriend(friendDID: string) {
                // Mark friend as blocked in my own friends collection
                this.myProvider.database.update(App.FRIENDS_COLLECTION_NAME, {
                    did: friendDID
                }, {
                    $set: {
                        isBlocked: true
                    }
                })
            }

            // Group management
            async createGroup(groupName: string) {
                let group = new Group(groupName);
                group.id = await this.myProvider.database.insert(App.GROUPS_COLLECTION_NAME, group);
            }

            async addFriendInGroup(friend: Friend, group: Group) {
                let friendGroupPair = new FriendGroupPair(friend.did, group.id);
                await this.myProvider.database.insert(App.FRIENDS_GROUPS_COLLECTION_NAME, friendGroupPair);
            }

            removeFriendFromGroup() {}

            // Changes which visibility group can see the message
            changeMessageGroup() {}

            // Posts management
            downloadFile() {}

            // Upload personal profile picture, to practice files
            async uploadProfilePicture(profilePictureBytes: string) {
                let fileRef = await this.myProvider.file.writeFile(new Hive.File.StreamableFile(profilePictureBytes))
            }

            // Posts a message on personal wall, and let this message be visible only by a specific group.
            async postMessage(messageContent: string, groupVisibility: Group) {
                let message = new Message(messageContent, groupVisibility.id);
                message.id = await this.myProvider.database.insert(App.MESSAGES_COLLECTION_NAME, message);
            }

            // Remotely get messages from a friend's vault. We will get only messages that we are able to see because
            // the messages collection ACL has been configured during creation.
            async getFriendMessages(friendDID: string): Promise<Message[]> {
                let myFriendVaultProvider = await Hive.RemoteVaultProvider.resolveProvider(friendDID);

                let messages = (await myFriendVaultProvider.scripts.call("getMessages")) as Message[];
                return messages;
            }

            // Posts a comment with picture about a friend's message.
            async postFriendMessageCommentWithPicture(commentMessage, friendDID, messageRef) {
                let myFriendVaultProvider = await Hive.RemoteVaultProvider.resolveProvider(friendDID);

                let fileData = "mypngpicturebytes";

                // Store the comment on my friend's vault.
                // The file is uploaded at the same time, like any other parameter, except that it uses a special
                // way to be uploaded.
                await myFriendVaultProvider.scripts.call("addComment", {
                    message: commentMessage,
                    messageId: messageRef,
                    picture: new Hive.File.StreamableFile(fileData) // We may use a special command here to reference streamable resources while calling scripts
                });
            }

            // Private messaging - practiced use case: row-based ACL (edit only a specific row)
            async sendPrivateMessage(message, friendDID) {
                // PMs must be stored both on the user vault and friend vault, as theire is no "owner" or the data.

                // Write to my own vault
                let pm = new PrivateMessage(this.myDID, friendDID, message);
                await this.myProvider.database.insert(App.PRIVATE_MESSAGES_COLLECTION_NAME, pm);

                // I'm allowed to write PMS directly there because the ACL allows friends to write to the PM collection
                let myFriendVaultProvider = await Hive.RemoteVaultProvider.resolveProvider(friendDID);
                await myFriendVaultProvider.scripts.call("sendPrivateMessage", {
                    message: pm.message
                });
            }

            // Editing a PM requires that we can edit a friend's PM entry
            async editPrivateMessage(messageId: string, newMessage: string) {
                // Edit to my own vault
                await this.myProvider.database.update(App.PRIVATE_MESSAGES_COLLECTION_NAME, {
                    id: messageId
                }, // PrivateMessage type
                {
                    message: newMessage
                });

                // Retrieve friend's did from message did
                // Note: just to practice hive. But this friendDID should be passed as parameter, no real need for a 
                // remote query here.
                let pm = await this.myProvider.database.findOne(new Hive.Database.FindQuery(App.PRIVATE_MESSAGES_COLLECTION_NAME, {
                    id: messageId
                })) as PrivateMessage;

                // Edit on my friend's vault
                let myFriendVaultProvider = await Hive.RemoteVaultProvider.resolveProvider(pm.fromDID);
                await myFriendVaultProvider.scripts.call("editPrivateMessage", {
                    id: messageId,
                    message: newMessage
                })
            }

            getAllPrivateMessages() {
                // Get the list of all private messages, but exclude the ones from blocked friends
                this.myProvider.database.findMany(new Hive.Database.AggregateQuery(App.PRIVATE_MESSAGES_COLLECTION_NAME, [
                    // NOTE: pseudo mongo aggregate, could contain mistakes, unchecked
                    {
                        $lookup: {
                            from: App.FRIENDS_COLLECTION_NAME, // Here we need to remap the collection name to an internal sandboxed name, for all mongo specific fields that can support collection names
                            localField: "did",          // friend field name in the Friends collection
                            foreignField: "fromDID",    // friend field name in the PM collection
                            as: "friend"
                        }
                    },
                    {
                        $match: {
                            friend: {
                                isBlocked: false
                            }
                        }
                    }
                ]))
            }

            deletePrivateMessage(messageId) {}
        }
    }

    /**
     * Real Facebook "group" =
     * - public
     * - friends
     * - friends "except" (exclude)
     * - specific friends (include)
     * - close friends
     */

     /*
    - file types:
        - personal backup (fully private)
        - comment picture from friend
        - personal profile picture (write) and public or friends (read)
    - upload:
        - check ACL
        - stream file bytes
        - save file to disk with a random unique name
        - maybe no need for a special "files" collection, now that we use vault script. We are protected by script conditions to read and write anyway
    */
}