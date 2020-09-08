import { Hive } from "../Plugins/Hive";

namespace AppsListBackupRestoreTest {
    class LauncherApp {
        onInit() {
            // TODO: "executeIfOlderThanNMinutes" could be replaced with a better "redis-like" mechanism later
            // instead of polling
            DataSyncHelper.executeIfOlderThanNMinutes("installedapps", 120, (completion: cb) => {
                let myProvider = await hiveHelper.getPersonalVault();
                myProvider.database.findMany("installedapps", (apps)=>{
                    if (apps) {
                        // - Delete each local app that is not in remote apps
                        // - install each remote app that is not installed on device
                    }
                    completion()
                })
            });
        }

        installApp(packageId) {
            appManager.installApp(packageId)

            // TODO: Hive helper? or DataSyncHelper? Or HivePlugin ?
            hiveHelper.queuedUpsert("installedapps", {appid: "xxxx"}); // Queuing done by serializing everything to a local file
        }

        deleteApp() {
            appManager.uninstallApp(packageId)
            hiveHelper.queuedDelete("installedapps", {appid: "xxxx"}); // Queuing done by serializing everything to a local file
        }
    }
}