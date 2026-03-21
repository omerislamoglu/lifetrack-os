import WidgetKit
import SwiftUI

private let widgetGroupIdentifier = "group.lifetrack.widgets"
private let widgetOrange = Color(red: 0.23, green: 0.51, blue: 0.96)
private let widgetOrangeSoft = Color(red: 0.02, green: 0.71, blue: 0.83)
private let widgetBackgroundTop = Color(red: 0.06, green: 0.09, blue: 0.16)
private let widgetBackgroundBottom = Color(red: 0.01, green: 0.03, blue: 0.09)
private let widgetCardBackground = Color.white.opacity(0.08)
private let widgetCardBorder = Color.white.opacity(0.10)

struct LifeTrackWidget: Widget {
  let kind: String = "LifeTrackWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Provider()) { entry in
      LifeTrackWidgetEntryView(entry: entry)
        .widgetURL(URL(string: "lifetrack://widgetlaunch"))
        .containerBackground(for: .widget) {
          Color.clear
        }
    }
    .configurationDisplayName("LifeTrack PRO")
    .description("Günlük hedef, mood, görevler ve haftalık ritim özeti.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    .contentMarginsDisabled()
  }
}

struct Provider: TimelineProvider {
  typealias Entry = SimpleEntry

  func placeholder(in context: Context) -> SimpleEntry {
    previewEntry
  }

  func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> Void) {
    completion(loadEntry())
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<SimpleEntry>) -> Void) {
    let entry = loadEntry()
    let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date().addingTimeInterval(900)
    completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
  }

  private func loadEntry() -> SimpleEntry {
    let payload = loadWidgetPayload()

    return SimpleEntry(
      date: Date(),
      streak: payload.streak,
      dailyProgress: payload.dailyProgress,
      focusTime: payload.focusTime,
      weeklyHours: payload.weeklyHours,
      mood: payload.mood,
      topTodos: payload.topTodos,
      weeklyTrend: payload.weeklyTrend
    )
  }

  private var previewEntry: SimpleEntry {
    SimpleEntry(
      date: Date(),
      streak: 9,
      dailyProgress: 72,
      focusTime: "18:45",
      weeklyHours: 14,
      mood: "🔥",
      topTodos: ["UI polish", "Workout plan"],
      weeklyTrend: [
        TrendPoint(label: "Pzt", score: 42),
        TrendPoint(label: "Sal", score: 58),
        TrendPoint(label: "Çar", score: 76),
        TrendPoint(label: "Per", score: 63),
        TrendPoint(label: "Cum", score: 81),
        TrendPoint(label: "Cmt", score: 55),
        TrendPoint(label: "Paz", score: 72)
      ]
    )
  }
}

struct SimpleEntry: TimelineEntry {
  let date: Date
  let streak: Int
  let dailyProgress: Int
  let focusTime: String
  let weeklyHours: Int
  let mood: String
  let topTodos: [String]
  let weeklyTrend: [TrendPoint]
}

struct TrendPoint: Codable, Hashable {
  let label: String
  let score: Int
}

private struct WidgetPayload {
  let streak: Int
  let dailyProgress: Int
  let focusTime: String
  let weeklyHours: Int
  let mood: String
  let topTodos: [String]
  let weeklyTrend: [TrendPoint]
}

struct LifeTrackWidgetEntryView: View {
  let entry: Provider.Entry
  @Environment(\.widgetFamily) var family

  var body: some View {
    switch family {
    case .systemSmall:
      SmallProgressWidget(entry: entry)
    case .systemMedium:
      MediumMoodWidget(entry: entry)
    case .systemLarge:
      LargeDashboardWidget(entry: entry)
    default:
      SmallProgressWidget(entry: entry)
    }
  }
}

private struct SmallProgressWidget: View {
  let entry: SimpleEntry

  var body: some View {
    WidgetSurface {
      GeometryReader { geometry in
        let ringSize = min(geometry.size.width, geometry.size.height) - 24
        let diameter = min(max(80, ringSize), 116)
        let lineWidth = min(max(8, diameter * 0.11), 12)

        VStack {
          Spacer(minLength: 0)

          CircularProgressRing(
            progress: entry.dailyProgress,
            diameter: diameter,
            lineWidth: lineWidth,
            valueFont: .system(size: 28, weight: .black, design: .rounded),
            captionFont: .system(size: 10, weight: .semibold, design: .rounded)
          )

          Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
      }
    }
  }
}

private struct MediumMoodWidget: View {
  let entry: SimpleEntry

  var body: some View {
    WidgetSurface {
      GeometryReader { geometry in
        let ringDiameter = min(max(78, geometry.size.height * 0.56), 92)

        HStack(spacing: 12) {
          CircularProgressRing(
            progress: entry.dailyProgress,
            diameter: ringDiameter,
            lineWidth: min(max(8, ringDiameter * 0.1), 10),
            valueFont: .system(size: 22, weight: .black, design: .rounded),
            captionFont: .system(size: 9, weight: .medium, design: .rounded)
          )

          VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
              Text(entry.mood)
                .font(.system(size: 28))

              VStack(alignment: .leading, spacing: 2) {
                Text("Bugünkü Mood")
                  .font(.system(size: 11, weight: .semibold, design: .rounded))
                  .foregroundColor(.white.opacity(0.65))

                Text(moodLabel(entry.mood))
                  .font(.system(size: 14, weight: .bold, design: .rounded))
                  .foregroundColor(.white)
                  .lineLimit(1)
              }

              Spacer(minLength: 0)
            }

            VStack(alignment: .leading, spacing: 7) {
              Text("Öncelikli 2 Görev")
                .font(.system(size: 11, weight: .semibold, design: .rounded))
                .foregroundColor(.white.opacity(0.65))

              if entry.topTodos.isEmpty {
                TaskRow(text: "Bugün için görev eklenmedi", placeholder: true)
                TaskRow(text: "İlk görevi uygulamadan ekle", placeholder: true)
              } else {
                ForEach(displayTasks(from: entry.topTodos), id: \.self) { task in
                  TaskRow(text: task, placeholder: false)
                }

                if entry.topTodos.count == 1 {
                  TaskRow(text: "Bir görev daha eklersen burada görünür", placeholder: true)
                }
              }
            }
          }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
      }
      .padding(14)
    }
  }
}

private struct LargeDashboardWidget: View {
  let entry: SimpleEntry

  var body: some View {
    WidgetSurface {
      VStack(alignment: .leading, spacing: 10) {
        HStack(alignment: .top) {
          VStack(alignment: .leading, spacing: 4) {
            Text("LifeTrack PRO")
              .font(.system(size: 18, weight: .black, design: .rounded))
              .foregroundColor(.white)

            Text("Haftalık ritim ve bugünün özeti")
              .font(.system(size: 11, weight: .medium, design: .rounded))
              .foregroundColor(.white.opacity(0.62))
          }

          Spacer(minLength: 10)

          Text("\(safeProgress(entry.dailyProgress))%")
            .font(.system(size: 12, weight: .bold, design: .rounded))
            .foregroundColor(widgetOrange)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(widgetOrange.opacity(0.12))
            .clipShape(Capsule())
        }

        HStack(spacing: 10) {
          LargeMetricCard(
            title: "Bugün",
            value: "\(safeProgress(entry.dailyProgress))%",
            subtitle: "hedef tamamlandı"
          )

          LargeMetricCard(
            title: "Seri",
            value: "\(max(entry.streak, 0)) gün",
            subtitle: "aktif istikrar"
          )

          LargeMetricCard(
            title: "Odak",
            value: entry.focusTime,
            subtitle: "pomodoro"
          )

          LargeMetricCard(
            title: "Hafta",
            value: "\(max(entry.weeklyHours, 0)) sa",
            subtitle: "toplam süre"
          )
        }

        VStack(alignment: .leading, spacing: 12) {
          HStack {
            Text("Haftalık Grafik")
              .font(.system(size: 13, weight: .bold, design: .rounded))
              .foregroundColor(.white)

            Spacer(minLength: 8)

            Text(progressHeadline(progress: entry.dailyProgress))
              .font(.system(size: 11, weight: .semibold, design: .rounded))
              .foregroundColor(widgetOrangeSoft)
          }

          WeeklyTrendChart(points: entry.weeklyTrend)
            .frame(height: 78)
        }
        .padding(10)
        .background(WidgetPanel())

        HStack(spacing: 10) {
          VStack(alignment: .leading, spacing: 10) {
            Text("Mood")
              .font(.system(size: 11, weight: .semibold, design: .rounded))
              .foregroundColor(.white.opacity(0.6))

            HStack(spacing: 10) {
              Text(entry.mood)
                .font(.system(size: 28))

              VStack(alignment: .leading, spacing: 3) {
                Text(moodLabel(entry.mood))
                  .font(.system(size: 14, weight: .bold, design: .rounded))
                  .foregroundColor(.white)

                Text("Bugünkü ruh hali")
                  .font(.system(size: 10, weight: .medium, design: .rounded))
                  .foregroundColor(.white.opacity(0.55))
              }
            }
          }
          .frame(maxWidth: .infinity, alignment: .leading)
          .padding(10)
          .background(WidgetPanel())

          VStack(alignment: .leading, spacing: 10) {
            Text("Görevler")
              .font(.system(size: 11, weight: .semibold, design: .rounded))
              .foregroundColor(.white.opacity(0.6))

            if entry.topTodos.isEmpty {
              TaskRow(text: "Görev listesi boş", placeholder: true)
              TaskRow(text: "En önemli işi ekle", placeholder: true)
            } else {
              ForEach(displayTasks(from: entry.topTodos), id: \.self) { task in
                TaskRow(text: task, placeholder: false)
              }
            }
          }
          .frame(maxWidth: .infinity, alignment: .leading)
          .padding(10)
          .background(WidgetPanel())
        }
      }
      .padding(12)
    }
  }
}

private struct WidgetSurface<Content: View>: View {
  @ViewBuilder let content: Content

  var body: some View {
    ZStack {
      LinearGradient(
        colors: [widgetBackgroundTop, widgetBackgroundBottom],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
      )

      Circle()
        .fill(widgetOrange.opacity(0.24))
        .frame(width: 200, height: 200)
        .blur(radius: 60)
        .offset(x: 90, y: -90)

      Circle()
        .fill(widgetOrange.opacity(0.10))
        .frame(width: 140, height: 140)
        .blur(radius: 45)
        .offset(x: -110, y: 110)

      RoundedRectangle(cornerRadius: 0, style: .continuous)
        .strokeBorder(Color.white.opacity(0.04), lineWidth: 1)

      content
    }
    .ignoresSafeArea()
  }
}

private struct WidgetPanel: View {
  var body: some View {
    RoundedRectangle(cornerRadius: 18, style: .continuous)
      .fill(widgetCardBackground)
      .overlay(
        RoundedRectangle(cornerRadius: 18, style: .continuous)
          .stroke(widgetCardBorder, lineWidth: 1)
      )
  }
}

private struct CircularProgressRing: View {
  let progress: Int
  let diameter: CGFloat
  let lineWidth: CGFloat
  let valueFont: Font
  let captionFont: Font

  var body: some View {
    let safeValue = safeProgress(progress)

    ZStack {
      Circle()
        .stroke(Color.white.opacity(0.08), lineWidth: lineWidth)

      Circle()
        .trim(from: 0, to: CGFloat(safeValue) / 100)
        .stroke(
          AngularGradient(
            colors: [widgetOrangeSoft, widgetOrange, widgetOrangeSoft],
            center: .center
          ),
          style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
        )
        .rotationEffect(.degrees(-90))

      VStack(spacing: 2) {
        Text("\(safeValue)%")
          .font(valueFont)
          .foregroundColor(.white)
          .minimumScaleFactor(0.7)

        Text("tamam")
          .font(captionFont)
          .foregroundColor(.white.opacity(0.55))
      }
    }
    .frame(width: diameter, height: diameter)
  }
}

private struct TaskRow: View {
  let text: String
  let placeholder: Bool

  var body: some View {
    HStack(alignment: .top, spacing: 8) {
      Circle()
        .fill(placeholder ? Color.white.opacity(0.22) : widgetOrange)
        .frame(width: 7, height: 7)
        .padding(.top, 5)

      Text(text)
        .font(.system(size: 12, weight: placeholder ? .medium : .semibold, design: .rounded))
        .foregroundColor(placeholder ? .white.opacity(0.52) : .white.opacity(0.92))
        .lineLimit(1)

      Spacer(minLength: 0)
    }
  }
}

private struct LargeMetricCard: View {
  let title: String
  let value: String
  let subtitle: String

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text(title)
        .font(.system(size: 10, weight: .semibold, design: .rounded))
        .foregroundColor(.white.opacity(0.55))

      Text(value)
        .font(.system(size: 16, weight: .black, design: .rounded))
        .foregroundColor(.white)
        .lineLimit(1)
        .minimumScaleFactor(0.72)

      Text(subtitle)
        .font(.system(size: 9, weight: .medium, design: .rounded))
        .foregroundColor(widgetOrangeSoft.opacity(0.95))
        .lineLimit(1)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(12)
    .background(WidgetPanel())
  }
}

private struct WeeklyTrendChart: View {
  let points: [TrendPoint]

  var body: some View {
    GeometryReader { geometry in
      let displayPoints = points.isEmpty ? fallbackTrendPoints() : points
      let slotWidth = geometry.size.width / CGFloat(max(displayPoints.count, 1))
      let barWidth = min(18, max(10, slotWidth * 0.42))

      HStack(alignment: .bottom, spacing: 0) {
        ForEach(Array(displayPoints.enumerated()), id: \.offset) { _, point in
          let score = safeProgress(point.score)
          let barHeight = max(12, geometry.size.height * CGFloat(score) / 100)

          VStack(spacing: 7) {
            Spacer(minLength: 0)

            Capsule()
              .fill(
                LinearGradient(
                  colors: [widgetOrangeSoft, widgetOrange],
                  startPoint: .top,
                  endPoint: .bottom
                )
              )
              .frame(width: barWidth, height: barHeight)
              .overlay(alignment: .top) {
                Circle()
                  .fill(Color.white.opacity(score > 50 ? 0.35 : 0.0))
                  .frame(width: 5, height: 5)
                  .padding(.top, 5)
              }

            Text(point.label)
              .font(.system(size: 9, weight: .semibold, design: .rounded))
              .foregroundColor(.white.opacity(0.6))
              .lineLimit(1)
          }
          .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
      }
    }
  }
}

private func loadWidgetPayload() -> WidgetPayload {
  guard let defaults = UserDefaults(suiteName: widgetGroupIdentifier) else {
    return WidgetPayload(
      streak: 0,
      dailyProgress: 0,
      focusTime: "25:00",
      weeklyHours: 0,
      mood: "🙂",
      topTodos: [],
      weeklyTrend: fallbackTrendPoints()
    )
  }

  return WidgetPayload(
    streak: defaults.integer(forKey: "widget_streak"),
    dailyProgress: safeProgress(defaults.integer(forKey: "widget_daily_progress")),
    focusTime: defaults.string(forKey: "widget_focus_time") ?? "25:00",
    weeklyHours: defaults.integer(forKey: "widget_weekly_hours"),
    mood: defaults.string(forKey: "widget_mood") ?? "🙂",
    topTodos: decodeStringArray(defaults.string(forKey: "widget_todos_json")),
    weeklyTrend: decodeTrendPoints(defaults.string(forKey: "widget_weekly_trend_json"))
  )
}

private func decodeStringArray(_ jsonString: String?) -> [String] {
  guard
    let jsonString,
    let data = jsonString.data(using: .utf8),
    let items = try? JSONDecoder().decode([String].self, from: data)
  else {
    return []
  }

  return items.filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
}

private func decodeTrendPoints(_ jsonString: String?) -> [TrendPoint] {
  guard
    let jsonString,
    let data = jsonString.data(using: .utf8),
    let points = try? JSONDecoder().decode([TrendPoint].self, from: data)
  else {
    return fallbackTrendPoints()
  }

  return points.map { TrendPoint(label: $0.label, score: safeProgress($0.score)) }
}

private func displayTasks(from tasks: [String]) -> [String] {
  Array(tasks.prefix(2))
}

private func safeProgress(_ value: Int) -> Int {
  min(max(value, 0), 100)
}

private func progressHeadline(progress: Int) -> String {
  switch safeProgress(progress) {
  case 85...100:
    return "çok güçlü"
  case 60...84:
    return "istikrarlı"
  case 30...59:
    return "yükseliyor"
  default:
    return "başlangıç"
  }
}

private func moodLabel(_ mood: String) -> String {
  switch mood {
  case "😄", "😁", "🤩", "🔥":
    return "Enerjik"
  case "🙂", "😊":
    return "Dengeli"
  case "😴", "😔", "😕":
    return "Sakin"
  case "😤", "😣":
    return "Zorlayıcı"
  default:
    return "Bugün"
  }
}

private func fallbackTrendPoints() -> [TrendPoint] {
  [
    TrendPoint(label: "Pzt", score: 20),
    TrendPoint(label: "Sal", score: 38),
    TrendPoint(label: "Çar", score: 44),
    TrendPoint(label: "Per", score: 60),
    TrendPoint(label: "Cum", score: 72),
    TrendPoint(label: "Cmt", score: 52),
    TrendPoint(label: "Paz", score: 66)
  ]
}

struct LifeTrackWidget_Previews: PreviewProvider {
  static let previewEntry = SimpleEntry(
    date: Date(),
    streak: 9,
    dailyProgress: 72,
    focusTime: "18:45",
    weeklyHours: 14,
    mood: "🔥",
    topTodos: ["UI polish", "Workout plan"],
    weeklyTrend: fallbackTrendPoints()
  )

  static var previews: some View {
    Group {
      LifeTrackWidgetEntryView(entry: previewEntry)
        .previewContext(WidgetPreviewContext(family: .systemSmall))

      LifeTrackWidgetEntryView(entry: previewEntry)
        .previewContext(WidgetPreviewContext(family: .systemMedium))

      LifeTrackWidgetEntryView(entry: previewEntry)
        .previewContext(WidgetPreviewContext(family: .systemLarge))
    }
  }
}
