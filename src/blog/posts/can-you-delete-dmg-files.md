---
title: Can you delete DMG files after installing a Mac app?
seoTitle: Can You Delete DMG Files on Mac? — Trayage
description: Usually, yes—after checking the installed app works without the disk image. Here is what to verify, what to keep, and how to remove the file.
date: 2026-10-06
---
**You can usually delete a downloaded DMG after the app has been installed successfully.** First, check that you are opening an installed copy of the app and that the disk image does not hold anything else you need.

A `.dmg` file is a disk image. Opening it mounts a volume that can contain an app, an installer, or other files. The downloaded DMG, its mounted volume, and an app copied into Applications are distinct things.

## Check that installation is finished

Many Mac apps arrive in a disk image with an instruction to drag the app into Applications. Others provide an installer package with its own steps. Follow the developer’s instructions; opening a DMG by itself does not necessarily install anything. Apple describes this process in its [guide to installing apps from the internet](https://support.apple.com/guide/mac-help/install-and-uninstall-other-apps-mh35835/mac).

Before you remove the download:

1. Finish copying the app or running its installer.
2. Quit the app if it is open.
3. In Finder, eject the mounted disk image using the eject control beside its volume in the sidebar. If macOS says it is in use, close any app or file using it and try again.
4. Open Applications and launch the installed app from there.
5. Check that it starts and that the features you need work.

Opening the installed copy after ejecting the image is a useful check that you were not relying on an app running from the mounted image. If installation fails or the app only works with the image mounted, keep the DMG while you investigate.

## Ejecting and deleting do different jobs

Ejecting unmounts the volume. The downloaded `.dmg` file can still be sitting in Downloads afterward.

Once you have verified the app and decided you no longer need the installer, select the DMG in Finder and move it to Trash. That does not remove a separate app you already installed in Applications.

If you moved the wrong file and it remains in Trash, select it there and choose File → Put Back. Review Trash before emptying it. See Apple’s [file deletion and recovery instructions](https://support.apple.com/guide/mac-help/delete-files-and-folders-on-mac-mchlp1093/mac) for details.

## When it makes sense to keep a DMG

Some disk images are worth keeping. Examples include:

- **An installer you may need offline.** Store it in a clearly named archive rather than leaving it mixed into Downloads.
- **A particular version you depend on.** Check whether you can download that version again before discarding your copy.
- **An image containing your own files.** A DMG can hold documents, backups, or an encrypted collection of files. It is not always an app installer.
- **An installation you have not verified.** Resolve missing files, failed setup steps, or unexpected behavior first.

The extension tells you the file format. What is inside—and whether you need it—is what determines whether you should keep it.

## How Trayage helps you spot old installers

Trayage gathers disk images for review and checks for a similarly named app in Applications. That is a useful clue that you might be finished with an installer, but it does not verify the app’s version, contents, or working state.

Use the suggestion to find the candidate, reveal it in Finder, and do the installation check above. When you choose files for cleanup, Trayage asks for confirmation before moving them to Trash. It never empties the Trash.

If you are reviewing more than installers, the [Downloads cleanup guide]({{ base }}blog/clean-up-mac-downloads/) covers a broader routine for important documents, possible duplicates, and larger files.
