import React, { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ADDRESSES, HELP_TOPICS, INITIAL_PROFILE, INITIAL_REQUESTS, PAYMENT_METHODS } from "../data";
import { confirmsDelete } from "../validate";
import { PrimaryButton, SecondaryButton, ToggleRow, notificationSummary, slug } from "../ui";
import styles from "../styles";

export function ProfileScreen({ nav, params, app }) {
  const { profile, setProfile } = app;
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Profile</Text>
      <Text style={styles.h1}>{profile.name}</Text>
      <Text style={styles.label}>Name</Text>
      <TextInput
        testID="profile-name"
        accessibilityLabel="Profile name"
        style={styles.singleInput}
        value={profile.name}
        onChangeText={(name) => setProfile((current) => ({ ...current, name }))}
      />
      <Text style={styles.label}>Phone</Text>
      <TextInput
        testID="profile-phone"
        accessibilityLabel="Profile phone"
        style={styles.singleInput}
        value={profile.phone}
        onChangeText={(phone) => setProfile((current) => ({ ...current, phone }))}
      />
      <Text style={styles.label}>Email</Text>
      <TextInput
        testID="profile-email"
        accessibilityLabel="Profile email"
        style={styles.singleInput}
        value={profile.email}
        onChangeText={(email) => setProfile((current) => ({ ...current, email }))}
      />
      <Pressable testID="open-addresses" accessibilityRole="button" onPress={() => nav.push("Addresses")} style={styles.settingRow}>
        <View>
          <Text style={styles.cardTitle}>Saved addresses</Text>
          <Text style={styles.cardBody}>{profile.primaryAddress}</Text>
        </View>
        <Text style={styles.chevron}>{">"}</Text>
      </Pressable>
      <Pressable testID="open-preferences" accessibilityRole="button" onPress={() => nav.push("Preferences")} style={styles.settingRow}>
        <View>
          <Text style={styles.cardTitle}>Notification preferences</Text>
          <Text style={styles.cardBody}>Push, email, SMS, quiet hours</Text>
        </View>
        <Text style={styles.chevron}>{">"}</Text>
      </Pressable>
      <Pressable testID="open-support" accessibilityRole="button" accessibilityLabel="Chat with support" onPress={() => nav.push("SupportChat")} style={styles.settingRow}>
        <View>
          <Text style={styles.cardTitle}>Support chat</Text>
          <Text style={styles.cardBody}>Questions about a booking or charge</Text>
        </View>
        <Text style={styles.chevron}>{">"}</Text>
      </Pressable>
      <Pressable testID="open-help" accessibilityRole="button" accessibilityLabel="Help center" onPress={() => nav.push("HelpCenter")} style={styles.settingRow}>
        <View>
          <Text style={styles.cardTitle}>Help center</Text>
          <Text style={styles.cardBody}>Common questions, answered</Text>
        </View>
        <Text style={styles.chevron}>{">"}</Text>
      </Pressable>
      <Pressable testID="open-referral" accessibilityRole="button" accessibilityLabel="Refer a friend" onPress={() => nav.push("Referral")} style={styles.settingRow}>
        <View>
          <Text style={styles.cardTitle}>Refer a friend</Text>
          <Text style={styles.cardBody}>Give $20, get $20</Text>
        </View>
        <Text style={styles.chevron}>{">"}</Text>
      </Pressable>
      <Pressable testID="open-danger-zone" accessibilityRole="button" accessibilityLabel="Danger zone" onPress={() => nav.push("DangerZone")} style={styles.settingRow}>
        <View>
          <Text style={styles.cardTitle}>Danger zone</Text>
          <Text style={styles.cardBody}>Delete your account and data</Text>
        </View>
        <Text style={styles.chevron}>{">"}</Text>
      </Pressable>
    </ScrollView>
  );
}

export function PreferencesScreen({ nav, params, app }) {
  const { profile, setProfile } = app;
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Preferences</Text>
      <Text style={styles.h1}>Notifications</Text>
      <ToggleRow label="Push notifications" value={profile.notifyPush} onValueChange={(notifyPush) => setProfile((current) => ({ ...current, notifyPush }))} testID="toggle-push" />
      <ToggleRow label="Email updates" value={profile.notifyEmail} onValueChange={(notifyEmail) => setProfile((current) => ({ ...current, notifyEmail }))} testID="toggle-email" />
      <ToggleRow label="SMS alerts" value={profile.notifySms} onValueChange={(notifySms) => setProfile((current) => ({ ...current, notifySms }))} testID="toggle-sms" />
      <ToggleRow label="Quiet hours" value={profile.quietHours} onValueChange={(quietHours) => setProfile((current) => ({ ...current, quietHours }))} testID="toggle-quiet-hours" />
      <View style={styles.inlinePanel}>
        <Text style={styles.panelTitle}>Current delivery</Text>
        <Text style={styles.bodyText}>{notificationSummary(profile)}</Text>
      </View>
      <Pressable testID="open-legal" accessibilityRole="button" accessibilityLabel="Terms of service" onPress={() => nav.push("LegalTerms")} style={styles.settingRow}>
        <View>
          <Text style={styles.cardTitle}>Terms of service</Text>
          <Text style={styles.cardBody}>Bookings, cancellation, and notifications</Text>
        </View>
        <Text style={styles.chevron}>{">"}</Text>
      </Pressable>
      <Pressable testID="open-faq" accessibilityRole="button" accessibilityLabel="Notification FAQ" onPress={() => nav.push("SupportFaq")} style={styles.settingRow}>
        <View>
          <Text style={styles.cardTitle}>Notification FAQ</Text>
          <Text style={styles.cardBody}>Common questions, answered</Text>
        </View>
        <Text style={styles.chevron}>{">"}</Text>
      </Pressable>
    </ScrollView>
  );
}

export function AddressesScreen({ nav, params, app }) {
  const { profile, setProfile } = app;
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Addresses</Text>
      <Text style={styles.h1}>Primary address</Text>
      {ADDRESSES.map((address) => (
        <Pressable
          key={address}
          testID={`select-address-${slug(address)}`}
          accessibilityRole="radio"
          accessibilityState={{ selected: profile.primaryAddress === address }}
          accessibilityLabel={`Select ${address}`}
          onPress={() => setProfile((current) => ({ ...current, primaryAddress: address }))}
          style={[styles.option, profile.primaryAddress === address && styles.optionActive]}
        >
          <Text style={[styles.optionText, profile.primaryAddress === address && styles.optionTextActive]}>{address}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// Alias-pair trap: HelpCenter and SupportFaq both render THIS component and
// nothing else, so their output - heading, body, list, and testIDs - is
// byte-identical by construction and cannot drift. Only the route name and
// entry point (Profile's open-help vs Preferences' open-faq) differ. A
// crawler that dedups on rendered content reports 1 node; the truth is 2.
function HelpContent({ nav }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Help</Text>
      <Text style={styles.h1}>Common questions</Text>
      <Text style={styles.label}>Topics</Text>
      {HELP_TOPICS.map((topic, index) => (
        <View key={topic} testID={`help-topic-${index + 1}`} style={styles.listRow}>
          <Text style={styles.listText}>{topic}</Text>
        </View>
      ))}
      <SecondaryButton label="Contact support" testID="help-contact" onPress={() => nav.push("SupportChat")} />
    </ScrollView>
  );
}

export function HelpCenterScreen({ nav, params, app }) {
  return <HelpContent nav={nav} />;
}

export function SupportFaqScreen({ nav, params, app }) {
  return <HelpContent nav={nav} />;
}

export function ReferralScreen({ nav, params, app }) {
  const [shared, setShared] = useState(false);
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Referral</Text>
      <Text style={styles.h1}>Give $20, get $20</Text>
      <View style={styles.inlinePanel}>
        <Text style={styles.panelTitle}>Your code</Text>
        <Text testID="referral-code" style={styles.bodyText}>PAPER-ALEX-20</Text>
      </View>
      {shared ? (
        <Text testID="referral-shared" style={styles.savedNotice}>Referral link shared.</Text>
      ) : null}
      <PrimaryButton label="Share code" testID="referral-share" onPress={() => setShared(true)} />
      <SecondaryButton label="View your profile" testID="referral-open-profile" onPress={() => nav.push("Profile")} />
    </ScrollView>
  );
}

export function DangerZoneScreen({ nav, params, app }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Danger zone</Text>
      <Text style={styles.h1}>Delete account</Text>
      <Text testID="danger-warning" style={styles.bodyText}>
        Deleting your account erases your requests, payment methods, and profile data, and signs you out. This cannot be undone.
      </Text>
      <SecondaryButton danger label="Delete my account" testID="open-delete-account" onPress={() => nav.push("DeleteAccount")} />
    </ScrollView>
  );
}

export function DeleteAccountScreen({ nav, params, app }) {
  const [confirmText, setConfirmText] = useState("");
  // Four plain setter calls - React 19 auto-batches them into one render.
  // nav.root("Login") is mandatory: without it the app stays on a route whose
  // params point at deleted data.
  const resetAll = () => {
    app.setRequests(INITIAL_REQUESTS);
    app.setProfile(INITIAL_PROFILE);
    app.setPaymentMethods(PAYMENT_METHODS);
    app.setSession({ signedIn: false, guest: false });
    nav.root("Login");
  };
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Delete account</Text>
      <Text style={styles.h1}>This is permanent</Text>
      <Text style={styles.bodyText}>
        Type DELETE in the box below to confirm. All requests, payment methods, and profile data will be reset and you will be signed out.
      </Text>
      <Text style={styles.label}>Confirmation</Text>
      <TextInput
        testID="delete-confirm-input"
        accessibilityLabel="Type DELETE to confirm"
        style={styles.singleInput}
        value={confirmText}
        onChangeText={setConfirmText}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <PrimaryButton label="Delete account" testID="delete-submit" disabled={!confirmsDelete(confirmText)} onPress={resetAll} />
    </ScrollView>
  );
}
