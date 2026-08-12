import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";

const SERVICES = [
  {
    id: "cleaning",
    title: "Home cleaning",
    category: "Home",
    short: "Kitchen, bath, floors, and reset tasks.",
    details: "A two-person team handles common home cleaning tasks with supplies included.",
    price: "$88",
    eta: "2-3 hr",
    accent: "#2F7D6D"
  },
  {
    id: "plumbing",
    title: "Plumber",
    category: "Repair",
    short: "Leaks, clogs, fittings, and fixture checks.",
    details: "A licensed technician can inspect urgent leaks, clogs, and fixture issues.",
    price: "$120",
    eta: "60-90 min",
    accent: "#C55A3C"
  },
  {
    id: "groceries",
    title: "Grocery run",
    category: "Errands",
    short: "Fresh items, pantry basics, and delivery.",
    details: "A shopper picks up your saved list and confirms substitutions before checkout.",
    price: "$12 fee",
    eta: "Same day",
    accent: "#4D65A8"
  },
  {
    id: "car",
    title: "Car service",
    category: "Auto",
    short: "Pickup for inspection, wash, or oil change.",
    details: "Schedule a vehicle pickup with status updates from pickup to dropoff.",
    price: "$45 fee",
    eta: "Half day",
    accent: "#8B6F35"
  }
];

const DATES = ["Today", "Tomorrow", "Fri Apr 26", "Sat Apr 27"];
const TIMES = ["8:00 AM", "10:30 AM", "1:00 PM", "4:30 PM"];
const PRIORITIES = ["Normal", "High", "Urgent"];

const INITIAL_REQUESTS = [
  {
    id: "REQ-1042",
    serviceId: "cleaning",
    title: "Home cleaning",
    status: "Active",
    date: "Tomorrow",
    time: "10:30 AM",
    address: "Home - 24 Cedar Street",
    priority: "Normal",
    notes: "Focus on kitchen counters and guest bath.",
    timeline: ["Booked", "Assigned", "En route"]
  },
  {
    id: "REQ-1038",
    serviceId: "groceries",
    title: "Grocery run",
    status: "Active",
    date: "Today",
    time: "4:30 PM",
    address: "Home - 24 Cedar Street",
    priority: "High",
    notes: "Call before replacing coffee or oat milk.",
    timeline: ["Booked", "Shopping"]
  },
  {
    id: "REQ-0977",
    serviceId: "car",
    title: "Car service",
    status: "Completed",
    date: "Fri Apr 19",
    time: "8:00 AM",
    address: "Office - 9 Market Plaza",
    priority: "Normal",
    notes: "Oil change and tire pressure check.",
    timeline: ["Booked", "Picked up", "Completed"]
  }
];

const ADDRESSES = ["Home - 24 Cedar Street", "Office - 9 Market Plaza", "Gym - 12 Lake Avenue"];
const ANDROID_NAV_BAR_GAP = Platform.OS === "android" ? 48 : 0;
const TAB_BAR_HEIGHT = 72;

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

function Tab({ label, active, onPress }) {
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

function HomeScreen({ nav }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Today</Text>
        <Text style={styles.h1}>What needs handling?</Text>
        <Text style={styles.bodyText}>Book common services, track active errands, and update details in one place.</Text>
      </View>
      <Text style={styles.sectionTitle}>Services</Text>
      <View style={styles.cardGrid}>
        {SERVICES.map((service) => (
          <Pressable
            key={service.id}
            testID={`service-${service.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Open ${service.title}`}
            onPress={() => nav.push("ServiceDetail", { serviceId: service.id })}
            style={styles.serviceCard}
          >
            <View style={[styles.colorRail, { backgroundColor: service.accent }]} />
            <Text style={styles.cardEyebrow}>{service.category}</Text>
            <Text style={styles.cardTitle}>{service.title}</Text>
            <Text style={styles.cardBody}>{service.short}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.pill}>{service.price}</Text>
              <Text style={styles.pill}>{service.eta}</Text>
            </View>
          </Pressable>
        ))}
      </View>
      <View style={styles.inlinePanel}>
        <Text style={styles.panelTitle}>Agent task seed</Text>
        <Text style={styles.bodyText}>Try: book a plumber for tomorrow morning at the home address.</Text>
      </View>
    </ScrollView>
  );
}

function ServiceDetailScreen({ nav, serviceId }) {
  const service = SERVICES.find((item) => item.id === serviceId);
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={[styles.detailHeader, { borderColor: service.accent }]}>
        <Text style={styles.kicker}>{service.category}</Text>
        <Text style={styles.h1}>{service.title}</Text>
        <Text style={styles.bodyText}>{service.details}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Metric label="Starting at" value={service.price} />
        <Metric label="Typical time" value={service.eta} />
      </View>
      <Text style={styles.sectionTitle}>Included</Text>
      {["Arrival updates", "Editable booking notes", "No-charge cancellation before dispatch"].map((item) => (
        <View key={item} style={styles.listRow}>
          <Text style={styles.checkMark}>+</Text>
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
      <PrimaryButton
        label="Book this service"
        testID="book-service"
        onPress={() => nav.push("BookingForm", { serviceId })}
      />
    </ScrollView>
  );
}

function BookingFormScreen({ nav, serviceId, defaultAddress, initialDraft }) {
  const service = SERVICES.find((item) => item.id === serviceId);
  const [date, setDate] = useState(initialDraft?.date || "");
  const [time, setTime] = useState(initialDraft?.time || "");
  const [address, setAddress] = useState(initialDraft?.address || defaultAddress);
  const [priority, setPriority] = useState(initialDraft?.priority || "Normal");
  const [notes, setNotes] = useState(initialDraft?.notes || "");
  const canContinue = date && time && address;

  const booking = { serviceId, date, time, address, priority, notes };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>New booking</Text>
      <Text style={styles.h1}>{service.title}</Text>
      <Text style={styles.label}>Date</Text>
      <ChoiceRow options={DATES} value={date} onChange={setDate} testPrefix="date" />
      <Text style={styles.label}>Time</Text>
      <ChoiceRow options={TIMES} value={time} onChange={setTime} testPrefix="time" />
      <Text style={styles.label}>Address</Text>
      <ChoiceRow options={ADDRESSES} value={address} onChange={setAddress} testPrefix="address" />
      <Text style={styles.label}>Priority</Text>
      <ChoiceRow options={PRIORITIES} value={priority} onChange={setPriority} testPrefix="priority" />
      <Text style={styles.label}>Notes</Text>
      <TextInput
        testID="booking-notes"
        accessibilityLabel="Booking notes"
        style={styles.input}
        placeholder="Add access details or special instructions"
        value={notes}
        onChangeText={setNotes}
        multiline
      />
      <PrimaryButton
        label="Review booking"
        testID="review-booking"
        disabled={!canContinue}
        onPress={() => nav.push("BookingReview", { booking })}
      />
    </ScrollView>
  );
}

function BookingReviewScreen({ nav, booking, onCreate }) {
  const service = SERVICES.find((item) => item.id === booking.serviceId);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Review booking</Text>
      <Text style={styles.h1}>Confirm details</Text>
      <ReviewBlock rows={[
        ["Service", service.title],
        ["Date", booking.date],
        ["Time", booking.time],
        ["Address", booking.address],
        ["Priority", booking.priority],
        ["Notes", booking.notes || "No extra notes."]
      ]} />
      <PrimaryButton label="Submit booking" testID="submit-booking" onPress={() => onCreate(booking)} />
      <SecondaryButton
        label="Edit details"
        testID="edit-booking-details"
        onPress={() => nav.replace("BookingForm", { serviceId: booking.serviceId, draft: booking })}
      />
    </ScrollView>
  );
}

function BookingConfirmationScreen({ nav, request }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.successPanel}>
        <Text style={styles.kicker}>Confirmed</Text>
        <Text style={styles.h1}>{request.id}</Text>
        <Text style={styles.bodyText}>{request.title} is scheduled for {request.date} at {request.time}.</Text>
      </View>
      <ReviewBlock rows={[
        ["Address", request.address],
        ["Priority", request.priority],
        ["Status", request.status]
      ]} />
      <PrimaryButton label="View request" testID="view-created-request" onPress={() => nav.push("RequestDetail", { requestId: request.id })} />
      <SecondaryButton label="Back to home" testID="booking-home" onPress={() => nav.root("Home")} />
    </ScrollView>
  );
}

function RequestsScreen({ nav, requests }) {
  const [filter, setFilter] = useState("Active");
  const visibleRequests = requests.filter((request) => (filter === "All" ? true : request.status === filter));

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Requests</Text>
      <Text style={styles.h1}>Track and adjust</Text>
      <ChoiceRow options={["Active", "Completed", "Canceled", "All"]} value={filter} onChange={setFilter} testPrefix="request-filter" />
      {visibleRequests.map((request) => (
        <Pressable
          key={request.id}
          testID={`request-${request.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Open request ${request.id}`}
          onPress={() => nav.push("RequestDetail", { requestId: request.id })}
          style={styles.requestCard}
        >
          <View>
            <Text style={styles.cardEyebrow}>{request.id}</Text>
            <Text style={styles.cardTitle}>{request.title}</Text>
            <Text style={styles.cardBody}>{request.date} at {request.time}</Text>
          </View>
          <Text style={[styles.status, request.status === "Canceled" && styles.statusCanceled]}>{request.status}</Text>
        </Pressable>
      ))}
      {visibleRequests.length === 0 && <Text style={styles.emptyText}>No requests match this filter.</Text>}
    </ScrollView>
  );
}

function RequestDetailScreen({ nav, request, saved, onCancel }) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  if (!request) {
    return (
      <View style={styles.centered}>
        <Text style={styles.h2}>Request not found</Text>
        <SecondaryButton label="Go to requests" testID="missing-request-back" onPress={() => nav.root("Requests")} />
      </View>
    );
  }

  const editable = request.status === "Active";

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {saved && <Text style={styles.savedNotice}>Changes saved.</Text>}
      <Text style={styles.kicker}>{request.id}</Text>
      <Text style={styles.h1}>{request.title}</Text>
      <ReviewBlock rows={[
        ["Status", request.status],
        ["Date", request.date],
        ["Time", request.time],
        ["Address", request.address],
        ["Priority", request.priority],
        ["Notes", request.notes]
      ]} />
      <Text style={styles.sectionTitle}>Timeline</Text>
      {request.timeline.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.timelineRow}>
          <View style={styles.timelineDot} />
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
      {editable && (
        <>
          <PrimaryButton label="Edit request" testID="edit-request" onPress={() => nav.push("EditRequest", { request })} />
          <SecondaryButton label="Cancel request" testID="cancel-request" onPress={() => setConfirmingCancel(true)} danger />
        </>
      )}
      <Modal visible={confirmingCancel} animationType="fade" transparent>
        <View style={styles.modalScrim}>
          <View style={styles.modalCard}>
            <Text style={styles.h2}>Cancel request?</Text>
            <Text style={styles.bodyText}>This moves {request.id} to canceled and adds it to the request timeline.</Text>
            <PrimaryButton
              label="Yes, cancel"
              testID="confirm-cancel-request"
              onPress={() => {
                onCancel(request.id);
                setConfirmingCancel(false);
              }}
            />
            <SecondaryButton label="Keep request" testID="dismiss-cancel-request" onPress={() => setConfirmingCancel(false)} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function EditRequestScreen({ nav, request }) {
  const [date, setDate] = useState(request.date);
  const [time, setTime] = useState(request.time);
  const [priority, setPriority] = useState(request.priority);
  const [notes, setNotes] = useState(request.notes);
  const updatedRequest = { ...request, date, time, priority, notes };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Edit request</Text>
      <Text style={styles.h1}>{request.id}</Text>
      <Text style={styles.label}>Date</Text>
      <ChoiceRow options={DATES} value={date} onChange={setDate} testPrefix="edit-date" />
      <Text style={styles.label}>Time</Text>
      <ChoiceRow options={TIMES} value={time} onChange={setTime} testPrefix="edit-time" />
      <Text style={styles.label}>Priority</Text>
      <ChoiceRow options={PRIORITIES} value={priority} onChange={setPriority} testPrefix="edit-priority" />
      <Text style={styles.label}>Notes</Text>
      <TextInput
        testID="edit-request-notes"
        accessibilityLabel="Edit request notes"
        style={styles.input}
        value={notes}
        onChangeText={setNotes}
        multiline
      />
      <PrimaryButton
        label="Review changes"
        testID="review-request-changes"
        onPress={() => nav.push("EditRequestReview", { request: updatedRequest })}
      />
    </ScrollView>
  );
}

function EditRequestReviewScreen({ nav, request, onSave }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Review changes</Text>
      <Text style={styles.h1}>{request.id}</Text>
      <ReviewBlock rows={[
        ["Date", request.date],
        ["Time", request.time],
        ["Priority", request.priority],
        ["Notes", request.notes]
      ]} />
      <PrimaryButton
        label="Save changes"
        testID="save-request-changes"
        onPress={() => onSave({ ...request, timeline: [...request.timeline, "Updated"] })}
      />
      <SecondaryButton
        label="Edit details"
        testID="edit-request-details"
        onPress={() => nav.replace("EditRequest", { request })}
      />
    </ScrollView>
  );
}

function ProfileScreen({ nav, profile, setProfile }) {
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

function PreferencesScreen({ profile, setProfile }) {
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

function AddressesScreen({ profile, setProfile }) {
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

function Metric({ label, value }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.cardEyebrow}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function ChoiceRow({ options, value, onChange, testPrefix }) {
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

function ReviewBlock({ rows }) {
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

function ToggleRow({ label, value, onValueChange, testID }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.cardTitle}>{label}</Text>
      <Switch testID={testID} accessibilityLabel={label} value={value} onValueChange={onValueChange} />
    </View>
  );
}

function PrimaryButton({ label, onPress, testID, disabled }) {
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

function SecondaryButton({ label, onPress, testID, danger }) {
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

function notificationSummary(profile) {
  const channels = [
    profile.notifyPush && "push",
    profile.notifyEmail && "email",
    profile.notifySms && "SMS"
  ].filter(Boolean);
  const base = channels.length ? channels.join(", ") : "no channels";
  return `${base}${profile.quietHours ? " with quiet hours enabled" : ""}.`;
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F7F5EF"
  },
  shell: {
    flex: 1,
    backgroundColor: "#F7F5EF"
  },
  topBar: {
    height: 58,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomColor: "#E2DED4",
    borderBottomWidth: 1
  },
  brand: {
    color: "#23211E",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#D9D2C5",
    borderWidth: 1
  },
  iconButtonMuted: {
    width: 38,
    height: 38,
    opacity: 0.3
  },
  iconButtonText: {
    color: "#23211E",
    fontSize: 24,
    fontWeight: "700"
  },
  content: {
    flex: 1,
    marginBottom: TAB_BAR_HEIGHT + ANDROID_NAV_BAR_GAP
  },
  scroll: {
    padding: 18,
    paddingBottom: 28
  },
  hero: {
    paddingVertical: 18
  },
  kicker: {
    color: "#4d65a8",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase",
    marginBottom: 8
  },
  h1: {
    color: "#23211E",
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: 0,
    marginBottom: 10
  },
  h2: {
    color: "#23211E",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    letterSpacing: 0,
    marginBottom: 8
  },
  bodyText: {
    color: "#5D5851",
    fontSize: 16,
    lineHeight: 23,
    letterSpacing: 0
  },
  sectionTitle: {
    color: "#23211E",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0,
    marginTop: 12,
    marginBottom: 10
  },
  cardGrid: {
    gap: 12
  },
  serviceCard: {
    minHeight: 142,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    borderColor: "#E2DED4",
    borderWidth: 1,
    overflow: "hidden"
  },
  colorRail: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5
  },
  cardEyebrow: {
    color: "#D2A24F",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  cardTitle: {
    color: "#23211E",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    letterSpacing: 0,
    marginTop: 4
  },
  cardBody: {
    color: "#5D5851",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    marginTop: 4
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12
  },
  pill: {
    color: "#23211E",
    backgroundColor: "#F0ECE2",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: "700",
    overflow: "hidden"
  },
  inlinePanel: {
    marginTop: 18,
    padding: 16,
    backgroundColor: "#EAF1EC",
    borderColor: "#CBD9CF",
    borderWidth: 1,
    borderRadius: 8
  },
  panelTitle: {
    color: "#243D35",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4
  },
  detailHeader: {
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 5,
    borderRadius: 8,
    padding: 18,
    marginBottom: 12
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12
  },
  metric: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 14,
    borderColor: "#E2DED4",
    borderWidth: 1
  },
  metricValue: {
    color: "#23211E",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 4
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderColor: "#E2DED4",
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 8
  },
  checkMark: {
    color: "#2F7D6D",
    fontSize: 22,
    fontWeight: "900"
  },
  listText: {
    flex: 1,
    color: "#37332D",
    fontSize: 15,
    lineHeight: 21
  },
  label: {
    color: "#37332D",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 16,
    marginBottom: 8
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  choice: {
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D9D2C5",
    backgroundColor: "#FFFFFF",
    justifyContent: "center"
  },
  choiceActive: {
    borderColor: "#2F7D6D",
    backgroundColor: "#DDECE6"
  },
  choiceText: {
    color: "#37332D",
    fontSize: 14,
    fontWeight: "700"
  },
  choiceTextActive: {
    color: "#21584C"
  },
  input: {
    minHeight: 104,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D9D2C5",
    padding: 14,
    color: "#23211E",
    fontSize: 16,
    textAlignVertical: "top"
  },
  singleInput: {
    minHeight: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D9D2C5",
    paddingHorizontal: 14,
    color: "#23211E",
    fontSize: 16
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: "#23211E",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    paddingHorizontal: 18
  },
  buttonDisabled: {
    backgroundColor: "#A8A095"
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800"
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CFC6B8",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    paddingHorizontal: 18
  },
  secondaryButtonText: {
    color: "#23211E",
    fontSize: 16,
    fontWeight: "800"
  },
  secondaryDanger: {
    borderColor: "#C55A3C"
  },
  secondaryDangerText: {
    color: "#A83E23"
  },
  reviewBlock: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2DED4",
    overflow: "hidden",
    marginTop: 10
  },
  reviewRow: {
    padding: 14,
    borderBottomColor: "#EEE9DF",
    borderBottomWidth: 1
  },
  reviewLabel: {
    color: "#746C61",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  reviewValue: {
    color: "#23211E",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    marginTop: 3
  },
  successPanel: {
    padding: 18,
    borderRadius: 8,
    backgroundColor: "#DDECE6",
    borderColor: "#A9C6B8",
    borderWidth: 1
  },
  requestCard: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 15,
    borderColor: "#E2DED4",
    borderWidth: 1,
    marginBottom: 10
  },
  status: {
    color: "#21584C",
    backgroundColor: "#DDECE6",
    borderRadius: 8,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "800"
  },
  statusCanceled: {
    color: "#A83E23",
    backgroundColor: "#F4DFD8"
  },
  emptyText: {
    color: "#746C61",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 20
  },
  savedNotice: {
    color: "#21584C",
    backgroundColor: "#DDECE6",
    borderColor: "#A9C6B8",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 12,
    overflow: "hidden"
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4D65A8"
  },
  modalScrim: {
    flex: 1,
    backgroundColor: "rgba(35, 33, 30, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 22
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 18
  },
  settingRow: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderColor: "#E2DED4",
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginTop: 12
  },
  chevron: {
    color: "#746C61",
    fontSize: 20,
    fontWeight: "900"
  },
  toggleRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderColor: "#E2DED4",
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10
  },
  option: {
    minHeight: 58,
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#D9D2C5",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 10
  },
  optionActive: {
    borderColor: "#2F7D6D",
    backgroundColor: "#DDECE6"
  },
  optionText: {
    color: "#37332D",
    fontSize: 16,
    fontWeight: "700"
  },
  optionTextActive: {
    color: "#21584C"
  },
  tabBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: ANDROID_NAV_BAR_GAP,
    minHeight: TAB_BAR_HEIGHT,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#F7F5EF",
    borderTopColor: "#E2DED4",
    borderTopWidth: 1
  },
  tab: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  tabActive: {
    backgroundColor: "#23211E"
  },
  tabText: {
    color: "#5D5851",
    fontSize: 13,
    fontWeight: "800"
  },
  tabTextActive: {
    color: "#FFFFFF"
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    padding: 20
  }
});
