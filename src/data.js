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

module.exports = {
  SERVICES,
  DATES,
  TIMES,
  PRIORITIES,
  INITIAL_REQUESTS,
  ADDRESSES,
  ANDROID_NAV_BAR_GAP_ANDROID,
  TAB_BAR_HEIGHT
};
