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

// v1.1 expansion (Task 13): 20 generated services appended AFTER the 4 v1.0
// originals, which stay verbatim and first - GUIDELINES.md's flows and
// external agent suites target service-{cleaning,plumbing,groceries,car} by
// testID (service-plumbing is Flow 1's entry point). Same deterministic
// index-based generator pattern as DOCUMENTS/PROVIDERS below: pure function
// of the loop index over fixed tables, no Math.random(), no Date.
const EXTRA_SERVICE_TITLES = [
  "Lawn care", "Window washing", "Pest control", "Dog walking", "Laundry pickup",
  "Handyman visit", "Electrical check", "Gutter cleaning", "Appliance repair", "Furniture assembly",
  "Pool maintenance", "Carpet shampoo", "Junk removal", "Package returns", "Bike tune-up",
  "House sitting", "Meal prep", "Snow removal", "Pressure washing", "Closet organizing"
];
const EXTRA_SERVICE_CATEGORIES = ["Home", "Repair", "Errands", "Auto", "Outdoor"];
const EXTRA_SERVICE_ETAS = ["45-60 min", "1-2 hr", "2-3 hr", "Half day", "Same day"];
const EXTRA_SERVICE_ACCENTS = ["#2F7D6D", "#C55A3C", "#4D65A8", "#8B6F35", "#6B4F8A", "#3E7A9C"];
for (let i = 0; i < 20; i += 1) {
  const title = EXTRA_SERVICE_TITLES[i];
  SERVICES.push({
    id: `svc-${String(i + 5).padStart(2, "0")}`,
    title,
    category: EXTRA_SERVICE_CATEGORIES[i % 5],
    short: `${title} handled by a vetted local pro.`,
    details: `Book ${title.toLowerCase()} with upfront pricing and status updates from start to finish.`,
    price: `$${25 + ((i * 13) % 110)}`,
    eta: EXTRA_SERVICE_ETAS[i % 5],
    accent: EXTRA_SERVICE_ACCENTS[i % 6]
  });
}

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

// v1.1 expansion (Task 13): 37 generated requests appended AFTER the 3 v1.0
// originals (REQ-1042, REQ-1038, REQ-0977 - Flows 2 and 3 target them by id,
// so they stay verbatim and first). Deterministic index-based generator, and
// every field references a seeded value (SERVICES / DATES / TIMES /
// ADDRESSES / PRIORITIES) so the referential checks in scripts/data.test.js
// hold. Statuses cycle Active/Completed/Canceled so every request is
// reachable through the Requests filter. Active total = 2 originals + 13
// generated (i % 3 === 0) = 15, which is the instance count for the
// Active-gated Reschedule / EditRequest / EditRequestReview routes.
const REQUEST_STATUSES = ["Active", "Completed", "Canceled"];
const REQUEST_TIMELINES = {
  Active: ["Booked", "Assigned"],
  Completed: ["Booked", "Assigned", "Completed"],
  Canceled: ["Booked", "Canceled"]
};
for (let i = 0; i < 37; i += 1) {
  const service = SERVICES[i % SERVICES.length];
  const status = REQUEST_STATUSES[i % 3];
  INITIAL_REQUESTS.push({
    id: `REQ-${2001 + i}`,
    serviceId: service.id,
    title: service.title,
    status,
    date: DATES[i % 4],
    time: TIMES[(i * 3) % 4],
    address: ADDRESSES[i % 3],
    priority: PRIORITIES[(i * 2) % 3],
    notes: `Seeded request ${i + 1} of 37 for ${service.title.toLowerCase()}.`,
    timeline: [...REQUEST_TIMELINES[status]]
  });
}

// Seed profile, extracted from App.js so DeleteAccount's resetAll has a
// canonical object to reset to. Values are byte-identical to the v1.0 inline
// initializer.
const INITIAL_PROFILE = {
  name: "Alex Morgan",
  phone: "+1 555 014 2920",
  email: "alex@example.com",
  primaryAddress: ADDRESSES[0],
  notifyPush: true,
  notifyEmail: true,
  notifySms: false,
  quietHours: true
};

// HelpCenter and SupportFaq render this same list - the alias-pair trap
// depends on the two routes sharing one data source so they can never drift.
const HELP_TOPICS = [
  "How do I reschedule a request?",
  "Why was my card charged twice?",
  "Can I change my primary address?",
  "How do quiet hours affect alerts?",
  "How do I cancel a booking?"
];

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

// Documents seed: generated by a bounded loop over fixed inputs - no
// Math.random() anywhere, because DOCUMENTS is ground truth for the crawler
// graph and must be byte-identical across runs. 60 items / DOCS_PAGE_SIZE 10
// means Documents' docs-load-more disappears after exactly 5 taps (6 pages),
// which is what makes the load-more trap provably terminating.
const DOC_KINDS = ["Invoice", "Receipt", "Policy", "Statement", "Notice", "Contract"];
const DOCUMENTS = [];
for (let i = 0; i < 60; i += 1) {
  const kind = DOC_KINDS[i % DOC_KINDS.length];
  DOCUMENTS.push({
    id: `DOC-${1000 + i}`,
    title: `${kind} ${2024 + (i % 3)}-${String((i % 12) + 1).padStart(2, "0")}`,
    kind,
    sizeKb: 40 + ((i * 17) % 900),
    year: 2024 + (i % 3)
  });
}
const DOCS_PAGE_SIZE = 10;

// Visa 4421 matches the card ACTIVITY_ITEMS receipts already reference.
const PAYMENT_METHODS = [
  { id: "pm-visa-4421", brand: "Visa", last4: "4421", name: "Alex Morgan", expiry: "09/27" },
  { id: "pm-mc-8810", brand: "Mastercard", last4: "8810", name: "Alex Morgan", expiry: "01/28" }
];

// ---------------------------------------------------------------------------
// Tier B seed collections (Task 12). Every generator is a pure function of
// its loop index over fixed lookup tables - no Math.random(), no Date - so
// the collections (and the crawler ground-truth graph built from them) are
// byte-identical across runs. Items are keyed by a unique `id` (the BULK
// contract below).

// 8 of the 25 notifications carry a deepLink { route, params } into OTHER
// clusters (requests, billing, insurance, documents). NotificationDetail
// renders an accessibilityLabel-only "Open linked item" action for them -
// the cross-cutting edges that turn the route tree into a graph. Indices are
// chosen so each link's kind matches its notification kind (kinds cycle
// i % 5). Every param value below must resolve in the target's collection;
// scripts/data.test.js enforces this.
const NOTIFICATION_KINDS = ["Request update", "Invoice", "Insurance", "Document", "System"];
const NOTIFICATION_TITLES = [
  "Update on your request",
  "An invoice needs attention",
  "Policy notice",
  "New document available",
  "Service notice"
];
const NOTIFICATION_BODIES = [
  "There is fresh activity on one of your service requests.",
  "An invoice on your account is awaiting payment.",
  "One of your insurance policies has an update worth reviewing.",
  "A new document was added to your files.",
  "A general update about your Paperwork account."
];
const NOTIFICATION_LINKS = {
  0: { route: "RequestDetail", params: { requestId: "REQ-1042" } },
  5: { route: "RequestDetail", params: { requestId: "REQ-1038" } },
  1: { route: "PaymentReview", params: { invoiceId: "INV-2402" } },
  6: { route: "PaymentReview", params: { invoiceId: "INV-2404" } },
  2: { route: "PolicyDetail", params: { policyId: "POL-01" } },
  7: { route: "PolicyDetail", params: { policyId: "POL-04" } },
  3: { route: "DocumentDetail", params: { docId: "DOC-1002" } },
  8: { route: "DocumentDetail", params: { docId: "DOC-1017" } }
};
const NOTIFICATIONS = [];
for (let i = 0; i < 25; i += 1) {
  NOTIFICATIONS.push({
    id: `NTF-${String(i + 1).padStart(2, "0")}`,
    kind: NOTIFICATION_KINDS[i % 5],
    title: `${NOTIFICATION_TITLES[i % 5]} #${i + 1}`,
    body: NOTIFICATION_BODIES[i % 5],
    when: `Apr ${1 + (i % 28)}, ${TIMES[i % 4]}`,
    ...(NOTIFICATION_LINKS[i] ? { deepLink: NOTIFICATION_LINKS[i] } : {})
  });
}

const POLICIES = [
  { id: "POL-01", name: "Home shield", type: "Homeowners", premium: "$42/mo", renewal: "Jul 1, 2026", status: "Active", coverage: "$250,000 dwelling" },
  { id: "POL-02", name: "Auto basic", type: "Auto", premium: "$61/mo", renewal: "Sep 12, 2026", status: "Active", coverage: "$50,000 liability" },
  { id: "POL-03", name: "Renters plus", type: "Renters", premium: "$14/mo", renewal: "Feb 3, 2027", status: "Active", coverage: "$30,000 contents" },
  { id: "POL-04", name: "Travel annual", type: "Travel", premium: "$9/mo", renewal: "May 20, 2026", status: "Lapsed", coverage: "$10,000 medical" },
  { id: "POL-05", name: "Device care", type: "Electronics", premium: "$7/mo", renewal: "Nov 8, 2026", status: "Active", coverage: "$4,000 replacement" },
  { id: "POL-06", name: "Pet health", type: "Pet", premium: "$23/mo", renewal: "Aug 15, 2026", status: "Active", coverage: "$8,000 annual vet" }
];

// (i % 10, i % 6) name pairs are unique across 30 items (lcm(10, 6) = 30).
const PROVIDER_FIRST = ["Sam", "Riley", "Jordan", "Casey", "Morgan", "Avery", "Quinn", "Taylor", "Jamie", "Drew"];
const PROVIDER_LAST = ["Alvarez", "Chen", "Okafor", "Novak", "Reyes", "Kim"];
const PROVIDER_SPECIALTIES = ["Plumbing", "Cleaning", "Electrical", "Landscaping", "Auto repair", "Handyman"];
const PROVIDER_CITIES = ["Riverton", "Lakeside", "Mapleton", "Fairview", "Kingsport"];
const PROVIDERS = [];
for (let i = 0; i < 30; i += 1) {
  PROVIDERS.push({
    id: `PRV-${1001 + i}`,
    name: `${PROVIDER_FIRST[i % 10]} ${PROVIDER_LAST[i % 6]}`,
    specialty: PROVIDER_SPECIALTIES[i % 6],
    rating: `${(3 + ((i * 7) % 20) / 10).toFixed(1)} stars`,
    city: PROVIDER_CITIES[i % 5],
    phone: `+1 555 0${200 + i}`
  });
}

const REMINDER_DAY_LABELS = [
  "Mon Apr 21", "Tue Apr 22", "Wed Apr 23", "Thu Apr 24", "Fri Apr 25",
  "Sat Apr 26", "Sun Apr 27", "Mon Apr 28", "Tue Apr 29"
];
const REMINDER_TASKS = ["Renew insurance", "Pay invoice", "File warranty claim", "Confirm cleaning", "Water plants"];
const RECURRENCE_LABELS = ["None", "Daily", "Weekly", "Monthly"];
const REMINDERS = [];
for (let i = 0; i < 45; i += 1) {
  REMINDERS.push({
    id: `REM-${1001 + i}`,
    title: `${REMINDER_TASKS[i % 5]} #${i + 1}`,
    day: REMINDER_DAY_LABELS[i % 9],
    time: TIMES[i % 4],
    recurrence: RECURRENCE_LABELS[i % 4],
    note: `Reminder ${i + 1} of 45, from the deterministic seed generator.`
  });
}

// Month view rows: one per distinct day (45 / 9 = 5 reminders each).
const REMINDER_DAYS = REMINDER_DAY_LABELS.map((day, index) => ({
  id: `DAY-${index + 1}`,
  day,
  count: REMINDERS.filter((reminder) => reminder.day === day).length
}));

const RECURRENCES = [
  { id: "none", label: "None", description: "Fires once, then clears" },
  { id: "daily", label: "Daily", description: "Every day at the set time" },
  { id: "weekly", label: "Weekly", description: "Same weekday each week" },
  { id: "monthly", label: "Monthly", description: "Same date each month" }
];

const MESSAGES = [
  { id: "MSG-01", from: "You", sent: "Apr 18, 9:12 AM", body: "Hi - are you available Tuesday morning?" },
  { id: "MSG-02", from: "Provider", sent: "Apr 18, 9:40 AM", body: "Tuesday works. Does 10:30 AM suit you?" },
  { id: "MSG-03", from: "You", sent: "Apr 18, 9:52 AM", body: "10:30 is perfect. The gate code is 4421." },
  { id: "MSG-04", from: "Provider", sent: "Apr 18, 10:05 AM", body: "Got it. I will bring the replacement fittings." },
  { id: "MSG-05", from: "You", sent: "Apr 19, 8:15 AM", body: "Quick note - please park in the visitor spot." },
  { id: "MSG-06", from: "Provider", sent: "Apr 19, 8:20 AM", body: "Will do. See you Tuesday at 10:30 AM." }
];

// Security hub rows: each row links to a DIFFERENT route, so this list uses
// the linkField shape (every item MUST carry `link`, or the row has nowhere
// to go - scripts/data.test.js enforces this).
const SECURITY_ITEMS = [
  { id: "password", title: "Change password", sub: "Last changed 90 days ago", link: { route: "ChangePassword" } },
  { id: "twofactor", title: "Two-factor authentication", sub: "Off - set up an authenticator", link: { route: "TwoFactorSetup", params: { step: 1 } } },
  { id: "export", title: "Export your data", sub: "Download everything as an archive", link: { route: "DataExport", params: { exportId: "EXP-01" } } }
];

// Single seeded export: DataExport and ExportStatus are 1-instance details
// over the same item.
const EXPORTS = [
  { id: "EXP-01", label: "Account data export", format: "ZIP archive", size: "2.4 MB", requested: "Apr 20, 9:00 AM", status: "Ready to download" }
];

// Single seeded claim receipt: ClaimWizard's finish always lands on CLM-01
// via BULK.ClaimWizard.nextParams (the wizard drops policyId on step
// advance, so the receipt cannot vary per policy - a static seeded receipt
// keeps the chain deterministic instead).
const CLAIMS = [
  { id: "CLM-01", label: "Claim CLM-01 received", policy: "Home shield", status: "Received", filed: "Apr 21, 9:30 AM", eta: "3-5 business days" }
];

// ponytail: hardcoded guess for the Android system nav bar, carried over from
// v1.0. A 4th tab tightens the tab bar and this is the knob that shifts.
// Upgrade path: react-native-safe-area-context, if Expo already provides it.
const ANDROID_NAV_BAR_GAP_ANDROID = 48;
const TAB_BAR_HEIGHT = 72;

// ROUTE_META: one entry per route in App.js's ROUTES map. This is the
// ground-truth source Task 14's crawler-graph checker builds from, so
// "edges" are derived from actual call sites, not guessed.
//
// Edge convention (apply uniformly when adding routes):
//   An edge A -> B exists wherever an IN-CONTENT control rendered on route
//   A - a button/Pressable/row inside the screen's own content, including
//   shared components it renders such as ui.js's NotFound - causes a route
//   change to B, REGARDLESS of which nav method implements it (nav.push,
//   nav.replace, nav.root, or nav.back). So AddCard -> PaymentMethods
//   (card-submit calls nav.back()) and LegalTerms -> Preferences
//   (legal-close calls nav.back()) are edges: for a nav.back() edge, the
//   target is the route that pushed this one; a route pushed by more than
//   one parent gets one back-edge per parent (DocumentDetail -> Documents
//   plus DocumentDetail -> NotificationDetail, the deep-link entry). Every
//   route that renders the NotFound guard gets a "Home, gated: true" edge
//   from notfound-home's nav.root("Home") - gated because it only renders
//   when the route's params dereference fails. gated: true generally marks
//   an edge available only in some states or entry paths of the route: the
//   NotFound fallback, NotificationDetail's 8-of-25 deep-link button, or a
//   back target that depends on which parent pushed the route.
//
//   Chrome back is NOT modeled: the shell's top-bar back button and Android
//   hardware back are universal stack behavior available on every
//   non-NO_BACK route - a property of the shell, not of the graph.
//
// See task-5-report.md for how each v1.0 route's edges/anchors/instances
// were determined.
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
    escape: "3 distinct states recorded, terminates at step 3; onboarding-skip is the shortcut. Below step 3, onboarding-next re-pushes this same route with step + 1 (the declared self-edge)",
    edges: [
      { to: "Home", requiresInput: false, gated: false, cycle: false },
      // onboarding-next below step 3: nav.push("Onboarding", { step: step + 1 }),
      // the same step-advance self-edge mechanic ClaimWizard/TwoFactorSetup declare.
      { to: "Onboarding", requiresInput: false, gated: false, cycle: true }
    ]
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
      { to: "Activity", requiresInput: false, gated: false, cycle: false },
      { to: "Inbox", requiresInput: false, gated: false, cycle: false }
    ]
  },
  {
    name: "ServiceDetail",
    tier: "v1",
    addressing: "exhaustive",
    anchors: ["book-service"],
    tab: "Home",
    // One instance per SERVICES item (24 after the Task 13 expansion).
    instances: 24,
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
    // One instance per serviceId pushed by ServiceDetail's book-service (24).
    instances: 24,
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
    // Anchor moved off request-filter-active in Task 9: the filter ChoiceRow
    // now lives inside the bottom-sheet Modal, so request-filter-* only
    // renders while the sheet is open. open-filter-sheet renders in every
    // state of the route.
    anchors: ["open-filter-sheet"],
    tab: "Requests",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: "Overlay state that is not a route - the filter lives in a bottom-sheet Modal, so request-filter-* options exist only while the sheet is open, and opening/closing it changes screen state, never the route",
    escape: "Tap open-filter-sheet, then tap a request-filter-{value} option (applies the filter and closes the sheet); close-filter-sheet or Android hardware back dismisses without changing the filter",
    edges: [
      { to: "RequestDetail", requiresInput: false, gated: false, cycle: false },
      { to: "RemindersMonth", requiresInput: false, gated: false, cycle: false }
    ]
  },
  {
    name: "RequestDetail",
    tier: "v1",
    addressing: "exhaustive",
    anchors: ["request-detail"],
    tab: "Requests",
    // One instance per INITIAL_REQUESTS item (40 after the Task 13 expansion).
    instances: 40,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: null,
    escape: null,
    edges: [
      { to: "EditRequest", requiresInput: false, gated: true, cycle: false },
      { to: "Reschedule", requiresInput: false, gated: true, cycle: false },
      { to: "Home", requiresInput: false, gated: true, cycle: false }
    ]
  },
  {
    name: "Reschedule",
    tier: "A",
    addressing: "exhaustive",
    anchors: ["reschedule-submit"],
    tab: "Requests",
    // One instance per ACTIVE request only (15 of 40) - reschedule-request
    // renders on RequestDetail only while request.status is Active.
    instances: 15,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: "Precondition-gated edge - reschedule-request renders on RequestDetail only while request.status is Active, so this route is invisible from Completed/Canceled requests",
    escape: "Enter from an Active request (e.g. REQ-1042 or REQ-1038); Completed REQ-0977 legitimately has no reschedule-request control - the missing edge is correct, not a crawler gap",
    edges: [
      { to: "RequestDetail", requiresInput: false, gated: false, cycle: true },
      { to: "Home", requiresInput: false, gated: true, cycle: false }
    ]
  },
  {
    name: "EditRequest",
    tier: "v1",
    addressing: "exhaustive",
    anchors: ["review-request-changes"],
    tab: "Requests",
    // One instance per ACTIVE request only (15 of 40) - edit-request renders
    // on RequestDetail behind the same status gate as reschedule-request.
    instances: 15,
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
    // Follows EditRequest: one instance per ACTIVE request (15 of 40).
    instances: 15,
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
      { to: "SupportChat", requiresInput: false, gated: false, cycle: false },
      { to: "HelpCenter", requiresInput: false, gated: false, cycle: false },
      { to: "Referral", requiresInput: false, gated: false, cycle: true },
      { to: "DangerZone", requiresInput: false, gated: false, cycle: false },
      { to: "Directory", requiresInput: false, gated: false, cycle: false },
      { to: "Security", requiresInput: false, gated: false, cycle: false }
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
    edges: [
      { to: "LegalTerms", requiresInput: false, gated: false, cycle: false },
      { to: "SupportFaq", requiresInput: false, gated: false, cycle: false }
    ]
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
    terminal: false,
    trap: "Dead end - no top back button and no tab bar; Android hardware back backgrounds the app instead of navigating",
    escape: "Find and tap the in-content legal-close (calls nav.back) - it is the only exit",
    edges: [{ to: "Preferences", requiresInput: false, gated: false, cycle: true }]
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
      { to: "PaymentMethods", requiresInput: false, gated: false, cycle: false },
      { to: "Documents", requiresInput: false, gated: false, cycle: false },
      { to: "Policies", requiresInput: false, gated: false, cycle: false }
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
    edges: [
      { to: "PaymentResult", requiresInput: false, gated: false, cycle: false },
      { to: "Home", requiresInput: false, gated: true, cycle: false }
    ]
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
  },
  {
    name: "Documents",
    tier: "A",
    addressing: "exhaustive",
    anchors: ["docs-count"],
    tab: "Billing",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: "Load-more growth - docs-load-more appends the next 10 of 60 docs in place, so the same route gains new doc-{id} rows after each tap; the crawler must re-enqueue the changed screen and still terminate",
    escape: "Tap docs-load-more repeatedly; it disappears after exactly 5 taps (6 pages, docs-count reads '60 of 60'), so the growth is bounded and exhaustion terminates",
    edges: [{ to: "DocumentDetail", requiresInput: false, gated: false, cycle: false }]
  },
  {
    name: "DocumentDetail",
    tier: "A",
    addressing: "exhaustive",
    anchors: ["doc-detail-title"],
    tab: "Billing",
    instances: 60,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: "Param explosion - one route reachable with 60 distinct docId params; the correct model is 1 route with 60 instances, not 60 routes and not 1 state",
    escape: "Each doc-{id} row on Documents pushes here with its own docId; doc-detail-back returns to Documents - or to NotificationDetail when entered via its deep link, since nav.back targets whichever route pushed this one",
    edges: [
      { to: "Documents", requiresInput: false, gated: false, cycle: true },
      // doc-detail-back is a nav.back() edge, so its target is the pusher:
      // Documents on the normal path, NotificationDetail when entered via the
      // 'Open linked item' deep link. Gated because the second target is only
      // reachable from that entry path.
      { to: "NotificationDetail", requiresInput: false, gated: true, cycle: true },
      { to: "Home", requiresInput: false, gated: true, cycle: false }
    ]
  },
  {
    name: "HelpCenter",
    tier: "A",
    addressing: "exhaustive",
    anchors: ["help-contact"],
    tab: "Profile",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: "Alias A - renders byte-identical output (heading, body, HELP_TOPICS list, testIDs) to SupportFaq from the same shared component; only the route name and entry point differ",
    escape: "Record 2 distinct nodes keyed by route, not by rendered content - a crawler that dedups on screen hash merges this with SupportFaq and reports 1 where the truth is 2",
    edges: [{ to: "SupportChat", requiresInput: false, gated: false, cycle: false }]
  },
  {
    name: "SupportFaq",
    tier: "A",
    addressing: "exhaustive",
    anchors: ["help-contact"],
    tab: "Profile",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: "Alias B - byte-identical rendered output and testIDs to HelpCenter; reached from Preferences (open-faq) instead of Profile (open-help)",
    escape: "Record 2 distinct nodes keyed by route, not by rendered content - identical appearance, distinct route",
    edges: [{ to: "SupportChat", requiresInput: false, gated: false, cycle: false }]
  },
  {
    name: "Referral",
    tier: "A",
    addressing: "exhaustive",
    anchors: ["referral-code"],
    tab: "Profile",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: "Cycle - referral-open-profile pushes Profile, and Profile's open-referral pushes Referral, so the stack can grow Referral -> Profile -> Referral forever",
    escape: "Detect the loop by route identity and stop re-expanding visited routes; do not recurse indefinitely",
    edges: [{ to: "Profile", requiresInput: false, gated: false, cycle: true }]
  },
  {
    name: "DangerZone",
    tier: "A",
    addressing: "exhaustive",
    anchors: ["danger-warning"],
    tab: "Profile",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: "Destructive path entry - open-delete-account leads one hop deeper to the typed-confirmation reset",
    escape: "The screen itself is safe; the destructive action lives on DeleteAccount and requires typing the exact literal DELETE",
    edges: [{ to: "DeleteAccount", requiresInput: false, gated: false, cycle: false }]
  },
  {
    name: "DeleteAccount",
    tier: "A",
    addressing: "exhaustive",
    anchors: ["delete-submit"],
    tab: "Profile",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: "Self-destruction - delete-submit resets requests, profile, paymentMethods, and session to seed and roots the stack at Login; it stays disabled until confirmsDelete passes on the exact literal DELETE (trimmed, case-sensitive - lowercase delete does not enable it)",
    escape: "Recover after the reset: the app lands on Login with seed data restored; any stale param id pushed afterwards must hit the NotFound guards, not a crash",
    edges: [{ to: "Login", requiresInput: true, gated: true, cycle: false }]
  },

  // -------------------------------------------------------------------------
  // Tier B (Task 12): 22 sparsely-addressed generic routes rendered from
  // src/screens/Bulk.js via src/screens/generic.js, configured by BULK below.
  // Sparse addressing means each route's ONLY testIDs are
  // `${testPrefix}-list` (lists) or `${testPrefix}-primary` (detail primary
  // action / form submit / wizard next) - everything else is reachable only
  // via accessibilityLabel or text. instances counts follow the Tier A
  // precedent (PaymentReview 12, DocumentDetail 60): one instance per
  // distinct (route, params) combination that real controls can produce,
  // even when the rendered content ignores the param (param aliasing).

  // --- Notifications cluster (Home tab) ------------------------------------
  {
    name: "Inbox",
    tier: "B",
    addressing: "sparse",
    anchors: ["inbox-list"],
    tab: "Home",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: null,
    escape: null,
    edges: [{ to: "NotificationDetail", requiresInput: false, gated: false, cycle: false }]
  },
  {
    name: "NotificationDetail",
    tier: "B",
    addressing: "sparse",
    anchors: ["notification-detail-primary"],
    tab: "Home",
    instances: 25,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: "Conditional cross-cluster deep link - the accessibilityLabel-only 'Open linked item' button renders on just 8 of 25 instances (the NOTIFICATION_LINKS indices), fanning out into the requests, billing, insurance, and documents clusters",
    escape: "Enumerate all 25 notificationId instances from inbox rows; on the 8 linked ones, find 'Open linked item' via the accessibility tree (it has no testID) - it pushes the linked route with that notification's deepLink params",
    edges: [
      { to: "NotificationSettings", requiresInput: false, gated: false, cycle: false },
      { to: "RequestDetail", requiresInput: false, gated: true, cycle: false },
      { to: "PaymentReview", requiresInput: false, gated: true, cycle: false },
      { to: "PolicyDetail", requiresInput: false, gated: true, cycle: false },
      { to: "DocumentDetail", requiresInput: false, gated: true, cycle: false },
      { to: "Home", requiresInput: false, gated: true, cycle: false }
    ]
  },
  {
    name: "NotificationSettings",
    tier: "B",
    addressing: "sparse",
    anchors: ["notification-settings-primary"],
    tab: "Home",
    instances: 25,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: "Param aliasing - entered from 25 NotificationDetail instances, each push carrying that notification's notificationId, which this form ignores; all 25 instances render identical content",
    escape: "Model 25 instances but recognize the rendered state is param-independent; fill the required 'Daily summary time' field to enable notification-settings-primary, which returns to Inbox",
    edges: [{ to: "Inbox", requiresInput: true, gated: false, cycle: true }]
  },

  // --- Insurance cluster (Billing tab) --------------------------------------
  {
    name: "Policies",
    tier: "B",
    addressing: "sparse",
    anchors: ["policies-list"],
    tab: "Billing",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: null,
    escape: null,
    edges: [{ to: "PolicyDetail", requiresInput: false, gated: false, cycle: false }]
  },
  {
    name: "PolicyDetail",
    tier: "B",
    addressing: "sparse",
    anchors: ["policy-detail-primary"],
    tab: "Billing",
    instances: 6,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: null,
    escape: null,
    edges: [
      { to: "ClaimStart", requiresInput: false, gated: false, cycle: false },
      { to: "Home", requiresInput: false, gated: true, cycle: false }
    ]
  },
  {
    name: "ClaimStart",
    tier: "B",
    addressing: "sparse",
    anchors: ["claim-start-primary"],
    tab: "Billing",
    instances: 6,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: null,
    escape: null,
    edges: [
      { to: "ClaimWizard", requiresInput: false, gated: false, cycle: false },
      { to: "Home", requiresInput: false, gated: true, cycle: false }
    ]
  },
  {
    name: "ClaimWizard",
    tier: "B",
    addressing: "sparse",
    anchors: ["claim-wizard-primary"],
    tab: "Billing",
    // 6 policy-scoped step-1 entries ({ policyId, step: 1 } from ClaimStart)
    // + 1 step-2 + 1 step-3: the step-advance push carries only
    // { step: n + 1 }, dropping policyId.
    instances: 8,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: "Wizard step params - renders steps[params.step - 1] and NotFound on a missing, non-numeric, or out-of-range step, so entry MUST pass step: 1; the Next button re-pushes this same route with step + 1 (a self-edge, not a new route)",
    escape: "Enter via claim-start-primary (pushes step: 1); tap claim-wizard-primary through steps 2 and 3; the step-3 press lands on ClaimSubmitted with the static seeded claimId CLM-01",
    edges: [
      { to: "ClaimWizard", requiresInput: false, gated: false, cycle: true },
      { to: "ClaimSubmitted", requiresInput: false, gated: false, cycle: false },
      { to: "Home", requiresInput: false, gated: true, cycle: false }
    ]
  },
  {
    name: "ClaimSubmitted",
    tier: "B",
    addressing: "sparse",
    anchors: ["claim-submitted-primary"],
    tab: "Billing",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: null,
    escape: null,
    edges: [
      { to: "Policies", requiresInput: false, gated: false, cycle: true },
      { to: "Home", requiresInput: false, gated: true, cycle: false }
    ]
  },

  // --- Providers cluster (Profile tab) ---------------------------------------
  {
    name: "Directory",
    tier: "B",
    addressing: "sparse",
    anchors: ["directory-list"],
    tab: "Profile",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: null,
    escape: null,
    edges: [{ to: "ProviderDetail", requiresInput: false, gated: false, cycle: false }]
  },
  {
    name: "ProviderDetail",
    tier: "B",
    addressing: "sparse",
    anchors: ["provider-detail-primary"],
    tab: "Profile",
    instances: 30,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: null,
    escape: null,
    edges: [
      { to: "MessageThread", requiresInput: false, gated: false, cycle: false },
      { to: "Home", requiresInput: false, gated: true, cycle: false }
    ]
  },
  {
    name: "MessageThread",
    tier: "B",
    addressing: "sparse",
    anchors: ["message-thread-list"],
    tab: "Profile",
    instances: 30,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: "Param aliasing - entered from 30 ProviderDetail instances, each push carrying providerId, which this shared thread ignores; all 30 instances render the same 6 seeded messages",
    escape: "Model 30 instances but recognize the rendered state is param-independent; tapping any message row (accessibilityLabel only) opens the reply composer",
    edges: [{ to: "ComposeMessage", requiresInput: false, gated: false, cycle: false }]
  },
  {
    name: "ComposeMessage",
    tier: "B",
    addressing: "sparse",
    anchors: ["compose-message-primary"],
    tab: "Profile",
    // One instance per messageId pushed by a MessageThread row (6 messages).
    instances: 6,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: null,
    escape: null,
    edges: [{ to: "MessageThread", requiresInput: true, gated: false, cycle: true }]
  },

  // --- Reminders cluster (Requests tab) --------------------------------------
  {
    name: "RemindersMonth",
    tier: "B",
    addressing: "sparse",
    anchors: ["reminders-month-list"],
    tab: "Requests",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: null,
    escape: null,
    edges: [{ to: "RemindersDay", requiresInput: false, gated: false, cycle: false }]
  },
  {
    name: "RemindersDay",
    tier: "B",
    addressing: "sparse",
    anchors: ["reminders-day-list"],
    tab: "Requests",
    // One instance per REMINDER_DAYS row (9 dayIds), each showing only that
    // day's 5 reminders via BULK.RemindersDay.filter.
    instances: 9,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: "Per-instance filtered content - the same route renders a different 5-reminder subset per dayId; an unknown or missing dayId falls back to all 45 so the anchor list renders in every state",
    escape: "Visit all 9 dayId instances from RemindersMonth rows to see all 45 reminders; do not merge the instances just because the route name repeats",
    edges: [{ to: "ReminderDetail", requiresInput: false, gated: false, cycle: false }]
  },
  {
    name: "ReminderDetail",
    tier: "B",
    addressing: "sparse",
    anchors: ["reminder-detail-primary"],
    tab: "Requests",
    instances: 45,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: null,
    escape: null,
    edges: [
      { to: "RecurrencePicker", requiresInput: false, gated: false, cycle: false },
      { to: "Home", requiresInput: false, gated: true, cycle: false }
    ]
  },
  {
    name: "RecurrencePicker",
    tier: "B",
    addressing: "sparse",
    anchors: ["recurrence-picker-list"],
    tab: "Requests",
    instances: 45,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: "Param aliasing - entered from 45 ReminderDetail instances, each push carrying reminderId, which this picker ignores; all 45 instances render the same 4 recurrence options",
    escape: "Model 45 instances but recognize the rendered state is param-independent; tapping a recurrence row (accessibilityLabel only) opens the creation form",
    edges: [{ to: "CreateReminder", requiresInput: false, gated: false, cycle: false }]
  },
  {
    name: "CreateReminder",
    tier: "B",
    addressing: "sparse",
    anchors: ["create-reminder-primary"],
    tab: "Requests",
    // One instance per recurrenceId pushed by a RecurrencePicker row.
    instances: 4,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: null,
    escape: null,
    edges: [{ to: "RemindersMonth", requiresInput: true, gated: false, cycle: true }]
  },

  // --- Security & data cluster (Profile tab) ----------------------------------
  {
    name: "Security",
    tier: "B",
    addressing: "sparse",
    anchors: ["security-list"],
    tab: "Profile",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: "Hub list - unlike every other Tier B list, each row navigates to a DIFFERENT route via its item.link (linkField shape), and the TwoFactorSetup row must pass { step: 1 } or the wizard renders NotFound",
    escape: "Tap each of the 3 rows (accessibilityLabel only) to fan out to ChangePassword, TwoFactorSetup (step 1), and DataExport (EXP-01)",
    edges: [
      { to: "ChangePassword", requiresInput: false, gated: false, cycle: false },
      { to: "TwoFactorSetup", requiresInput: false, gated: false, cycle: false },
      { to: "DataExport", requiresInput: false, gated: false, cycle: false }
    ]
  },
  {
    name: "ChangePassword",
    tier: "B",
    addressing: "sparse",
    anchors: ["change-password-primary"],
    tab: "Profile",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: null,
    escape: null,
    edges: [{ to: "Security", requiresInput: true, gated: false, cycle: true }]
  },
  {
    name: "TwoFactorSetup",
    tier: "B",
    addressing: "sparse",
    anchors: ["twofactor-setup-primary"],
    tab: "Profile",
    // Step 1 (entry from Security's row) + step 2 (self-push).
    instances: 2,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: "Wizard step params - renders steps[params.step - 1] and NotFound on a bad step, so entry MUST pass step: 1; the Next button re-pushes this same route with step: 2 (a self-edge)",
    escape: "Enter from Security's two-factor row (pushes step: 1); tap twofactor-setup-primary twice - the step-2 press returns to Security",
    edges: [
      { to: "TwoFactorSetup", requiresInput: false, gated: false, cycle: true },
      { to: "Security", requiresInput: false, gated: false, cycle: true },
      { to: "Home", requiresInput: false, gated: true, cycle: false }
    ]
  },
  {
    name: "DataExport",
    tier: "B",
    addressing: "sparse",
    anchors: ["data-export-primary"],
    tab: "Profile",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: null,
    escape: null,
    edges: [
      { to: "ExportStatus", requiresInput: false, gated: false, cycle: false },
      { to: "Home", requiresInput: false, gated: true, cycle: false }
    ]
  },
  {
    name: "ExportStatus",
    tier: "B",
    addressing: "sparse",
    anchors: ["export-status-primary"],
    tab: "Profile",
    instances: 1,
    noBack: false,
    noTabs: false,
    terminal: false,
    trap: null,
    escape: null,
    edges: [
      { to: "Security", requiresInput: false, gated: false, cycle: true },
      { to: "Home", requiresInput: false, gated: true, cycle: false }
    ]
  }
];

// BULK: the Tier B route registry - one entry per generic route, keyed by
// route name. Consumed by src/screens/generic.js's four renderers (Task 11);
// populated by Task 12; read by Task 13's graph derivation. Tier B is
// deliberately sparsely addressed: a route's ONLY testIDs are
// `${testPrefix}-primary` (primary action button) and `${testPrefix}-list`
// (list container). Everything else is reachable only via text / the
// accessibility tree. Items in every referenced collection must be keyed by
// an `id` field (the convention every existing collection already follows).
//
// Shapes by kind (this is the contract - Task 12 entries must conform):
//   list:   { kind: "list", title, heading, collection, itemLabel(item),
//             itemSub(item)?, itemRoute, itemParam, testPrefix }
//           Rows push itemRoute with { [itemParam]: item.id }; the
//           ScrollView carries `${testPrefix}-list`. No primary button.
//   detail: { kind: "detail", title?, collection, param, label, titleField,
//             rows: [[rowLabel, itemField], ...],
//             actions?: [{ label, route, params? }], testPrefix }
//           Looks up params[param] === item.id; renders NotFound(label) on
//           a miss. actions[0] is the PrimaryButton `${testPrefix}-primary`;
//           later actions are SecondaryButtons with no testID. Every action
//           pushes its route with { [param]: id, ...action.params }.
//   form:   { kind: "form", title, heading, fields: [{ key, label,
//             placeholder?, multiline?, required? }], submitLabel,
//             nextRoute, testPrefix }
//           Submit (`${testPrefix}-primary`) stays disabled until every
//           required field is non-blank, then pushes nextRoute.
//   wizard: { kind: "wizard", title, label, route, steps: [{ heading,
//             fields }], submitLabel, nextRoute, testPrefix }
//           `route` is the wizard's own route name. Renders
//           steps[params.step - 1]; NotFound(label) when params.step is
//           missing, non-numeric, or out of range - entry edges must pass
//           { step: 1 }. Next (`${testPrefix}-primary`) pushes route with
//           { step: step + 1 } until the last step, which pushes nextRoute.
//
// Task 12 optional keys (see the extension note atop src/screens/generic.js):
//   list.linkField, list.filter, detail.deepLinkField + detail.deepLinkLabel,
//   and form/wizard.nextParams (static object merged into the final push -
//   without it a form/wizard exit must target a route that needs no params).
const BULK = {
  // --- Notifications cluster (Home tab) -----------------------------------
  Inbox: {
    kind: "list",
    title: "Notifications",
    heading: "Inbox",
    collection: "NOTIFICATIONS",
    itemLabel: (item) => item.title,
    itemSub: (item) => `${item.kind} - ${item.when}`,
    itemRoute: "NotificationDetail",
    itemParam: "notificationId",
    testPrefix: "inbox"
  },
  NotificationDetail: {
    kind: "detail",
    title: "Notifications",
    collection: "NOTIFICATIONS",
    param: "notificationId",
    label: "Notification",
    titleField: "title",
    rows: [["Kind", "kind"], ["Received", "when"], ["Message", "body"]],
    actions: [{ label: "Notification settings", route: "NotificationSettings" }],
    // 8 of 25 instances carry item.deepLink - the cross-cluster edges.
    deepLinkField: "deepLink",
    deepLinkLabel: "Open linked item",
    testPrefix: "notification-detail"
  },
  NotificationSettings: {
    kind: "form",
    title: "Notifications",
    heading: "Notification settings",
    fields: [
      { key: "summaryTime", label: "Daily summary time", placeholder: "8:00 AM", required: true },
      { key: "mutedKeywords", label: "Muted keywords", placeholder: "invoice, promo", multiline: true }
    ],
    submitLabel: "Save settings",
    nextRoute: "Inbox",
    testPrefix: "notification-settings"
  },

  // --- Insurance cluster (Billing tab) -------------------------------------
  Policies: {
    kind: "list",
    title: "Insurance",
    heading: "Your policies",
    collection: "POLICIES",
    itemLabel: (item) => item.name,
    itemSub: (item) => `${item.type} - ${item.premium}`,
    itemRoute: "PolicyDetail",
    itemParam: "policyId",
    testPrefix: "policies"
  },
  PolicyDetail: {
    kind: "detail",
    title: "Insurance",
    collection: "POLICIES",
    param: "policyId",
    label: "Policy",
    titleField: "name",
    rows: [
      ["Type", "type"],
      ["Premium", "premium"],
      ["Renews", "renewal"],
      ["Status", "status"],
      ["Coverage", "coverage"]
    ],
    actions: [{ label: "Start a claim", route: "ClaimStart" }],
    testPrefix: "policy-detail"
  },
  ClaimStart: {
    kind: "detail",
    title: "Insurance claim",
    collection: "POLICIES",
    param: "policyId",
    label: "Policy",
    titleField: "name",
    rows: [["Type", "type"], ["Status", "status"], ["Coverage", "coverage"]],
    actions: [{ label: "Begin claim", route: "ClaimWizard", params: { step: 1 } }],
    testPrefix: "claim-start"
  },
  ClaimWizard: {
    kind: "wizard",
    title: "Insurance claim",
    label: "Claim step",
    route: "ClaimWizard",
    steps: [
      { heading: "What happened?", fields: [{ key: "incident", label: "Describe the incident", multiline: true }] },
      { heading: "When and where?", fields: [{ key: "lossDate", label: "Date of loss", placeholder: "Apr 20" }, { key: "location", label: "Location" }] },
      { heading: "Estimated cost", fields: [{ key: "estimate", label: "Estimated amount", placeholder: "$500" }] }
    ],
    submitLabel: "Submit claim",
    nextRoute: "ClaimSubmitted",
    nextParams: { claimId: "CLM-01" },
    testPrefix: "claim-wizard"
  },
  ClaimSubmitted: {
    kind: "detail",
    title: "Insurance claim",
    collection: "CLAIMS",
    param: "claimId",
    label: "Claim",
    titleField: "label",
    rows: [["Policy", "policy"], ["Status", "status"], ["Filed", "filed"], ["Decision window", "eta"]],
    actions: [{ label: "Back to policies", route: "Policies" }],
    testPrefix: "claim-submitted"
  },

  // --- Providers cluster (Profile tab) --------------------------------------
  Directory: {
    kind: "list",
    title: "Providers",
    heading: "Provider directory",
    collection: "PROVIDERS",
    itemLabel: (item) => item.name,
    itemSub: (item) => `${item.specialty} - ${item.city}`,
    itemRoute: "ProviderDetail",
    itemParam: "providerId",
    testPrefix: "directory"
  },
  ProviderDetail: {
    kind: "detail",
    title: "Providers",
    collection: "PROVIDERS",
    param: "providerId",
    label: "Provider",
    titleField: "name",
    rows: [["Specialty", "specialty"], ["Rating", "rating"], ["City", "city"], ["Phone", "phone"]],
    actions: [{ label: "Open message thread", route: "MessageThread" }],
    testPrefix: "provider-detail"
  },
  MessageThread: {
    kind: "list",
    title: "Messages",
    heading: "Provider thread",
    collection: "MESSAGES",
    itemLabel: (item) => `${item.from} - ${item.sent}`,
    itemSub: (item) => item.body,
    // Tapping a message opens the reply composer.
    itemRoute: "ComposeMessage",
    itemParam: "messageId",
    testPrefix: "message-thread"
  },
  ComposeMessage: {
    kind: "form",
    title: "Messages",
    heading: "New message",
    fields: [
      { key: "subject", label: "Subject", required: true },
      { key: "body", label: "Message", multiline: true, required: true }
    ],
    submitLabel: "Send message",
    nextRoute: "MessageThread",
    testPrefix: "compose-message"
  },

  // --- Reminders cluster (Requests tab) -------------------------------------
  RemindersMonth: {
    kind: "list",
    title: "Reminders",
    heading: "This month",
    collection: "REMINDER_DAYS",
    itemLabel: (item) => item.day,
    itemSub: (item) => `${item.count} reminders`,
    itemRoute: "RemindersDay",
    itemParam: "dayId",
    testPrefix: "reminders-month"
  },
  RemindersDay: {
    kind: "list",
    title: "Reminders",
    heading: "Day view",
    collection: "REMINDERS",
    // Per-instance content: only the selected day's 5 reminders. Total on a
    // missing/unknown dayId so the anchor list renders in every state.
    filter: (item, params) => {
      const day = REMINDER_DAYS.find((entry) => entry.id === (params ? params.dayId : undefined));
      return day ? item.day === day.day : true;
    },
    itemLabel: (item) => item.title,
    itemSub: (item) => `${item.day} at ${item.time}`,
    itemRoute: "ReminderDetail",
    itemParam: "reminderId",
    testPrefix: "reminders-day"
  },
  ReminderDetail: {
    kind: "detail",
    title: "Reminders",
    collection: "REMINDERS",
    param: "reminderId",
    label: "Reminder",
    titleField: "title",
    rows: [["Day", "day"], ["Time", "time"], ["Repeats", "recurrence"], ["Note", "note"]],
    actions: [{ label: "Change recurrence", route: "RecurrencePicker" }],
    testPrefix: "reminder-detail"
  },
  RecurrencePicker: {
    kind: "list",
    title: "Reminders",
    heading: "Repeat schedule",
    collection: "RECURRENCES",
    itemLabel: (item) => item.label,
    itemSub: (item) => item.description,
    // Picking a schedule flows into the creation form.
    itemRoute: "CreateReminder",
    itemParam: "recurrenceId",
    testPrefix: "recurrence-picker"
  },
  CreateReminder: {
    kind: "form",
    title: "Reminders",
    heading: "New reminder",
    fields: [
      { key: "title", label: "Reminder title", required: true },
      { key: "day", label: "Day", placeholder: "Mon Apr 28", required: true },
      { key: "time", label: "Time", placeholder: "8:00 AM" },
      { key: "note", label: "Note", multiline: true }
    ],
    submitLabel: "Create reminder",
    nextRoute: "RemindersMonth",
    testPrefix: "create-reminder"
  },

  // --- Security & data cluster (Profile tab) --------------------------------
  Security: {
    kind: "list",
    title: "Account",
    heading: "Security & data",
    collection: "SECURITY_ITEMS",
    itemLabel: (item) => item.title,
    itemSub: (item) => item.sub,
    // Hub list: each row navigates to a different route via item.link.
    linkField: "link",
    testPrefix: "security"
  },
  ChangePassword: {
    kind: "form",
    title: "Security",
    heading: "Change password",
    fields: [
      { key: "current", label: "Current password", required: true },
      { key: "next", label: "New password", required: true },
      { key: "confirm", label: "Confirm new password", required: true }
    ],
    submitLabel: "Update password",
    nextRoute: "Security",
    testPrefix: "change-password"
  },
  TwoFactorSetup: {
    kind: "wizard",
    title: "Two-factor setup",
    label: "Setup step",
    route: "TwoFactorSetup",
    steps: [
      { heading: "Add your phone", fields: [{ key: "phone", label: "Phone number", placeholder: "+1 555 014 2920" }] },
      { heading: "Confirm the code", fields: [{ key: "code", label: "6-digit code", placeholder: "000000" }] }
    ],
    submitLabel: "Turn on 2FA",
    nextRoute: "Security",
    testPrefix: "twofactor-setup"
  },
  DataExport: {
    kind: "detail",
    title: "Your data",
    collection: "EXPORTS",
    param: "exportId",
    label: "Export",
    titleField: "label",
    rows: [["Format", "format"], ["Size", "size"], ["Requested", "requested"], ["Status", "status"]],
    actions: [{ label: "Check export status", route: "ExportStatus" }],
    testPrefix: "data-export"
  },
  ExportStatus: {
    kind: "detail",
    title: "Export status",
    collection: "EXPORTS",
    param: "exportId",
    label: "Export",
    titleField: "status",
    rows: [["Export", "label"], ["Format", "format"], ["Size", "size"], ["Requested", "requested"]],
    actions: [{ label: "Back to security", route: "Security" }],
    testPrefix: "export-status"
  }
};

module.exports = {
  SERVICES,
  DATES,
  TIMES,
  PRIORITIES,
  INITIAL_REQUESTS,
  ADDRESSES,
  INITIAL_PROFILE,
  HELP_TOPICS,
  ACTIVITY_ITEMS,
  INVOICES,
  DOCUMENTS,
  DOCS_PAGE_SIZE,
  PAYMENT_METHODS,
  NOTIFICATIONS,
  POLICIES,
  PROVIDERS,
  REMINDERS,
  REMINDER_DAYS,
  RECURRENCES,
  MESSAGES,
  SECURITY_ITEMS,
  EXPORTS,
  CLAIMS,
  ANDROID_NAV_BAR_GAP_ANDROID,
  TAB_BAR_HEIGHT,
  ROUTE_META,
  BULK
};
