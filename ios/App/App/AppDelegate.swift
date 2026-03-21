import UIKit
import Capacitor
import FirebaseCore
import WidgetKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        FirebaseApp.configure()
        return true
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let configuration = UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
        configuration.delegateClass = SceneDelegate.self
        configuration.storyboard = UIStoryboard(name: "Main", bundle: nil)
        return configuration
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
        syncWidgetData()
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
        syncWidgetData()
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    // MARK: - Widget Data Synchronization
    func syncWidgetData() {
        // Sync widget data from UserDefaults to App Groups
        let defaults = UserDefaults.standard
        let appGroupDefaults = UserDefaults(suiteName: "group.lifetrack.widgets") ?? UserDefaults.standard
        
        // Sync individual widget keys
        if let streak = defaults.value(forKey: "widget_streak") {
            appGroupDefaults.set(streak, forKey: "widget_streak")
        }
        
        if let progress = defaults.value(forKey: "widget_daily_progress") {
            appGroupDefaults.set(progress, forKey: "widget_daily_progress")
        }
        
        if let focusTime = defaults.value(forKey: "widget_focus_time") {
            appGroupDefaults.set(focusTime, forKey: "widget_focus_time")
        }
        
        if let weeklyHours = defaults.value(forKey: "widget_weekly_hours") {
            appGroupDefaults.set(weeklyHours, forKey: "widget_weekly_hours")
        }

        if let mood = defaults.value(forKey: "widget_mood") {
            appGroupDefaults.set(mood, forKey: "widget_mood")
        }

        if let todos = defaults.value(forKey: "widget_todos_json") {
            appGroupDefaults.set(todos, forKey: "widget_todos_json")
        }

        if let weeklyTrend = defaults.value(forKey: "widget_weekly_trend_json") {
            appGroupDefaults.set(weeklyTrend, forKey: "widget_weekly_trend_json")
        }

        if let accentColor = defaults.value(forKey: "widget_accent_color") {
            appGroupDefaults.set(accentColor, forKey: "widget_accent_color")
        }
        
        appGroupDefaults.synchronize()

        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
    }

}
