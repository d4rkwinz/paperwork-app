import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ACTIVITY_ITEMS, SERVICES } from "../data";
import { ChoiceRow, PrimaryButton } from "../ui";
import styles from "../styles";

// Trap: requires generated input. Results exist only when the trimmed query
// is >= 2 characters - a crawler that never types sees 0 new edges here.
export function SearchScreen({ nav, params, app }) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const matches =
    trimmed.length >= 2
      ? SERVICES.filter((service) =>
          `${service.title} ${service.category}`.toLowerCase().includes(trimmed.toLowerCase())
        )
      : [];

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Search</Text>
      <Text style={styles.h1}>Find a service</Text>
      <TextInput
        testID="search-input"
        accessibilityLabel="Search services"
        style={styles.singleInput}
        autoCapitalize="none"
        placeholder="Try plumber, cleaning, errands..."
        value={query}
        onChangeText={setQuery}
      />
      {trimmed.length < 2 ? (
        <Text testID="search-empty" style={styles.emptyText}>
          Type at least 2 characters to search.
        </Text>
      ) : matches.length === 0 ? (
        <Text testID="search-no-results" style={styles.emptyText}>
          {`No services match "${trimmed}".`}
        </Text>
      ) : (
        matches.map((service) => (
          <Pressable
            key={service.id}
            testID={`search-result-${service.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Open ${service.title}`}
            onPress={() => nav.push("ServiceDetail", { serviceId: service.id })}
            style={styles.settingRow}
          >
            <View>
              <Text style={styles.cardTitle}>{service.title}</Text>
              <Text style={styles.cardBody}>{service.category}</Text>
            </View>
            <Text style={styles.chevron}>{">"}</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

// Trap: in-screen state vs navigation. Three segments swap content on one
// route - the route never changes.
export function ActivityScreen({ nav, params, app }) {
  const [segment, setSegment] = useState("All");
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Activity</Text>
      <Text style={styles.h1}>Recent activity</Text>
      <ChoiceRow options={["All", "Alerts", "Receipts"]} value={segment} onChange={setSegment} testPrefix="activity-seg" />
      <Text style={styles.sectionTitle}>{segment}</Text>
      {ACTIVITY_ITEMS[segment].map((item) => (
        <View key={item.id} testID={`activity-item-${item.id}`} style={styles.listRow}>
          <Text style={styles.reviewLabel}>{item.kind}</Text>
          <Text style={styles.listText}>{item.text}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const SUPPORT_MESSAGES = [
  { from: "Support", text: "Hi Alex! Thanks for reaching out. How can we help today?" },
  { from: "You", text: "My grocery run shows 4:30 PM but I asked for the morning slot." },
  { from: "Support", text: "I see REQ-1038 - I have moved it to the 10:30 AM window and notified the shopper." }
];

// Trap: slow load. Content settles 1500ms after mount, and because screens
// remount on every push, the delay replays on every visit - deliberate.
export function SupportChatScreen({ nav, params, app }) {
  const [ready, setReady] = useState(false);
  const [messages, setMessages] = useState(SUPPORT_MESSAGES);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Support</Text>
      <Text testID="support-title" style={styles.h1}>
        Chat with us
      </Text>
      {!ready ? (
        <View testID="support-loading" style={styles.inlinePanel}>
          <ActivityIndicator accessibilityLabel="Loading conversation" color="#2F7D6D" />
          <Text style={styles.bodyText}>Connecting you to support...</Text>
        </View>
      ) : (
        <>
          {messages.map((message, i) => (
            <View key={i} testID={`support-message-${i + 1}`} style={styles.listRow}>
              <Text style={styles.reviewLabel}>{message.from}</Text>
              <Text style={styles.listText}>{message.text}</Text>
            </View>
          ))}
          <PrimaryButton
            label="Send a reply"
            testID="support-reply"
            onPress={() =>
              setMessages((current) => [...current, { from: "You", text: "Thanks, that helps!" }])
            }
          />
        </>
      )}
    </ScrollView>
  );
}

// Trap: dead end. This route is in both NO_TABS and NO_BACK, so there is no
// top back button and no tab bar - legal-close is the only exit. On Android,
// hardware back returns false in App.js's BackHandler and backgrounds the
// app. Deliberately a route, not a <Modal>: it composes with the router and
// cannot collide with the cancel-confirm modal (two simultaneous Modals
// break on iOS).
export function LegalTermsScreen({ nav, params, app }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Legal</Text>
      <Text style={styles.h1}>Terms of service</Text>
      <View testID="legal-body" style={styles.inlinePanel}>
        <Text style={styles.panelTitle}>1. The service</Text>
        <Text style={styles.bodyText}>
          Paperwork connects you with independent providers for household services. Providers are
          not employees of Paperwork, and availability is not guaranteed.
        </Text>
        <Text style={styles.panelTitle}>2. Bookings and cancellation</Text>
        <Text style={styles.bodyText}>
          Bookings may be edited or cancelled at no charge before a provider is dispatched. After
          dispatch, cancellation fees may apply.
        </Text>
        <Text style={styles.panelTitle}>3. Notifications</Text>
        <Text style={styles.bodyText}>
          You control push, email, and SMS delivery in Preferences. Quiet hours delay non-urgent
          updates until morning.
        </Text>
      </View>
      <PrimaryButton label="Close" testID="legal-close" onPress={() => nav.back()} />
    </ScrollView>
  );
}
