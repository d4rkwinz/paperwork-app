import React from "react";
import { BULK } from "../data";
import { DetailScreen, FormScreen, ListScreen, WizardScreen } from "./generic";

// Tier B route wrappers. Each is a named `export function` so App.js's
// ROUTES map keeps bare identifiers (scripts/wiring.test.js forbids inline
// arrows there) and scripts/data.test.js can resolve each route to this file
// via `export function <Component>`. Every wrapper is one line of behavior:
// pass the route's BULK config to the matching generic renderer. All screen
// content, navigation targets, and testIDs live in src/data.js's BULK - do
// not add anything else here (Tier B is deliberately sparse; see the header
// of src/screens/generic.js).

// --- Notifications cluster ---------------------------------------------
export function InboxScreen(props) {
  return <ListScreen {...props} cfg={BULK.Inbox} />;
}
export function NotificationDetailScreen(props) {
  return <DetailScreen {...props} cfg={BULK.NotificationDetail} />;
}
export function NotificationSettingsScreen(props) {
  return <FormScreen {...props} cfg={BULK.NotificationSettings} />;
}

// --- Insurance cluster --------------------------------------------------
export function PoliciesScreen(props) {
  return <ListScreen {...props} cfg={BULK.Policies} />;
}
export function PolicyDetailScreen(props) {
  return <DetailScreen {...props} cfg={BULK.PolicyDetail} />;
}
export function ClaimStartScreen(props) {
  return <DetailScreen {...props} cfg={BULK.ClaimStart} />;
}
export function ClaimWizardScreen(props) {
  return <WizardScreen {...props} cfg={BULK.ClaimWizard} />;
}
export function ClaimSubmittedScreen(props) {
  return <DetailScreen {...props} cfg={BULK.ClaimSubmitted} />;
}

// --- Providers cluster ---------------------------------------------------
export function DirectoryScreen(props) {
  return <ListScreen {...props} cfg={BULK.Directory} />;
}
export function ProviderDetailScreen(props) {
  return <DetailScreen {...props} cfg={BULK.ProviderDetail} />;
}
export function MessageThreadScreen(props) {
  return <ListScreen {...props} cfg={BULK.MessageThread} />;
}
export function ComposeMessageScreen(props) {
  return <FormScreen {...props} cfg={BULK.ComposeMessage} />;
}

// --- Reminders cluster ----------------------------------------------------
export function RemindersMonthScreen(props) {
  return <ListScreen {...props} cfg={BULK.RemindersMonth} />;
}
export function RemindersDayScreen(props) {
  return <ListScreen {...props} cfg={BULK.RemindersDay} />;
}
export function ReminderDetailScreen(props) {
  return <DetailScreen {...props} cfg={BULK.ReminderDetail} />;
}
export function RecurrencePickerScreen(props) {
  return <ListScreen {...props} cfg={BULK.RecurrencePicker} />;
}
export function CreateReminderScreen(props) {
  return <FormScreen {...props} cfg={BULK.CreateReminder} />;
}

// --- Security & data cluster ----------------------------------------------
export function SecurityScreen(props) {
  return <ListScreen {...props} cfg={BULK.Security} />;
}
export function ChangePasswordScreen(props) {
  return <FormScreen {...props} cfg={BULK.ChangePassword} />;
}
export function TwoFactorSetupScreen(props) {
  return <WizardScreen {...props} cfg={BULK.TwoFactorSetup} />;
}
export function DataExportScreen(props) {
  return <DetailScreen {...props} cfg={BULK.DataExport} />;
}
export function ExportStatusScreen(props) {
  return <DetailScreen {...props} cfg={BULK.ExportStatus} />;
}
