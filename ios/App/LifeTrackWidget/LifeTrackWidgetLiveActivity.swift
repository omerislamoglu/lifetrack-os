//
//  LifeTrackWidgetLiveActivity.swift
//  LifeTrackWidget
//
//  Created by Ömer İslamoğlu on 20.03.2026.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct LifeTrackWidgetAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var emoji: String
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}

struct LifeTrackWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: LifeTrackWidgetAttributes.self) { context in
            // Lock screen/banner UI goes here
            VStack {
                Text("Hello \(context.state.emoji)")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom \(context.state.emoji)")
                    // more content
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T \(context.state.emoji)")
            } minimal: {
                Text(context.state.emoji)
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }
}

extension LifeTrackWidgetAttributes {
    fileprivate static var preview: LifeTrackWidgetAttributes {
        LifeTrackWidgetAttributes(name: "World")
    }
}

extension LifeTrackWidgetAttributes.ContentState {
    fileprivate static var smiley: LifeTrackWidgetAttributes.ContentState {
        LifeTrackWidgetAttributes.ContentState(emoji: "😀")
     }
     
     fileprivate static var starEyes: LifeTrackWidgetAttributes.ContentState {
         LifeTrackWidgetAttributes.ContentState(emoji: "🤩")
     }
}

#Preview("Notification", as: .content, using: LifeTrackWidgetAttributes.preview) {
   LifeTrackWidgetLiveActivity()
} contentStates: {
    LifeTrackWidgetAttributes.ContentState.smiley
    LifeTrackWidgetAttributes.ContentState.starEyes
}
