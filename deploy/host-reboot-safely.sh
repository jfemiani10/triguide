#!/usr/bin/env bash
# Reboot this host when systemd's D-Bus is wedged (`sudo reboot` times out),
# WITHOUT gambling on an unbootable kernel.
#
#   sudo ./deploy/host-reboot-safely.sh            # checks only, reboots nothing
#   sudo ./deploy/host-reboot-safely.sh --yes      # checks, then reboots via sysrq
#
# Why this exists: on 2026-10-09 /boot/initrd.img pointed at 6.8.0-142-generic
# while that initramfs did not exist (linux-image-6.8.0-142-generic was stuck
# half-configured because its postinst calls systemctl, which times out). GRUB's
# default entry would have loaded a missing initrd and the machine would not have
# come back. Always run the checks before rebooting this host.
set -euo pipefail

ASSUME_YES=0
[[ "${1:-}" == "--yes" ]] && ASSUME_YES=1

if [[ $EUID -ne 0 ]]; then
  echo "error: must run as root (sudo $0 ${1:-})" >&2
  exit 1
fi

GRUB_CFG=/boot/grub/grub.cfg
problems=0

echo "=== Running kernel ==="
echo "  $(uname -r)"

echo
echo "=== Kernel / initramfs pairing in /boot ==="
for vm in /boot/vmlinuz-*; do
  [[ -e "$vm" ]] || continue
  kver="${vm#/boot/vmlinuz-}"
  if [[ -e "/boot/initrd.img-${kver}" ]]; then
    echo "  OK      ${kver}"
  else
    echo "  MISSING initramfs for ${kver}"
  fi
done

echo
echo "=== Kernel GRUB will boot next ==="
next_entry=""
if command -v grub-editenv >/dev/null 2>&1; then
  next_entry="$(grub-editenv list 2>/dev/null | sed -n 's/^next_entry=//p')"
fi
if [[ -n "$next_entry" ]]; then
  echo "  grubenv next_entry is set: ${next_entry}"
fi

# The default entry (GRUB_DEFAULT=0) is the first menuentry in grub.cfg.
boot_vmlinuz="$(awk '/^[[:space:]]*menuentry /{n++} n==1 && $1=="linux"{print $2; exit}' "$GRUB_CFG" 2>/dev/null || true)"
boot_initrd="$(awk '/^[[:space:]]*menuentry /{n++} n==1 && $1=="initrd"{print $2; exit}' "$GRUB_CFG" 2>/dev/null || true)"

if [[ -z "$boot_vmlinuz" ]]; then
  echo "  WARNING: could not parse the default entry out of ${GRUB_CFG}" >&2
  problems=$((problems + 1))
else
  echo "  linux:  ${boot_vmlinuz}"
  echo "  initrd: ${boot_initrd:-<none declared>}"
  for f in "$boot_vmlinuz" "$boot_initrd"; do
    [[ -z "$f" ]] && continue
    # grub paths are relative to the boot filesystem; try / and /boot.
    if [[ ! -e "$f" && ! -e "/boot${f}" ]]; then
      echo "  ERROR: ${f} does not exist on disk — this boot would FAIL" >&2
      problems=$((problems + 1))
    fi
  done
fi

echo
echo "=== Half-configured / broken packages ==="
broken="$(dpkg -l | awk '$1 ~ /^i[^i]|^iU|^iF/ {print "  " $1 " " $2}')"
if [[ -n "$broken" ]]; then
  echo "$broken"
  echo "  (these can leave /boot inconsistent — fix with: dpkg --configure -a)"
  problems=$((problems + 1))
else
  echo "  none"
fi

echo
echo "=== NVIDIA DKMS coverage ==="
if command -v dkms >/dev/null 2>&1; then
  dkms status 2>/dev/null | sed 's/^/  /'
  if [[ -n "$boot_vmlinuz" ]]; then
    bk="${boot_vmlinuz##*/vmlinuz-}"
    if [[ -n "$bk" ]] && ! dkms status 2>/dev/null | grep -q "$bk"; then
      echo "  WARNING: no DKMS module built for ${bk} — GPU containers will fail after boot" >&2
      problems=$((problems + 1))
    fi
  fi
else
  echo "  dkms not installed"
fi

echo
if (( problems > 0 )); then
  cat >&2 <<MSG
=== NOT SAFE TO REBOOT (${problems} problem(s)) ===

Remedies, in order:

  1. Finish the interrupted package configuration (builds the missing initramfs
     and DKMS modules, regenerates grub.cfg). systemctl calls inside postinst
     scripts will each stall ~25s while systemd is wedged; let it run.

       sudo dpkg --configure -a

     Or target just the initramfs:

       sudo update-initramfs -c -k <kernel-version>

  2. Re-run this script. If it still reports problems, pin the next boot to the
     currently running kernel instead (it is known-good — you are on it):

       sudo grep -n "^menuentry\|submenu\|with Linux $(uname -r)" /boot/grub/grub.cfg
       sudo grub-reboot "Advanced options for Ubuntu>Ubuntu, with Linux $(uname -r)"
       sudo grub-editenv list        # confirm next_entry is set

  3. Then re-run with --yes.
MSG
  exit 1
fi

echo "=== All checks passed ==="
if (( ASSUME_YES == 0 )); then
  echo "Re-run with --yes to reboot via sysrq (sync -> remount read-only -> reboot)."
  exit 0
fi

cat <<MSG

Rebooting now via sysrq, bypassing the wedged systemd.
Your SSH session will drop immediately and will not print anything further.
Expect the host back in roughly 1-2 minutes:

  ssh jonahhome@jfhome     # or: tailscale status | grep jfhome

After it returns:
  systemctl is-system-running
  docker ps
  sudo ./deploy/finish-migration.sh
MSG

sleep 3
sync
echo s > /proc/sysrq-trigger   # flush dirty pages to disk
sleep 3
echo u > /proc/sysrq-trigger   # remount all filesystems read-only
sleep 3
echo b > /proc/sysrq-trigger   # reboot immediately
