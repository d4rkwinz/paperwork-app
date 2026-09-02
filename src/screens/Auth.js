import React, { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { PrimaryButton, SecondaryButton } from "../ui";
import styles from "../styles";

const ONBOARDING_STEPS = [
  {
    step: 1,
    heading: "Track every request in one place",
    body: "See bookings, statuses, and timelines the moment something changes."
  },
  {
    step: 2,
    heading: "Book in a few taps",
    body: "Pick a service, choose a time, and send the details to a pro."
  },
  {
    step: 3,
    heading: "Stay in the loop",
    body: "Notifications and quiet hours keep updates on your terms."
  }
];

export function LoginScreen({ nav, params, app }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const canSubmit = email.length > 0 && password.length > 0;

  const handleSubmit = () => {
    app.setSession({ signedIn: true, guest: false });
    nav.root("Onboarding", { step: 1 });
  };

  const handleGuest = () => {
    app.setSession({ signedIn: false, guest: true });
    nav.root("Home");
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Welcome</Text>
      <Text style={styles.h1}>Sign in to Paperwork</Text>
      <Text style={styles.bodyText}>Enter your email and password to continue.</Text>
      <Text style={styles.label}>Email</Text>
      <TextInput
        testID="login-email"
        accessibilityLabel="Email address"
        style={styles.singleInput}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        testID="login-password"
        accessibilityLabel="Password"
        style={styles.singleInput}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <PrimaryButton label="Sign in" testID="login-submit" disabled={!canSubmit} onPress={handleSubmit} />
      <SecondaryButton label="Continue as guest" testID="login-guest" onPress={handleGuest} />
      <SecondaryButton label="Forgot password?" testID="login-forgot" onPress={() => nav.push("ForgotPassword")} />
    </ScrollView>
  );
}

export function ForgotPasswordScreen({ nav, params, app }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Reset password</Text>
      <Text style={styles.h1}>Forgot your password?</Text>
      {sent ? (
        <View style={styles.inlinePanel}>
          <Text style={styles.panelTitle}>Check your email</Text>
          <Text style={styles.bodyText}>
            If an account matches {email || "that address"}, reset instructions are on the way.
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.bodyText}>Enter your email and we'll send you a reset link.</Text>
          <Text style={styles.label}>Email</Text>
          <TextInput
            testID="forgot-email"
            accessibilityLabel="Email address"
            style={styles.singleInput}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <PrimaryButton label="Send reset link" testID="forgot-submit" onPress={() => setSent(true)} />
        </>
      )}
      <SecondaryButton label="Back to sign in" testID="forgot-back" onPress={() => nav.replace("Login")} />
    </ScrollView>
  );
}

export function OnboardingScreen({ nav, params, app }) {
  const step = params?.step || 1;
  const content = ONBOARDING_STEPS.find((item) => item.step === step) || ONBOARDING_STEPS[0];

  const handleNext = () => {
    if (step >= 3) {
      nav.root("Home");
    } else {
      nav.push("Onboarding", { step: step + 1 });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Get started</Text>
      <Text style={styles.h1}>{content.heading}</Text>
      <Text style={styles.bodyText}>{content.body}</Text>
      <View style={styles.metaRow}>
        {ONBOARDING_STEPS.map((item) => (
          <Text
            key={item.step}
            testID={`onboarding-step-${item.step}`}
            accessibilityLabel={`Step ${item.step} of 3${item.step === step ? ", current" : ""}`}
            style={[styles.pill, item.step === step && styles.choiceActive]}
          >
            {item.step}
          </Text>
        ))}
      </View>
      <PrimaryButton
        label={step >= 3 ? "Get started" : "Next"}
        testID="onboarding-next"
        onPress={handleNext}
      />
      <SecondaryButton label="Skip" testID="onboarding-skip" onPress={() => nav.root("Home")} />
    </ScrollView>
  );
}
