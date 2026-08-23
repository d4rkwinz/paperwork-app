import React from "react";
import { Pressable, Switch, Text, View } from "react-native";
import styles from "./styles";

export function Tab({ label, active, onPress }) {
  return (
    <Pressable
      testID={`tab-${label.toLowerCase()}`}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label} tab`}
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive]}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function Metric({ label, value }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.cardEyebrow}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

export function ChoiceRow({ options, value, onChange, testPrefix }) {
  return (
    <View style={styles.choiceWrap}>
      {options.map((option) => {
        const active = value === option;
        return (
          <Pressable
            key={option}
            testID={`${testPrefix}-${slug(option)}`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option}
            onPress={() => onChange(option)}
            style={[styles.choice, active && styles.choiceActive]}
          >
            <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ReviewBlock({ rows }) {
  return (
    <View style={styles.reviewBlock}>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>{label}</Text>
          <Text style={styles.reviewValue}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

export function ToggleRow({ label, value, onValueChange, testID }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.cardTitle}>{label}</Text>
      <Switch testID={testID} accessibilityLabel={label} value={value} onValueChange={onValueChange} />
    </View>
  );
}

export function PrimaryButton({ label, onPress, testID, disabled }) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.primaryButton, disabled && styles.buttonDisabled]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, testID, danger }) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.secondaryButton, danger && styles.secondaryDanger]}
    >
      <Text style={[styles.secondaryButtonText, danger && styles.secondaryDangerText]}>{label}</Text>
    </Pressable>
  );
}

export function notificationSummary(profile) {
  const channels = [
    profile.notifyPush && "push",
    profile.notifyEmail && "email",
    profile.notifySms && "SMS"
  ].filter(Boolean);
  const base = channels.length ? channels.join(", ") : "no channels";
  return `${base}${profile.quietHours ? " with quiet hours enabled" : ""}.`;
}

export function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
