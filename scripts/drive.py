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


def dump():
    adb("shell", "uiautomator", "dump", "/sdcard/ui.xml")
    return adb("shell", "cat", "/sdcard/ui.xml")


def find(xml, desc, exact=True):
    """Return (cx, cy) center of the node whose content-desc matches desc."""
    for m in re.finditer(r'content-desc="([^"]*)"[^>]*?bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', xml):
        label, x1, y1, x2, y2 = m.group(1), *map(int, m.groups()[1:])
        if (label == desc) if exact else (desc.lower() in label.lower()):
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
    for marker in ["Tomorrow", "8:00 AM", "24 Cedar Street", "Active"]:
        print(f"  detail shows {marker!r}: {marker.lower() in xml.lower()}")
    sys.exit(0 if ok and req else 1)
