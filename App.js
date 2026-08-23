import React, { useState } from "react";
import { Pressable, SafeAreaView, StatusBar, Text, View } from "react-native";
import { ADDRESSES, INITIAL_REQUESTS, SERVICES } from "./src/data";
import { Tab } from "./src/ui";
import styles from "./src/styles";
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
  RequestsScreen
} from "./src/screens/Requests";
import { AddressesScreen, PreferencesScreen, ProfileScreen } from "./src/screens/Profile";

export default function App() {
  const [stack, setStack] = useState([{ name: "Home", params: {} }]);
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [profile, setProfile] = useState({
    name: "Alex Morgan",
    phone: "+1 555 014 2920",
    email: "alex@example.com",
    primaryAddress: ADDRESSES[0],
    notifyPush: true,
    notifyEmail: true,
    notifySms: false,
    quietHours: true
  });

  const route = stack[stack.length - 1];

  const nav = {
    push: (name, params = {}) => setStack((current) => [...current, { name, params }]),
    replace: (name, params = {}) => setStack((current) => [...current.slice(0, -1), { name, params }]),
    back: () => setStack((current) => (current.length > 1 ? current.slice(0, -1) : current)),
    root: (name) => setStack([{ name, params: {} }])
  };

  const createRequest = (booking) => {
    const service = SERVICES.find((item) => item.id === booking.serviceId);
    const request = {
      id: `REQ-${Math.floor(1100 + Math.random() * 800)}`,
      serviceId: booking.serviceId,
      title: service.title,
      status: "Active",
      date: booking.date,
      time: booking.time,
      address: booking.address,
      priority: booking.priority,
      notes: booking.notes || "No extra notes.",
      timeline: ["Booked"]
    };
    setRequests((current) => [request, ...current]);
    nav.push("BookingConfirmation", { request });
  };

  const updateRequest = (updated) => {
    setRequests((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    nav.replace("RequestDetail", { requestId: updated.id, saved: true });
  };

  const cancelRequest = (requestId) => {
    setRequests((current) =>
      current.map((item) =>
        item.id === requestId ? { ...item, status: "Canceled", timeline: [...item.timeline, "Canceled"] } : item
      )
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScreenFrame
        canBack={stack.length > 1}
        onBack={nav.back}
        onTab={nav.root}
        activeRoot={stack[0].name}
      >
        {route.name === "Home" && <HomeScreen nav={nav} />}
        {route.name === "ServiceDetail" && <ServiceDetailScreen nav={nav} serviceId={route.params.serviceId} />}
        {route.name === "BookingForm" && (
          <BookingFormScreen
            nav={nav}
            serviceId={route.params.serviceId}
            defaultAddress={profile.primaryAddress}
            initialDraft={route.params.draft}
          />
        )}
        {route.name === "BookingReview" && (
          <BookingReviewScreen
            nav={nav}
            booking={route.params.booking}
            onCreate={createRequest}
          />
        )}
        {route.name === "BookingConfirmation" && (
          <BookingConfirmationScreen nav={nav} request={route.params.request} />
        )}
        {route.name === "Requests" && <RequestsScreen nav={nav} requests={requests} />}
        {route.name === "RequestDetail" && (
          <RequestDetailScreen
            nav={nav}
            request={requests.find((item) => item.id === route.params.requestId)}
            saved={route.params.saved}
            onCancel={cancelRequest}
          />
        )}
        {route.name === "EditRequest" && (
          <EditRequestScreen nav={nav} request={route.params.request} />
        )}
        {route.name === "EditRequestReview" && (
          <EditRequestReviewScreen
            nav={nav}
            request={route.params.request}
            onSave={updateRequest}
          />
        )}
        {route.name === "Profile" && <ProfileScreen nav={nav} profile={profile} setProfile={setProfile} />}
        {route.name === "Preferences" && <PreferencesScreen profile={profile} setProfile={setProfile} />}
        {route.name === "Addresses" && <AddressesScreen profile={profile} setProfile={setProfile} />}
      </ScreenFrame>
    </SafeAreaView>
  );
}

function ScreenFrame({ children, canBack, onBack, onTab, activeRoot }) {
  return (
    <View style={styles.shell}>
      <View style={styles.topBar}>
        <Pressable
          testID="nav-back"
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          disabled={!canBack}
          style={[styles.iconButton, !canBack && styles.iconButtonMuted]}
        >
          <Text style={styles.iconButtonText}>{"<"}</Text>
        </Pressable>
        <Text style={styles.brand}>Paperwork</Text>
        <View style={styles.iconButtonMuted} />
      </View>
      <View style={styles.content}>{children}</View>
      <View style={styles.tabBar}>
        <Tab label="Home" active={activeRoot === "Home"} onPress={() => onTab("Home")} />
        <Tab label="Requests" active={activeRoot === "Requests"} onPress={() => onTab("Requests")} />
        <Tab label="Profile" active={activeRoot === "Profile"} onPress={() => onTab("Profile")} />
      </View>
    </View>
  );
}
