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

// ActivityScreen's segmented control swaps between these lists in-screen -
// same route, three states. Keyed by segment label; ids are unique across
// all three lists because they become testID suffixes (activity-item-{id}).
const ACTIVITY_ITEMS = {
  All: [
    { id: "evt-01", kind: "Booking", text: "REQ-1042 Home cleaning confirmed for tomorrow 10:30 AM" },
    { id: "evt-02", kind: "Alert", text: "Shopper is waiting on a substitution answer for REQ-1038" },
    { id: "evt-03", kind: "Receipt", text: "REQ-0977 Car service - $45 fee charged to Visa 4421" },
    { id: "evt-04", kind: "Update", text: "Cleaning team assigned to REQ-1042" },
    { id: "evt-05", kind: "Profile", text: "Primary address set to Home - 24 Cedar Street" }
  ],
  Alerts: [
    { id: "alr-01", kind: "Alert", text: "Shopper is waiting on a substitution answer for REQ-1038" },
    { id: "alr-02", kind: "Alert", text: "REQ-1042 team arrives in a 30-minute window tomorrow" },
    { id: "alr-03", kind: "Alert", text: "Quiet hours held 2 notifications overnight" },
    { id: "alr-04", kind: "Alert", text: "Priority on REQ-1038 was raised to High" }
  ],
  Receipts: [
    { id: "rcp-01", kind: "Receipt", text: "REQ-0977 Car service - $45 fee charged to Visa 4421" },
    { id: "rcp-02", kind: "Receipt", text: "REQ-0951 Grocery run - $12 fee + $84.20 items" },
    { id: "rcp-03", kind: "Receipt", text: "REQ-0902 Home cleaning - $88 charged to Visa 4421" },
    { id: "rcp-04", kind: "Receipt", text: "REQ-0877 Plumber - $120 charged to Visa 4421" }
  ]
};

// Billing seed data. Two values are deliberately hostile: INV-2405 has
// amount: 0 and INV-2408 has status: "" - both exist to catch the
// {value && <Text>} crash class ({invoice.amount && ...} renders a bare 0
// outside <Text> and hard-crashes RN). Screens must branch with ?: or !!.
const INVOICES = [
  { id: "INV-2401", label: "April home cleaning", amount: 88, status: "Paid" },
  { id: "INV-2402", label: "Plumber call-out", amount: 120, status: "Due" },
  { id: "INV-2403", label: "Grocery run fee", amount: 12, status: "Paid" },
  { id: "INV-2404", label: "Car service fee", amount: 45, status: "Overdue" },
  { id: "INV-2405", label: "Welcome promo credit", amount: 0, status: "Applied" },
  { id: "INV-2406", label: "March home cleaning", amount: 88, status: "Paid" },
  { id: "INV-2407", label: "Errand batch", amount: 27.5, status: "Due" },
  { id: "INV-2408", label: "Statement adjustment", amount: 16.2, status: "" },
  { id: "INV-2409", label: "Gutter repair", amount: 210, status: "Due" },
  { id: "INV-2410", label: "February home cleaning", amount: 88, status: "Paid" },
  { id: "INV-2411", label: "Priority surcharge", amount: 9, status: "Due" },
  { id: "INV-2412", label: "Car wash add-on", amount: 18, status: "Paid" }
];

// Visa 4421 matches the card ACTIVITY_ITEMS receipts already reference.
const PAYMENT_METHODS = [
  { id: "pm-visa-4421", brand: "Visa", last4: "4421", name: "Alex Morgan", expiry: "09/27" },
  { id: "pm-mc-8810", brand: "Mastercard", last4: "8810", name: "Alex Morgan", expiry: "01/28" }
];

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
    anchors: ["forgot-back"],
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
    edges: [
      { to: "ServiceDetail", requiresInput: false, gated: false, cycle: false },
      { to: "Search", requiresInput: false, gated: false, cycle: false },
      { to: "Activity", requiresInput: false, gated: false, cycle: false }
    ]
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
    anchors: ["request-detail"],
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
      { to: "Preferences", requiresInput: false, gated: false, cycle: false },
      { to: "SupportChat", requiresInput: false, gated: false, cycle: false }
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
    terminal: false,
    trap: null,
    escape: null,
    edges: [{ to: "LegalTerms", requiresInput: false, gated: false, cycle: false }]
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
  },
  {
    name: "Search",
    tier: "A",
    addressing: "exhaustive",
    anchors: ["search-input"],
    tab: "Home",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: "Requires generated input - results render only when the trimmed query is >= 2 chars, so a crawler that never types sees 0 new edges",
    escape: "Type at least 2 characters into search-input (e.g. \"pl\" matches Plumber); a single character still shows search-empty; tap a search-result-{serviceId} row to reach ServiceDetail",
    edges: [{ to: "ServiceDetail", requiresInput: true, gated: false, cycle: false }]
  },
  {
    name: "Activity",
    tier: "A",
    addressing: "exhaustive",
    anchors: ["activity-seg-all"],
    tab: "Home",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: true,
    trap: "In-screen state vs navigation - three segments swap the list content while the route never changes",
    escape: "Tap activity-seg-all, activity-seg-alerts, activity-seg-receipts and record 3 states for 1 route - not 3 routes, and not 1 state",
    edges: []
  },
  {
    name: "SupportChat",
    tier: "A",
    addressing: "exhaustive",
    anchors: ["support-title"],
    tab: "Profile",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: true,
    trap: "Slow load - support-loading renders for 1500ms after every mount (screens remount per push, so the delay replays on every visit) before support-message-{n} and support-reply appear",
    escape: "Poll until support-loading is gone before snapshotting - settled content appears ~1.5s after entry",
    edges: []
  },
  {
    name: "LegalTerms",
    tier: "A",
    addressing: "exhaustive",
    anchors: ["legal-close"],
    tab: null,
    instances: 1,
    noBack: true,
    noTabs: true,
    terminal: true,
    trap: "Dead end - no top back button and no tab bar; Android hardware back backgrounds the app instead of navigating",
    escape: "Find and tap the in-content legal-close (calls nav.back) - it is the only exit",
    edges: []
  },
  {
    name: "Billing",
    tier: "A",
    addressing: "exhaustive",
    anchors: ["open-payment-methods"],
    tab: "Billing",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: "4th tab root - starts the app's deepest chain (Billing -> PaymentMethods -> AddCard and Billing -> PaymentReview -> PaymentResult); seeded INV-2405 has amount: 0 and INV-2408 has status: '' to exercise falsy-and rendering",
    escape: "Reachable from tab-billing in the tab bar; tap any billing-invoice-{id} row to reach PaymentReview, or open-payment-methods to go deeper via cards",
    edges: [
      { to: "PaymentReview", requiresInput: false, gated: false, cycle: false },
      { to: "PaymentMethods", requiresInput: false, gated: false, cycle: false }
    ]
  },
  {
    name: "PaymentMethods",
    tier: "A",
    addressing: "exhaustive",
    anchors: ["add-card"],
    tab: "Billing",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: "Depth - second level of the billing chain; add-card is the only edge deeper",
    escape: "Reached via open-payment-methods on Billing; tap add-card to reach AddCard, nav-back returns to Billing",
    edges: [{ to: "AddCard", requiresInput: false, gated: false, cycle: false }]
  },
  {
    name: "AddCard",
    tier: "A",
    addressing: "exhaustive",
    anchors: ["card-submit"],
    tab: "Billing",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: "Format validation - card-submit stays disabled until src/validate.js cardValid passes on all four fields; non-empty garbage does not enable it",
    escape: "Type 16 digits into card-number (spaces/dashes allowed), MM/YY with month 01-12 into card-expiry, exactly 3 digits into card-cvv, and any non-blank card-name; card-submit then enables and returns to PaymentMethods",
    edges: [{ to: "PaymentMethods", requiresInput: true, gated: true, cycle: true }]
  },
  {
    name: "PaymentReview",
    tier: "A",
    addressing: "exhaustive",
    anchors: ["payment-pay"],
    tab: "Billing",
    instances: 12,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: "Branch point - the simulate-decline Switch decides which of PaymentResult's two terminal states payment-pay produces",
    escape: "simulate-decline is reachable before paying; leave it off and tap payment-pay for success, flip it on and pay again for the declined state",
    edges: [{ to: "PaymentResult", requiresInput: false, gated: false, cycle: false }]
  },
  {
    name: "PaymentResult",
    tier: "A",
    addressing: "exhaustive",
    anchors: ["payment-result"],
    tab: "Billing",
    instances: 24,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: "Two terminal states on one route - success renders payment-success + payment-done, declined renders payment-declined + payment-retry; only payment-result is present in both",
    escape: "Reach both states by flipping simulate-decline on PaymentReview; payment-retry replaces back to PaymentReview, payment-done returns to the Billing root",
    edges: [
      { to: "PaymentReview", requiresInput: false, gated: false, cycle: true },
      { to: "Billing", requiresInput: false, gated: false, cycle: false }
    ]
  }
];

module.exports = {
  SERVICES,
  DATES,
  TIMES,
  PRIORITIES,
  INITIAL_REQUESTS,
  ADDRESSES,
  ACTIVITY_ITEMS,
  INVOICES,
  PAYMENT_METHODS,
  ANDROID_NAV_BAR_GAP_ANDROID,
  TAB_BAR_HEIGHT,
  ROUTE_META
};
