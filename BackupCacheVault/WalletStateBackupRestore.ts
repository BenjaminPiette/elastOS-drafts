import { Hive } from "../Plugins/Hive";

// TODO: what if the wallet starts syncing if no vault connected, then connects to the vault later on?
//      local sync is 30% but remote was 100%?
//          --> sync from vault is one time question + only if vault.

namespace WalletStateBackupRestoreTest {
    class WalletApp {
        onInit() {
            // Every N minutes we check if there is a backup state file.
            // - Could be newer if another device has synced in between while this device was offline
            // - Could be the first time we reinstall the wallet
            DataSyncHelper.executeIfOlderThanNMinutes("spvsyncstate-walletaddress0", 120, (completion: cb) => {
                // - If user already has a vault, we may be able to resolve it
                // - If network issue,
                let syncDataInfo = myProvider.files.stat("spvsync-walletaddress0.txt");

                // More recent data on the vault: use that.
                if (syncDataInfo && syncDataInfo.lastModified > spvSdk.lastBlockSyncTime) {
                    spvSdk.stopSync();
                    let syncData = myProvider.files.downloadFile("spvsync-walletaddress0.txt");
                    if (syncData)
                        await spvSdk.writeSyncData(syncData)
                    spvSdk.startSync()
                }

                completion()
            });

            // Sync only every N minutes at most, to save bandwidth
            // Data too big to sync for every event
            DataSyncHelper.uploadAtMostEveryNMinutes("spvsyncstate-walletaddress0", 120, (completion: cb)=>{
                await myProvider.file.writeFile("spvsync-walletaddress0.txt", spvSyncData);
                completion()
            });
        }

        // Local sync progress
        onSyncProgress() {
            let myProvider = new Hive.SelfVaultProvider();

            // This item will be synced at next sync time as it has changed
            DataSyncHelper.contentHasChanged("spvsyncstate-walletaddress0");
        }
    }
}