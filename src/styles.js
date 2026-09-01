import { Platform, StyleSheet } from "react-native";
import { ANDROID_NAV_BAR_GAP_ANDROID, TAB_BAR_HEIGHT } from "./data";

export const ANDROID_NAV_BAR_GAP = Platform.OS === "android" ? ANDROID_NAV_BAR_GAP_ANDROID : 0;
export { TAB_BAR_HEIGHT };

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
    color: "#4D65A8",
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
    gap: 6, // 8 -> 6 for the 4th tab: keeps "Requests" on one line at 13px on 320dp-wide devices
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

export default styles;
