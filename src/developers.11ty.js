import { audienceLanding } from './_lib/audience-landing.js';
export const data = { layout:'base.11ty.js', permalink:'/for-developers/index.html', path:'for-developers/', title:'Trayage for Mac developers', seoTitle:'Review Mac Installers and Downloads | Trayage for Developers', description:'Review old DMG installers, repeat downloads, and large files on your Mac. Trayage helps developers find candidates without automatic deletion.', landingPage:true, tags:['sitePages'], updated:'2026-11-03' };
const content = {
 key:'developer', eyebrow:'For developers using a Mac', headline:'Less installer clutter.', headlineEm:'More room to build.', intro:'SDK downloads, DMG installers, and repeat files can collect between projects. Trayage helps you review what is in Downloads and choose what you still need.',
 routineTitle:'Review downloads without breaking your setup.', routineIntro:'A file extension or a matching app name is a clue, not a deletion rule.',
 steps:[
  {label:'Verify the install',title:'Check the app.',text:'For a downloaded DMG, eject the mounted image and confirm the installed app opens from Applications. Keep the image while investigating an incomplete install.'},
  {label:'Keep the version',title:'Archive what matters.',text:'An older installer or SDK may be needed for a specific project, an offline setup, or a version that is hard to obtain again. Move it to an archive in Finder if you need it.'},
  {label:'Compare downloads',title:'Review the repeats.',text:'Trayage flags likely repeat downloads for review. Compare names, versions, and locations; matching content does not mean both copies are unnecessary.'}
 ],
 demoTitle:'Find the next file to check.', demoText:'Trayage can flag a disk image when a similarly named app exists in Applications. That does not verify the installed version or prove the installer is no longer needed.', guidePath:'blog/can-you-delete-dmg-files/', guideLabel:'Read the guide to DMG files', questionsTitle:'Before removing an installer.',
 questions:[
  {question:'Can I delete a DMG after installing a Mac app?',answer:'Often, once the installed app works without the mounted disk image and you no longer need the installer. Keep it if you need the version offline, cannot obtain it again, or have not verified the installation.'},
  {question:'Does Trayage clean developer caches or search my whole disk?',answer:'No. Trayage reviews files directly inside Downloads or another selected folder. It is not a whole-disk cleaner, package manager, or developer cache cleaner.'},
  {question:'Are duplicate matches always safe to remove?',answer:'No. Trayage 1.1 can compare likely duplicate contents locally, but matching files may be needed in different locations. Earlier versions may use names and sizes without content comparison. Review each copy before cleanup.'}
 ], closingTitle:'Give Downloads a closer look.', closingText:'Review installers and possible repeat downloads on your Mac. You stay in control.'
};
export default function(data) { return audienceLanding({...data, content}); }
