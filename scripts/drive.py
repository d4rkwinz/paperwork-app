#!/usr/bin/env python3
"""Drive Paperwork flows on a physical device by accessibilityLabel (content-desc).

Coordinate-free: each step looks up the node's bounds from a fresh uiautomator
dump, so it survives layout shifts as screens are added in later tasks.
"""
import re
import subprocess
import sys
import time

SERIAL = "R5CR11FJD0F"


def adb(*args, binary=False):
    cmd = ["adb", "-s", SERIAL] + list(args)
    out = subprocess.run(cmd, capture_output=True)
    if binary:
        return out.stdout
    return out.stdout.decode("utf-8", "replace")


def wake(tries=3):
    """Wake and unlock the device, and dismiss the notification shade.

    The device dozes off between builds; a dozing screen produces an empty
    uiautomator dump, which reads as "every element is missing" and looks
    exactly like a total app failure. Two false failures came from this before
    it was handled here rather than at each call site.
    """
    for attempt in range(tries):
        adb("shell", "input", "keyevent", "KEYCODE_WAKEUP")
        time.sleep(1.0)
        adb("shell", "wm", "dismiss-keyguard")
        time.sleep(1.0)
        adb("shell", "cmd", "statusbar", "collapse")
        time.sleep(0.8)
        power = adb("shell", "dumpsys", "power")
        awake = "mWakefulness=Awake" in power
        # Match only the CURRENT focus line: "NotificationShade" also appears
        # as a background window entry, which made this warn spuriously.
        focus = adb("shell", "dumpsys", "window")
        m = re.search(r"mCurrentFocus=\S+ \S+ (\S+)\}", focus)
        shade = bool(m) and "NotificationShade" in m.group(1)
        if awake and not shade:
            print(f"  device awake and unlocked")
            return True
        adb("shell", "input", "swipe", "720", "2600", "720", "1200", "200")
        time.sleep(1.5)
    print("  WARN: could not confirm device is awake and unlocked")
    return False


def dump(tries=4):
    """Return the current UI hierarchy XML, or "" if it could not be captured.

    uiautomator refuses to dump while the window is non-idle (common right after
    install, or while Metro is attached). It leaves the PREVIOUS /sdcard/ui.xml
    in place, so a naive dump-then-cat silently returns stale UI and every
    subsequent lookup is answered from the wrong screen. Delete first, then
    require a hierarchy root, so a failed dump is visible instead of misleading.
    """
    for attempt in range(tries):
        adb("shell", "rm", "-f", "/sdcard/ui.xml")
        adb("shell", "uiautomator", "dump", "/sdcard/ui.xml")
        xml = adb("shell", "cat", "/sdcard/ui.xml")
        if "<hierarchy" in xml:
            return xml
        time.sleep(1.5)
    print("  WARN: uiautomator dump failed - screen not idle")
    return ""


def find(xml, desc, exact=True):
    """Return (cx, cy) center of the node matching desc by content-desc or text.

    Some rows (e.g. ProfileScreen's settings rows) carry a testID but no
    accessibilityLabel, so they have no content-desc and can only be located by
    their visible text. That is a real property of this app, not a driver
    shortcut - Tier B screens are deliberately addressed this sparsely.
    """
    for attr in ("content-desc", "text"):
        pattern = attr + r'="([^"]*)"[^>]*?bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"'
        for m in re.finditer(pattern, xml):
            label = m.group(1)
            if not label:
                continue
            x1, y1, x2, y2 = map(int, m.groups()[1:])
            if (label == desc) if exact else (desc.lower() in label.lower()):
                if x2 > x1 and y2 > y1:
                    return (x1 + x2) // 2, (y1 + y2) // 2
    return None


def scroll_down():
    """Swipe up inside the content area to reveal lower form fields."""
    adb("shell", "input", "swipe", "720", "2200", "720", "1100", "250")
    time.sleep(1.2)


def tap(desc, exact=True, retries=3, settle=1.6, scrolls=4):
    """Tap a node by content-desc, scrolling to find it if it is below the fold.

    Several primary buttons sit under a long form (Review booking is below
    Notes), so a plain dump-and-tap misses them - that is a real crawler
    challenge in this app, not a driver bug.
    """
    for attempt in range(retries):
        hit = find(dump(), desc, exact)
        if hit:
            adb("shell", "input", "tap", str(hit[0]), str(hit[1]))
            time.sleep(settle)
            print(f"  tapped {desc!r} at {hit}")
            return True
        for i in range(scrolls):
            scroll_down()
            hit = find(dump(), desc, exact)
            if hit:
                adb("shell", "input", "tap", str(hit[0]), str(hit[1]))
                time.sleep(settle)
                print(f"  tapped {desc!r} at {hit} (after {i + 1} scroll(s))")
                return True
        time.sleep(1.0)
    print(f"  FAIL: no node with content-desc {desc!r} after {retries} attempts + scrolling")
    return False


def visible(desc, exact=False):
    return find(dump(), desc, exact) is not None


def text_present(needle):
    return needle.lower() in dump().lower()


def shot(name):
    png = adb("exec-out", "screencap", "-p", binary=True)
    path = f"/tmp/pw-{name}.png"
    with open(path, "wb") as fh:
        fh.write(png)
    print(f"  screenshot {path} ({len(png) // 1024} KB)")


def type_into(desc, text):
    """Focus a field by accessibilityLabel and type into it."""
    hit = find(dump(), desc)
    if not hit:
        print(f"  FAIL: field {desc!r} not found")
        return False
    adb("shell", "input", "tap", str(hit[0]), str(hit[1]))
    time.sleep(0.8)
    adb("shell", "input", "text", text)
    adb("shell", "input", "keyevent", "KEYCODE_BACK")  # dismiss keyboard
    time.sleep(1.0)
    print(f"  typed into {desc!r}")
    return True


def pass_gate(guest=True):
    """Get past the Task 5 auth gate. The guest path is the shortest route to
    the shell, so the four documented flows use it; sign-in is exercised by the
    'auth' flow instead."""
    if not visible("Sign in", exact=True):
        print("  gate not present (already inside the shell)")
        return True
    if guest:
        return tap("Continue as guest")
    ok = type_into("Email address", "alex@example.com")
    ok &= type_into("Password", "hunter2")
    ok &= tap("Sign in")
    ok &= tap("Skip")  # leave Onboarding
    return ok


steps = sys.argv[1] if len(sys.argv) > 1 else "flow1"

wake()

# Every shell flow now starts behind the gate.
if steps in ("flow1", "flow2", "flow3", "flow4", "back"):
    print("passing auth gate (guest path)")
    if not pass_gate(guest=True):
        print("FATAL: could not get past the auth gate")
        sys.exit(1)

if steps == "flow1":
    print("Flow 1: book a plumber for tomorrow morning at the home address")
    ok = True
    ok &= tap("Open Plumber")
    ok &= tap("Book this service")
    ok &= tap("Tomorrow")
    ok &= tap("8:00 AM")
    ok &= tap("Review booking")
    shot("03-review")
    ok &= tap("Submit booking")
    shot("04-confirmation")
    ok &= tap("View request")
    shot("05-request-detail")
    print(f"\nflow1 taps all succeeded: {ok}")
    xml = dump()
    req = re.search(r"REQ-\d+", xml)
    print(f"request id on final screen: {req.group(0) if req else 'NOT FOUND'}")
    for marker in ["REQ-", "8:00 AM", "24 Cedar Street", "Active", "Booked"]:
        print(f"  detail shows {marker!r}: {marker.lower() in xml.lower()}")
    sys.exit(0 if ok and req else 1)

elif steps == "flow2":
    # GUIDELINES.md Flow 2: edit an active request's time and notes, verify.
    print("Flow 2: manage an existing request (REQ-1042)")
    ok = True
    ok &= tap("Requests tab")
    ok &= tap("Active")
    ok &= tap("Open request REQ-1042")
    ok &= tap("Edit request")
    ok &= tap("1:00 PM")
    hit = find(dump(), "Edit request notes")
    if hit:
        adb("shell", "input", "tap", str(hit[0]), str(hit[1]))
        time.sleep(1.0)
        adb("shell", "input", "text", "Flow2%sverified")
        adb("shell", "input", "keyevent", "KEYCODE_BACK")  # close the keyboard
        time.sleep(1.2)
        print("  typed into notes")
    else:
        print("  FAIL: notes field not found")
        ok = False
    ok &= tap("Review changes")
    ok &= tap("Save changes")
    shot("06-flow2-saved")
    xml = dump()
    print(f"\nflow2 taps all succeeded: {ok}")
    for marker in ["Changes saved.", "1:00 PM", "Flow2 verified", "Updated"]:
        print(f"  detail shows {marker!r}: {marker.lower() in xml.lower()}")
    sys.exit(0 if ok and "changes saved" in xml.lower() else 1)

elif steps == "flow3":
    # GUIDELINES.md Flow 3: cancel an active request, confirm it leaves Active.
    print("Flow 3: cancel REQ-1038 and verify it moves to Canceled")
    ok = True
    ok &= tap("Requests tab")
    ok &= tap("Open request REQ-1038")
    ok &= tap("Cancel request")
    ok &= tap("Yes, cancel")
    ok &= tap("Go back")
    # Task 9 moved the filter into a bottom sheet: one extra tap to open it.
    # The opener's label carries the current filter, so match on the prefix.
    ok &= tap("Filter requests, currently", exact=False)
    ok &= tap("Canceled")
    shot("07-flow3-canceled")
    xml = dump()
    print(f"\nflow3 taps all succeeded: {ok}")
    print(f"  REQ-1038 listed under Canceled filter: {'REQ-1038' in xml}")
    sys.exit(0 if ok and "REQ-1038" in xml else 1)

elif steps == "flow4":
    # GUIDELINES.md Flow 4: email-only notifications + change primary address.
    print("Flow 4: update profile preferences")
    ok = True
    ok &= tap("Profile tab")
    ok &= tap("Notification preferences")
    ok &= tap("Push notifications")
    ok &= tap("SMS alerts")
    shot("08-flow4-prefs")
    prefs = dump()
    ok &= tap("Go back")
    ok &= tap("Saved addresses")
    ok &= tap("Select Office - 9 Market Plaza")
    ok &= tap("Go back")
    shot("09-flow4-profile")
    xml = dump()
    print(f"\nflow4 taps all succeeded: {ok}")
    print(f"  preferences screen mentioned email: {'email' in prefs.lower()}")
    print(f"  profile now shows Office address: {'Office - 9 Market Plaza' in xml}")
    sys.exit(0 if ok and "Office - 9 Market Plaza" in xml else 1)

elif steps == "back":
    # Task 4: Android hardware back. Without the BackHandler effect, system back
    # exits the app from any depth, so a crawler pressing it once records "app
    # crashed" instead of "went back one screen".
    print("Hardware back: depth walk, root background, modal dismissal")
    ok = True

    def press_back():
        adb("shell", "input", "keyevent", "KEYCODE_BACK")
        time.sleep(1.8)

    def focused():
        out = adb("shell", "dumpsys", "window")
        m = re.search(r"mCurrentFocus=Window\{[^}]*\s(\S+)\}", out)
        return m.group(1) if m else "none"

    def alive():
        return bool(adb("shell", "pidof", "com.d4rkwinz.paperwork").strip())

    def expect(label, needle, want=True):
        global ok
        got = needle.lower() in dump().lower()
        print(f"  {label}: {needle!r} present={got} (want {want})")
        if got != want:
            ok = False

    # Descend to BookingReview: Home -> ServiceDetail -> BookingForm -> BookingReview
    ok &= tap("Open Plumber")
    ok &= tap("Book this service")
    ok &= tap("Tomorrow")
    ok &= tap("8:00 AM")
    ok &= tap("Review booking")
    expect("depth 4 is BookingReview", "Confirm details")

    press_back()
    expect("back -> BookingForm", "New booking")
    press_back()
    expect("back -> ServiceDetail", "Book this service")
    press_back()
    expect("back -> Home", "What needs handling?")

    print(f"  focus before root back: {focused()}")
    press_back()
    foreground = focused()
    still_alive = alive()
    print(f"  focus after root back: {foreground}")
    print(f"  process still alive (did not crash): {still_alive}")
    backgrounded = "paperwork" not in foreground.lower()
    print(f"  app backgrounded rather than crashed: {backgrounded and still_alive}")
    if not (backgrounded and still_alive):
        ok = False

    # Modal dismissal must not perform the destructive action.
    adb("shell", "am", "start", "-n", "com.d4rkwinz.paperwork/.MainActivity")
    time.sleep(5)
    ok &= tap("Requests tab")
    ok &= tap("Open request REQ-1042")
    ok &= tap("Cancel request")
    expect("confirm modal open", "Cancel request?")
    press_back()
    expect("modal dismissed by back", "Cancel request?", want=False)
    xml = dump()
    print(f"  request still Active after dismissal: {'Active' in xml}")
    print(f"  request NOT canceled: {'Canceled' not in xml}")
    if "Canceled" in xml:
        ok = False
    shot("10-back-modal-dismissed")

    print(f"\nback-behavior all expectations met: {ok}")
    sys.exit(0 if ok else 1)

elif steps == "traps":
    # Task 6: four traps, each verified against the behavior that makes it
    # measurable at all - not merely that the screen renders.
    print("Task 6 traps: search gate, segmented state, slow load, dead end")
    ok = True
    ok &= pass_gate(guest=True)

    # --- Trap 1: Search requires >=2 generated characters -------------------
    ok &= tap("Find a service", exact=False) or tap("Search services")
    one = find(dump(), "Search services")
    if one:
        adb("shell", "input", "tap", str(one[0]), str(one[1]))
        time.sleep(0.8)
        adb("shell", "input", "text", "p")
        time.sleep(1.5)
        xml = dump()
        gated = "Type at least" in xml or "search-empty" in xml
        leaked = "Plumber" in xml and "Leaks, clogs" in xml
        print(f"  1 char shows the empty prompt: {gated}")
        print(f"  1 char leaked results (must be False): {leaked}")
        if not gated or leaked:
            ok = False
        adb("shell", "input", "text", "l")   # -> "pl"
        time.sleep(1.5)
        xml = dump()
        found = "Plumber" in xml
        print(f"  2 chars ('pl') return Plumber: {found}")
        if not found:
            ok = False
        # A query that matches nothing must be distinguishable from too-short.
        adb("shell", "input", "text", "zzz")
        time.sleep(1.5)
        xml = dump()
        distinct = ("matched nothing" in xml.lower() or "no results" in xml.lower()
                    or "no service" in xml.lower())
        print(f"  no-match state distinguishable from too-short: {distinct}")
        if not distinct:
            ok = False
        shot("14-search-no-results")
        adb("shell", "input", "keyevent", "KEYCODE_BACK")
        time.sleep(0.5)
    else:
        print("  FAIL: search input not found")
        ok = False

    ok &= tap("Go back")

    # --- Trap 2: Activity swaps content WITHOUT navigating -----------------
    ok &= tap("Recent activity", exact=False) or tap("Activity")
    before = dump()
    ok &= tap("Alerts")
    after = dump()
    changed = before != after
    still_activity = "Recent activity" in after
    print(f"  segment change altered content: {changed}")
    print(f"  route did NOT change (still Activity): {still_activity}")
    if not (changed and still_activity):
        ok = False
    shot("15-activity-alerts")
    ok &= tap("Go back")

    print(f"\ntraps (search + activity) met: {ok}")
    sys.exit(0 if ok else 1)

elif steps == "slowload":
    # Trap 3: SupportChat must show loading, THEN content - never both.
    print("Trap: SupportChat 1.5s load")
    ok = True
    ok &= pass_gate(guest=True)
    ok &= tap("Profile tab")
    ok &= tap("Support", exact=False)
    early = dump()
    loading_now = "Connecting you to support" in early
    content_now = "support-message-1" in early or "Thanks for reaching out" in early
    print(f"  loading indicator visible immediately: {loading_now}")
    print(f"  content already present during load (must be False): {content_now}")
    if content_now:
        ok = False
    time.sleep(2.5)
    late = dump()
    settled = "Connecting you to support" not in late
    has_content = "support-title" in late or "Support" in late
    print(f"  loading gone after wait: {settled}")
    print(f"  content present after wait: {has_content}")
    if not (settled and has_content):
        ok = False
    shot("16-supportchat-settled")
    print(f"\nslow-load trap met: {ok}")
    sys.exit(0 if ok else 1)

elif steps == "deadend":
    # Trap 4: LegalTerms is a genuine dead end - no back button, no tabs,
    # only the in-content close. Android back backgrounds the app (intended).
    print("Trap: LegalTerms dead end")
    ok = True
    ok &= pass_gate(guest=True)
    ok &= tap("Profile tab")
    ok &= tap("Notification preferences")
    ok &= tap("Legal", exact=False) or tap("Terms of service", exact=False)
    xml = dump()
    on_legal = "Terms of service" in xml
    no_back = "Go back" not in xml
    no_tabs = "Requests tab" not in xml
    has_close = "Close" in xml
    print(f"  on LegalTerms: {on_legal}")
    print(f"  back button absent: {no_back}")
    print(f"  tab bar hidden: {no_tabs}")
    print(f"  in-content Close present (the only escape): {has_close}")
    if not (on_legal and no_back and no_tabs and has_close):
        ok = False
    shot("17-legalterms-deadend")
    ok &= tap("Close")
    escaped = "Terms of service" not in dump()
    print(f"  Close escapes the dead end: {escaped}")
    if not escaped:
        ok = False
    print(f"\ndead-end trap met: {ok}")
    sys.exit(0 if ok else 1)

elif steps == "anchors":
    # Fix pass: RequestDetail must be addressable in EVERY state. REQ-0977 is
    # seeded Completed, so edit-request/cancel-request do not render there - it
    # previously had no testID at all in that state.
    print("Anchors: RequestDetail addressable when not Active")
    ok = True
    ok &= pass_gate(guest=True)
    ok &= tap("Requests tab")
    ok &= tap("Completed")
    ok &= tap("Open request REQ-0977")
    xml = dump()
    has_anchor = "request-detail" in xml or "Request detail" in xml
    print(f"  on a Completed request: status shown = {'Completed' in xml}")
    print(f"  edit-request absent (expected, not Active): {'Edit request' not in xml}")
    print(f"  stable anchor present: {has_anchor}")
    if not (has_anchor and "Completed" in xml):
        ok = False
    shot("13-anchor-completed")
    print(f"\nanchor expectations met: {ok}")
    sys.exit(0 if ok else 1)

elif steps == "auth":
    # Task 5 traps: gated submit, form input retention, onboarding step aliasing.
    print("Auth gate: input retention, disabled submit, onboarding steps")
    ok = True

    xml = dump()
    print(f"  launches on Login: {'Sign in' in xml}")
    print(f"  tab bar hidden pre-auth: {'Requests tab' not in xml}")
    print(f"  back button absent on Login: {'Go back' not in xml}")
    if "Sign in" not in xml or "Requests tab" in xml or "Go back" in xml:
        ok = False

    # The form must retain typed input. If a stray re-key remounts the screen,
    # the text vanishes - that is the failure mode worth proving absent.
    ok &= type_into("Email address", "alex@example.com")
    retained = "alex@example.com" in dump()
    print(f"  email retained after typing: {retained}")
    if not retained:
        ok = False

    # Submit must still be inert with only one field filled.
    before = dump()
    still_on_login = "Sign in" in before
    ok &= tap("Sign in")
    time.sleep(1.0)
    gated = "Sign in" in dump()
    print(f"  submit inert with password empty: {gated}")
    if not gated:
        ok = False

    ok &= type_into("Password", "hunter2")
    both = dump()
    print(f"  both fields retained: {'alex@example.com' in both}")
    ok &= tap("Sign in")
    shot("11-auth-onboarding-1")

    xml = dump()
    on_onboarding = "Step 1 of 3, current" in xml
    print(f"  signed in -> Onboarding step 1: {on_onboarding}")
    if not on_onboarding:
        ok = False

    ok &= tap("Next")
    step2 = "Step 2 of 3, current" in dump()
    print(f"  step 2 reached: {step2}")
    ok &= tap("Next")
    step3 = "Step 3 of 3, current" in dump()
    print(f"  step 3 reached: {step3}")
    if not (step2 and step3):
        ok = False

    # Step 3's button label changes to "Get started" (PrimaryButton mirrors
    # label into accessibilityLabel), so the final advance is not "Next".
    ok &= tap("Get started")
    xml = dump()
    reached_home = "What needs handling?" in xml
    tabs_back = "Requests tab" in xml
    print(f"  step 3 exits to Home: {reached_home}")
    print(f"  tab bar restored inside shell: {tabs_back}")
    if not (reached_home and tabs_back):
        ok = False
    shot("12-auth-home")

    print(f"\nauth expectations all met: {ok}")
    sys.exit(0 if ok else 1)

else:
    print(f"unknown flow {steps!r}; expected flow1|flow2|flow3|flow4|back|auth|traps|slowload|deadend|anchors")
    sys.exit(2)
