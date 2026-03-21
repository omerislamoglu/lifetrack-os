import Foundation
import Capacitor
import WidgetKit

/**
 WidgetDataPlugin - Saves app data to UserDefaults (App Groups) for iOS widgets
 */
@objc(WidgetDataPlugin)
public class WidgetDataPlugin: CAPPlugin {
  
  let appGroupIdentifier = "group.lifetrack.widgets"
  
  /**
   Save widget data to UserDefaults with App Groups
   */
  @objc func saveWidgetDataToUserDefaults(_ call: CAPPluginCall) {
    guard let defaults = UserDefaults(suiteName: appGroupIdentifier) else {
      call.reject("App Group unavailable for widget data")
      return
    }
    
    // Extract values from call data
    if let streak = call.getInt("widget_streak") {
      defaults.set(streak, forKey: "widget_streak")
    }
    
    if let progress = call.getInt("widget_daily_progress") {
      defaults.set(progress, forKey: "widget_daily_progress")
    }
    
    if let focusTime = call.getString("widget_focus_time") {
      defaults.set(focusTime, forKey: "widget_focus_time")
    }
    
    if let weeklyHours = call.getInt("widget_weekly_hours") {
      defaults.set(weeklyHours, forKey: "widget_weekly_hours")
    }

    if let mood = call.getString("widget_mood") {
      defaults.set(mood, forKey: "widget_mood")
    }

    if let todosJson = call.getString("widget_todos_json") {
      defaults.set(todosJson, forKey: "widget_todos_json")
    }

    if let weeklyTrendJson = call.getString("widget_weekly_trend_json") {
      defaults.set(weeklyTrendJson, forKey: "widget_weekly_trend_json")
    }

    if let accentColor = call.getString("widget_accent_color") {
      defaults.set(accentColor, forKey: "widget_accent_color")
    }
    
    defaults.synchronize()

    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
    
    call.resolve()
  }
  
  /**
   Get widget data from UserDefaults
   */
  @objc func getWidgetData(_ call: CAPPluginCall) {
    guard let defaults = UserDefaults(suiteName: appGroupIdentifier) else {
      call.resolve([
        "widget_streak": 0,
        "widget_daily_progress": 0,
        "widget_focus_time": "25:00",
        "widget_weekly_hours": 0,
        "widget_mood": "🙂",
        "widget_todos_json": "[]",
        "widget_weekly_trend_json": "[]",
        "widget_accent_color": "#f97316"
      ])
      return
    }
    
    var result: [String: Any] = [:]
    result["widget_streak"] = defaults.integer(forKey: "widget_streak")
    result["widget_daily_progress"] = defaults.integer(forKey: "widget_daily_progress")
    result["widget_focus_time"] = defaults.string(forKey: "widget_focus_time") ?? "25:00"
    result["widget_weekly_hours"] = defaults.integer(forKey: "widget_weekly_hours")
    result["widget_mood"] = defaults.string(forKey: "widget_mood") ?? "🙂"
    result["widget_todos_json"] = defaults.string(forKey: "widget_todos_json") ?? "[]"
    result["widget_weekly_trend_json"] = defaults.string(forKey: "widget_weekly_trend_json") ?? "[]"
    result["widget_accent_color"] = defaults.string(forKey: "widget_accent_color") ?? "#f97316"
    
    call.resolve(result)
  }
}
