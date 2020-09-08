import { Hive } from "../Plugins/Hive";

namespace GetFriendsListTest {
    class HyperIMApp {
        onInit() {
            friends: []
            CacheHelper.get("friendslist", (localFriendsList)=>{
                // Show local friends on UI
                ui.show(friends)
            }, remoteQuery:()=>{
                let results = Hive.Database.call()
                // Update local friends list
                friends = results
                ui.show(friends)
            });
        }

        insertFriend() {
            // Insert on vault, but should be blocking to make sure we don't loose friends (vaults is the primary storage here - not like for apps list)
            // Update cache / local list?
            // TODO: this means that if no vault, we get no friends management?
            // TODO: Need to decide? vault as primary storage, or local?
                // if local: not easy to sync
                // if vault: hard dependency on vault usage
            // Should we have a LocalVault implementation then sync/manage offline?
                // Ex: always save friends to vault helper, no matter if we have a vault or not
        }
    }
}