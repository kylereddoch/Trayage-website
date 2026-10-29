---
title: "How to Use Trayage's Smart Filters to Review Your Mac Downloads"
seoTitle: How to Use Trayage Smart Filters on Mac
description: Learn how to use Trayage 1.1 smart filters, custom rules, and matching-file previews to review Mac Downloads before cleanup.
date: 2026-10-29
category: Guides
articleImage: assets/blog/smart-filters/filter-results-light.png
---

Your Mac's Downloads folder can accumulate files for months without much attention. Some are old installers. Others are archives, documents, or large files that you might not need anymore.

Finding those files is only part of cleaning up. You still have to decide which ones are worth keeping.

Trayage 1.1 includes smart filters that help narrow a folder review to the files you want to inspect. You can start with a built-in filter or create your own rules, preview the matches, and decide what to do with individual files.

Here's how to make those filters useful without treating every match as something that should be deleted.

## Start with the folder you want to review

Open Trayage on your Mac and select Downloads, or choose another folder you want to inspect.

Trayage reviews files directly inside the selected folder. It doesn't recursively search through every subfolder on your Mac.

The overview gives you a summary of the folder and groups of files worth checking. Open the full review window when you want to inspect individual suggestions.

If you're using Trayage for the first time, there's no need to start with your entire collection of files. Choose a folder you recognize and take a look at what the app finds.

File analysis runs locally on your Mac. Purchases, licensing, and updates use the connections described in the [privacy policy]({{ base }}privacy/).

## Start with one of the built-in smart filters

Trayage 1.1 includes 14 smart-filter presets to help you find files that match particular review criteria.

Rather than browsing every item in Downloads, start with a preset that reflects the task you're trying to accomplish.

For example, you may want to concentrate on older downloads or files taking up a substantial amount of space.

Open **Smart filters** in the review toolbar, or use **+** beside the sidebar’s Smart filters heading. Choose **Presets**, then **Customize** on a preset such as **Older files**, **Large files**, or **Older installers**. This opens the editor so you can check the conditions and preview the matching files before choosing **Save filter**.

<figure>
<picture><source data-dark-source media="(prefers-color-scheme: dark)" srcset="{{ base }}assets/blog/smart-filters/filter-presets-dark.png"><img src="{{ base }}assets/blog/smart-filters/filter-presets-light.png" alt="Trayage Smart filters library with the Presets tab showing Large files, Older files, Not opened recently, Older installers, Large archives, and Large videos." width="1440" height="1520" loading="lazy" decoding="async"></picture>
<figcaption>Start with a preset, then customize its conditions. Native Trayage 1.1 capture with sample files, provided by RelayByte.</figcaption>
</figure>

The result is a smaller group to inspect. A match doesn't mean the file is unnecessary or that Trayage has selected it for deletion.

That's an important distinction.

A large archive might contain a project you're keeping. An installer from several months ago might still be needed for a system that can't use a newer version.

Smart filters help you find candidates. You still make the decision.

## Create a filter that matches your own priorities

The built-in presets are a starting point, but everyone uses Downloads differently.

Choose **Create filter** in the Smart filters library to start from scratch, or customize a preset. Enter a **Filter name**, then use **Add condition** to combine the rules you need. Trayage lets you adjust age and size thresholds for each saved filter.

For example, imagine you want to review downloads added to the folder at least 30 days ago that are at least 100 MB. Add an **Added to folder** condition with **at least** and **30** days, plus a **File size** condition with **is at least** and **100** MB. These are example thresholds, so adjust them to your own review.

A custom filter using **All conditions** can narrow the results to files meeting both requirements.

If you instead use **Any condition**, files matching either condition can appear.

That difference matters.

An All rule generally produces a more focused list when you're combining conditions. An Any rule can be useful for a broader review, but it may include files that are only old or only large.

Neither approach is inherently better. Choose the one that matches the question you're trying to answer.

Before saving your filter, preview the matching files. Check whether the results are useful and adjust the thresholds if needed.

Choose **Save filter** to open the complete results. The live preview shows the matching count, total file size, and up to eight examples. Enable **Pin to sidebar and menu bar** if you want the saved filter close at hand. Unpinned filters remain in **Your filters**, where **View files** opens their results.

Date, Finder-tag, and source-website rules depend on metadata macOS has recorded. An unknown last-opened date does not mean a file has never been opened. Saved filter rules are independent of the general cleanup thresholds in Settings.

<figure>
<picture><source data-dark-source media="(prefers-color-scheme: dark)" srcset="{{ base }}assets/blog/smart-filters/filter-editor-dark.png"><img src="{{ base }}assets/blog/smart-filters/filter-editor-light.png" alt="Trayage filter editor showing Older installers, All conditions, file type and last-modified rules, matching-file preview, and Save filter." width="1440" height="1520" loading="lazy" decoding="async"></picture>
<figcaption>This example combines installer type with a last-modified threshold of 14 days. Native Trayage 1.1 capture with sample files, provided by RelayByte.</figcaption>
</figure>

## Inspect a matching file before taking action

A smart filter can tell you that a file meets your criteria. It can't tell you everything about why that file exists or whether you'll need it again.

Select a matching file and review the available details.

<figure>
<picture><source data-dark-source media="(prefers-color-scheme: dark)" srcset="{{ base }}assets/blog/smart-filters/filter-results-dark.png"><img src="{{ base }}assets/blog/smart-filters/filter-results-light.png" alt="Trayage Older installers results showing three sample disk images, a Why it matches explanation, and zero files selected for cleanup." width="2200" height="1520" loading="lazy" decoding="async"></picture>
<figcaption>Saving a filter opens its results. Highlighting a row for details does not select it for cleanup. Native Trayage 1.1 capture with sample files, provided by RelayByte.</figcaption>
</figure>

For anything uncertain, use **Reveal in Finder** to inspect it in its original location.

An old ZIP archive might contain source files you haven't saved elsewhere. A large video could be the only original recording you have.

Take the time to check.

The same caution applies to possible duplicates. Trayage 1.1 uses local content comparisons within likely filename-and-size candidate groups. The **Matching copies** preset uses those verified results; it is not an exhaustive search for identical files with different names. You still decide which copy to keep. If you are reviewing installers instead, the [DMG guide]({{ base }}blog/can-you-delete-dmg-files/) explains what to check before removing a disk image.

If you aren't sure, leave the file alone.

## Hide suggestions for files you want to keep

Sometimes a file is worth noticing but doesn't need to be removed.

Trayage lets you hide a suggestion without deleting the file.

That can be useful when a download repeatedly appears in your review even though you've decided to keep it.

Hidden suggestions can be restored through **Settings** if you want to reconsider them later. Hidden suggestions also stay out of smart-filter results until the file changes or you restore the suggestion.

Keeping a file shouldn't require repeatedly explaining the same decision to your cleanup utility.

## Confirm cleanup only when you're ready

Once you've reviewed your filtered results, select only the files you no longer need.

Trayage requires you to confirm the cleanup action before selected files move to the Mac's Trash.

The app doesn't empty Trash.

Moving files to Trash also doesn't immediately reclaim their disk space. You can review the contents of Trash in Finder before deciding whether to empty it yourself.

Keep a backup of important information, and avoid removing anything you haven't identified with reasonable confidence.

There is no requirement to clear every suggestion in a session.

## Make smart filters useful over time

The value of a saved filter is that you don't have to reconstruct the same review criteria whenever you return to Downloads.

You might keep one filter focused on older files and another for larger downloads. If your priorities change, adjust the rules rather than forcing every folder into the same cleanup routine.

A useful review should leave you with a better understanding of what is in the folder, not simply a lower file count.

That's the purpose of smart filters in Trayage: helping you focus your attention on the files you actually want to inspect.

## Try Trayage on your Mac

Trayage supports macOS {{ releases.minimumMacOS }} or later on Apple silicon and Intel Macs.

You can review files for free, and the direct-download edition offers a {{ site.pricing.trialDays }}-day trial of cleanup functionality without an automatic charge.

[Download Trayage for Mac]({{ base }}download/) and try a smart filter with a folder you already know.

If you're new to the app, you can also read [What happens when you clean up with Trayage?]({{ base }}blog/your-first-trayage-review/) for an introduction to the review and confirmation workflow.
