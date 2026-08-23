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


steps = sys.argv[1] if len(sys.argv) > 1 else "flow1"

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

else:
    print(f"unknown flow {steps!r}; expected flow1|flow2|flow3|flow4|back")
    sys.exit(2)
