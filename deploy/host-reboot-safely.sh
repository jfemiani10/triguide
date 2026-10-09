#!/usr/bin/env bash
# Reboot this host when systemd's D-Bus is wedged (`sudo reboot` times out),
# WITHOUT gambling on an unbootable kernel.
#
#   sudo ./deploy/host-reboot-safely.sh                 # checks only
#   sudo ./deploy/host-reboot-safely.sh --pin-running   # boot the running kernel next
#   sudo ./deploy/host-reboot-safely.sh --yes           # checks, then reboot via sysrq
#
# Background (2026-10-09): PID 1 stopped answering D-Bus on this host, so
# systemctl/reboot time out and Docker cannot create container cgroup scopes.
# The same wedge left linux-image-6.8.0-142-generic half-configured: its postinst
# runs /etc/kernel/postinst.d/dkms before initramfs-tools, the NVIDIA 595.84 build
# fails against 6.8.0-142 (of_dma_configure signature), run-parts aborts, and the
# initramfs is never built -- while /boot/initrd.img and GRUB's default entry both
# point at that kernel. Booting it would strand the machine with no remote recovery.
set -euo pipefail

MODE=check
case "${1:-}" in
  "")              MODE=check ;;
  --yes)           MODE=reboot ;;
  --pin-running)   MODE=pin ;;
  *) echo "usage: $0 [--pin-running|--yes]" >&2; exit 2 ;;
esac

if [[ $EUID -ne 0 ]]; then
  echo "error: must run as root (sudo $0 ${1:-})" >&2
  exit 1
fi

GRUB_CFG=/boot/grub/grub.cfg
RUNNING="$(uname -r)"
fatal=0
warn=0

note()  { printf '  %s\n' "$*"; }
bad()   { printf '  ERROR: %s\n' "$*" >&2; fatal=$((fatal + 1)); }
soft()  { printf '  WARNING: %s\n' "$*" >&2; warn=$((warn + 1)); }

# --- resolve the kernel GRUB will boot next -----------------------------------
# A pinned next_entry wins; otherwise GRUB_DEFAULT=0 means the first menuentry.
next_entry=""
if command -v grub-editenv >/dev/null 2>&1; then
  next_entry="$(grub-editenv list 2>/dev/null | sed -n 's/^next_entry=//p' || true)"
fi

target_kver=""
if [[ -n "$next_entry" ]]; then
  # Ubuntu entry ids/titles embed the version: gnulinux-6.8.0-138-generic-advanced-<uuid>
  target_kver="$(grep -oE '[0-9]+\.[0-9]+\.[0-9]+-[0-9]+-[a-z]+' <<<"$next_entry" | head -1 || true)"
fi
if [[ -z "$target_kver" ]]; then
  default_linux="$(awk '/^[[:space:]]*menuentry /{n++} n==1 && $1=="linux"{print $2; exit}' "$GRUB_CFG" 2>/dev/null || true)"
  target_kver="${default_linux##*/vmlinuz-}"
fi

echo "=== What will boot ==="
note "running kernel:  ${RUNNING}"
if [[ -n "$next_entry" ]]; then
  note "grubenv pin:     ${next_entry}"
else
  note "grubenv pin:     <none> (GRUB_DEFAULT=0 -> first menuentry)"
fi
note "kernel on boot:  ${target_kver:-<could not determine>}"

echo
echo "=== Kernel / initramfs pairing in /boot ==="
for vm in /boot/vmlinuz-*; do
  [[ -e "$vm" ]] || continue
  kver="${vm#/boot/vmlinuz-}"
  if [[ -e "/boot/initrd.img-${kver}" ]]; then
    note "OK      ${kver}"
  else
    note "MISSING initramfs for ${kver}"
  fi
done

echo
echo "=== Boot target integrity ==="
if [[ -z "$target_kver" ]]; then
  bad "could not determine which kernel GRUB will boot (parse of ${GRUB_CFG} failed)"
else
  for f in "/boot/vmlinuz-${target_kver}" "/boot/initrd.img-${target_kver}"; do
    if [[ -e "$f" ]]; then
      note "present: ${f}"
    else
      bad "${f} is missing -- this boot would FAIL with no remote recovery"
    fi
  done
fi

echo
echo "=== DKMS coverage for the boot target ==="
if command -v dkms >/dev/null 2>&1; then
  dkms status 2>/dev/null | sed 's/^/  /'
  if [[ -n "$target_kver" ]] && ! dkms status 2>/dev/null | grep -q "$target_kver"; then
    soft "no DKMS module built for ${target_kver} -- GPU containers (ai-clipper) will fail after boot"
  fi
else
  note "dkms not installed"
fi

echo
echo "=== Half-configured packages ==="
broken="$(dpkg -l | awk '$1 ~ /^i[^i]/ {print $1 " " $2}')"
if [[ -n "$broken" ]]; then
  sed 's/^/  /' <<<"$broken"
  soft "packages left unconfigured; harmless for this reboot as long as the boot target above is intact"
else
  note "none"
fi

# --- pin mode ------------------------------------------------------------------
if [[ "$MODE" == "pin" ]]; then
  echo
  echo "=== Pinning next boot to ${RUNNING} ==="
  if [[ ! -e "/boot/initrd.img-${RUNNING}" ]]; then
    echo "  ERROR: the running kernel has no initramfs either; refusing to pin" >&2
    exit 1
  fi
  if ! grep -q 'next_entry' "$GRUB_CFG"; then
    echo "  ERROR: ${GRUB_CFG} has no next_entry handling; a pin would be ignored." >&2
    echo "  Use option B instead (build the missing initramfs)." >&2
    exit 1
  fi
  sub_id="$(grep -m1 -oE "^submenu '[^']*' [^']*'[^']*'" "$GRUB_CFG" | grep -oE "'[^']*'$" | tr -d "'" || true)"
  leaf_id="$(grep -E "menuentry '[^']*with Linux ${RUNNING}'" "$GRUB_CFG" \
             | grep -v recovery \
             | grep -m1 -oE "'gnulinux-[^']*'" | tr -d "'" | head -1 || true)"
  if [[ -z "$leaf_id" ]]; then
    echo "  ERROR: no GRUB entry found for ${RUNNING} in ${GRUB_CFG}" >&2
    echo "  Inspect manually: grep -n \"menuentry\\|submenu\" ${GRUB_CFG}" >&2
    exit 1
  fi
  if [[ -n "$sub_id" ]]; then
    entry_path="${sub_id}>${leaf_id}"
  else
    entry_path="${leaf_id}"
  fi
  note "entry: ${entry_path}"
  grub-reboot "$entry_path"
  note "grubenv now:"
  grub-editenv list | sed 's/^/    /'
  echo
  echo "Pinned for one boot only. Re-run the checks, then reboot:"
  echo "  sudo $0            # verify it now reports ${RUNNING} as the boot target"
  echo "  sudo $0 --yes"
  exit 0
fi

echo
if (( fatal > 0 )); then
  cat >&2 <<MSG
=== NOT SAFE TO REBOOT (${fatal} fatal, ${warn} warning) ===

The kernel GRUB would boot cannot boot. Pick one:

  Do BOTH, in this order. A pinned boot that fails falls back to the default
  entry, so the default must be bootable too.

  B. Make the current default bootable (no GPU on that kernel until NVIDIA can
     build against it, but it will at least boot):

       sudo update-initramfs -c -k ${target_kver:-<kernel>}
       sudo update-grub

  A. Then pin this one boot to the kernel you are already running, which has a
     working NVIDIA module:

       sudo $0 --pin-running

Then re-run the checks and reboot:

  sudo $0
  sudo $0 --yes
MSG
  exit 1
fi

echo "=== Safe to reboot (${warn} warning(s)) ==="
if [[ "$MODE" != "reboot" ]]; then
  echo "Re-run with --yes to reboot via sysrq (sync -> remount read-only -> reboot)."
  exit 0
fi

cat <<MSG

Rebooting now via sysrq, bypassing the wedged systemd.
Your SSH session will drop immediately and print nothing further.
Expect the host back in roughly 1-2 minutes, on kernel ${target_kver}:

  ssh jonahhome@jfhome

After it returns:
  systemctl is-system-running
  docker ps
  cd ~/projects/triguide && sudo ./deploy/finish-migration.sh
MSG

sleep 3
sync
echo s > /proc/sysrq-trigger   # flush dirty pages to disk
sleep 3
echo u > /proc/sysrq-trigger   # remount all filesystems read-only
sleep 3
echo b > /proc/sysrq-trigger   # reboot immediately
