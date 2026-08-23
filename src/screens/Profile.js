import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ADDRESSES } from "../data";
import { ToggleRow, notificationSummary, slug } from "../ui";
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
