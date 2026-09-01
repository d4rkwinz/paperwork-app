import React, { useEffect, useState } from "react";
import { BackHandler, Pressable, SafeAreaView, StatusBar, Text, View } from "react-native";
import { INITIAL_PROFILE, INITIAL_REQUESTS, PAYMENT_METHODS } from "./src/data";
import { NotFound, Tab } from "./src/ui";
import styles from "./src/styles";
import * as navcore from "./src/navcore";
import {
  BookingConfirmationScreen,
  BookingFormScreen,
  BookingReviewScreen,
  HomeScreen,
  ServiceDetailScreen
} from "./src/screens/Booking";
import {
  EditRequestReviewScreen,
  EditRequestScreen,
  RequestDetailScreen,
  RequestsScreen,
  RescheduleScreen
} from "./src/screens/Requests";
import {
  AddressesScreen,
  DangerZoneScreen,
  DeleteAccountScreen,
  HelpCenterScreen,
  PreferencesScreen,
  ProfileScreen,
  ReferralScreen,
  SupportFaqScreen
} from "./src/screens/Profile";
import { ForgotPasswordScreen, LoginScreen, OnboardingScreen } from "./src/screens/Auth";
import {
  ActivityScreen,
  LegalTermsScreen,
  SearchScreen,
  SupportChatScreen
} from "./src/screens/Misc";
import {
  AddCardScreen,
  BillingScreen,
  DocumentDetailScreen,
  DocumentsScreen,
  PaymentMethodsScreen,
  PaymentResultScreen,
  PaymentReviewScreen
} from "./src/screens/Billing";

const ROUTES = {
  Login: LoginScreen,
  ForgotPassword: ForgotPasswordScreen,
  Onboarding: OnboardingScreen,
  Home: HomeScreen,
  ServiceDetail: ServiceDetailScreen,
  BookingForm: BookingFormScreen,
  BookingReview: BookingReviewScreen,
  BookingConfirmation: BookingConfirmationScreen,
  Requests: RequestsScreen,
  RequestDetail: RequestDetailScreen,
  EditRequest: EditRequestScreen,
  EditRequestReview: EditRequestReviewScreen,
  Reschedule: RescheduleScreen,
  Profile: ProfileScreen,
  Preferences: PreferencesScreen,
  Addresses: AddressesScreen,
  Search: SearchScreen,
  Activity: ActivityScreen,
  SupportChat: SupportChatScreen,
  LegalTerms: LegalTermsScreen,
  Billing: BillingScreen,
  PaymentMethods: PaymentMethodsScreen,
  AddCard: AddCardScreen,
  PaymentReview: PaymentReviewScreen,
  PaymentResult: PaymentResultScreen,
  Documents: DocumentsScreen,
  DocumentDetail: DocumentDetailScreen,
  HelpCenter: HelpCenterScreen,
  SupportFaq: SupportFaqScreen,
  Referral: ReferralScreen,
  DangerZone: DangerZoneScreen,
  DeleteAccount: DeleteAccountScreen
};

const NO_TABS = new Set(["Login", "ForgotPassword", "Onboarding", "LegalTerms"]);
const NO_BACK = new Set(["Login", "LegalTerms"]);

export default function App() {
  const [stack, setStack] = useState(() => navcore.root("Login"));
  const [session, setSession] = useState({ signedIn: false, guest: false });
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [paymentMethods, setPaymentMethods] = useState(PAYMENT_METHODS);
  const [profile, setProfile] = useState(INITIAL_PROFILE);

  const route = stack[stack.length - 1];

  const nav = {
    push: (name, params) => setStack((s) => navcore.push(s, name, params)),
    replace: (name, params) => setStack((s) => navcore.replace(s, name, params)),
    back: () => setStack((s) => navcore.back(s)),
    root: (name, params) => setStack(navcore.root(name, params))
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (stack.length > 1 && !NO_BACK.has(route.name)) {
        nav.back();
        return true;
      }
      return false; // dead-end routes and the root: let the OS have it
    });
    return () => sub.remove();
  }, [stack, route.name]);

  const app = {
    requests,
    setRequests,
    profile,
    setProfile,
    session,
    setSession,
    paymentMethods,
    setPaymentMethods
  };
  const Screen = ROUTES[route.name] || NotFound;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScreenFrame
        canBack={stack.length > 1 && !NO_BACK.has(route.name)}
        showTabs={!NO_TABS.has(route.name)}
        onBack={nav.back}
        onTab={nav.root}
        activeRoot={stack[0].name}
      >
        <Screen key={route.key} nav={nav} params={route.params} app={app} />
      </ScreenFrame>
    </SafeAreaView>
  );
}

function ScreenFrame({ children, canBack, showTabs, onBack, onTab, activeRoot }) {
  return (
    <View style={styles.shell}>
      <View style={styles.topBar}>
        {canBack ? (
          <Pressable
            testID="nav-back"
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            style={styles.iconButton}
          >
            <Text style={styles.iconButtonText}>{"<"}</Text>
          </Pressable>
        ) : (
          <View style={styles.iconButtonMuted} />
        )}
        <Text style={styles.brand}>Paperwork</Text>
        <View style={styles.iconButtonMuted} />
      </View>
      <View style={[styles.content, !showTabs && { marginBottom: 0 }]}>{children}</View>
      {showTabs ? (
        <View style={styles.tabBar}>
          <Tab label="Home" active={activeRoot === "Home"} onPress={() => onTab("Home")} />
          <Tab label="Requests" active={activeRoot === "Requests"} onPress={() => onTab("Requests")} />
          <Tab label="Billing" active={activeRoot === "Billing"} onPress={() => onTab("Billing")} />
          <Tab label="Profile" active={activeRoot === "Profile"} onPress={() => onTab("Profile")} />
        </View>
      ) : null}
    </View>
  );
}
