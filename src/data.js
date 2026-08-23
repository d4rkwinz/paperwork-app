// src/data.js  (CommonJS: must be require()-able by scripts/*.test.js under plain node)

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

// ponytail: hardcoded guess for the Android system nav bar, carried over from
// v1.0. A 4th tab tightens the tab bar and this is the knob that shifts.
// Upgrade path: react-native-safe-area-context, if Expo already provides it.
const ANDROID_NAV_BAR_GAP_ANDROID = 48;
const TAB_BAR_HEIGHT = 72;

// ROUTE_META: one entry per route in App.js's ROUTES map. This is the
// ground-truth source Task 14's crawler-graph checker builds from, so
// "edges" here are derived from the actual nav.push/replace/root call sites
// in each screen (src/screens/*.js), not guessed. See task-5-report.md for
// how each v1.0 route's edges/anchors/instances were determined.
const ROUTE_META = [
  {
    name: "Login",
    tier: "A",
    addressing: "exhaustive",
    anchors: ["login-submit"],
    tab: null,
    instances: 1,
    noBack: true,
    noTabs: true,
    terminal: false,
    trap: "Gate: crawler must type into two fields to progress",
    escape: "Type both fields and submit, or tap login-guest",
    edges: [
      { to: "Onboarding", requiresInput: true, gated: false, cycle: false },
      { to: "Home", requiresInput: false, gated: false, cycle: false },
      { to: "ForgotPassword", requiresInput: false, gated: false, cycle: false }
    ]
  },
  {
    name: "ForgotPassword",
    tier: "A",
    addressing: "exhaustive",
    anchors: ["forgot-submit"],
    tab: null,
    instances: 1,
    noBack: false,
    noTabs: true,
    terminal: false,
    trap: "Off-path branch; 2 states on 1 route",
    escape: "Reachable from login-forgot; forgot-back returns to Login",
    edges: [{ to: "Login", requiresInput: false, gated: false, cycle: true }]
  },
  {
    name: "Onboarding",
    tier: "A",
    addressing: "exhaustive",
    anchors: ["onboarding-next"],
    tab: null,
    instances: 3,
    noBack: false,
    noTabs: true,
    terminal: false,
    trap: "State aliasing - 3 near-identical states on one route",
    escape: "3 distinct states recorded, terminates at step 3; onboarding-skip is the shortcut",
    edges: [{ to: "Home", requiresInput: false, gated: false, cycle: false }]
  },
  {
    name: "Home",
    tier: "v1",
    addressing: "exhaustive",
    anchors: ["service-cleaning"],
    tab: "Home",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: null,
    escape: null,
    edges: [{ to: "ServiceDetail", requiresInput: false, gated: false, cycle: false }]
  },
  {
    name: "ServiceDetail",
    tier: "v1",
    addressing: "exhaustive",
    anchors: ["book-service"],
    tab: "Home",
    instances: 4,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: null,
    escape: null,
    edges: [
      { to: "BookingForm", requiresInput: false, gated: false, cycle: false },
      { to: "Home", requiresInput: false, gated: true, cycle: false }
    ]
  },
  {
    name: "BookingForm",
    tier: "v1",
    addressing: "exhaustive",
    anchors: ["review-booking"],
    tab: "Home",
    instances: 4,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: null,
    escape: null,
    edges: [
      { to: "BookingReview", requiresInput: true, gated: false, cycle: false },
      { to: "Home", requiresInput: false, gated: true, cycle: false }
    ]
  },
  {
    name: "BookingReview",
    tier: "v1",
    addressing: "exhaustive",
    anchors: ["submit-booking"],
    tab: "Home",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: null,
    escape: null,
    edges: [
      { to: "BookingConfirmation", requiresInput: false, gated: false, cycle: false },
      { to: "BookingForm", requiresInput: false, gated: false, cycle: true }
    ]
  },
  {
    name: "BookingConfirmation",
    tier: "v1",
    addressing: "exhaustive",
    anchors: ["view-created-request"],
    tab: "Home",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: null,
    escape: null,
    edges: [
      { to: "RequestDetail", requiresInput: false, gated: false, cycle: false },
      { to: "Home", requiresInput: false, gated: false, cycle: false }
    ]
  },
  {
    name: "Requests",
    tier: "v1",
    addressing: "exhaustive",
    anchors: ["request-filter-active"],
    tab: "Requests",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: null,
    escape: null,
    edges: [{ to: "RequestDetail", requiresInput: false, gated: false, cycle: false }]
  },
  {
    name: "RequestDetail",
    tier: "v1",
    addressing: "exhaustive",
    anchors: ["edit-request"],
    tab: "Requests",
    instances: 3,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: null,
    escape: null,
    edges: [
      { to: "EditRequest", requiresInput: false, gated: true, cycle: false },
      { to: "Home", requiresInput: false, gated: true, cycle: false }
    ]
  },
  {
    name: "EditRequest",
    tier: "v1",
    addressing: "exhaustive",
    anchors: ["review-request-changes"],
    tab: "Requests",
    instances: 2,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: null,
    escape: null,
    edges: [
      { to: "EditRequestReview", requiresInput: false, gated: false, cycle: false },
      { to: "Home", requiresInput: false, gated: true, cycle: false }
    ]
  },
  {
    name: "EditRequestReview",
    tier: "v1",
    addressing: "exhaustive",
    anchors: ["save-request-changes"],
    tab: "Requests",
    instances: 2,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: null,
    escape: null,
    edges: [
      { to: "RequestDetail", requiresInput: false, gated: false, cycle: false },
      { to: "EditRequest", requiresInput: false, gated: false, cycle: true }
    ]
  },
  {
    name: "Profile",
    tier: "v1",
    addressing: "exhaustive",
    anchors: ["open-addresses"],
    tab: "Profile",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: null,
    escape: null,
    edges: [
      { to: "Addresses", requiresInput: false, gated: false, cycle: false },
      { to: "Preferences", requiresInput: false, gated: false, cycle: false }
    ]
  },
  {
    name: "Preferences",
    tier: "v1",
    addressing: "exhaustive",
    anchors: ["toggle-push"],
    tab: "Profile",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: true,
    trap: null,
    escape: null,
    edges: []
  },
  {
    name: "Addresses",
    tier: "v1",
    addressing: "exhaustive",
    anchors: ["select-address-home-24-cedar-street"],
    tab: "Profile",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: true,
    trap: null,
    escape: null,
    edges: []
  }
];

module.exports = {
  SERVICES,
  DATES,
  TIMES,
  PRIORITIES,
  INITIAL_REQUESTS,
  ADDRESSES,
  ANDROID_NAV_BAR_GAP_ANDROID,
  TAB_BAR_HEIGHT,
  ROUTE_META
};
