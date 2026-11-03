import { audienceLanding } from './_lib/audience-landing.js';
export const data = { layout:'base.11ty.js', permalink:'/for-students/index.html', path:'for-students/', title:'Trayage for students', seoTitle:'Clean Up Downloads on Mac for Students | Trayage', description:'Review lecture PDFs, repeat downloads, and old installers on your Mac. Trayage helps students clean up Downloads while keeping important coursework.', landingPage:true, tags:['sitePages'], updated:'2026-11-03' };
const content = {
 key:'student', eyebrow:'For students using a Mac', headline:'Make room for class.', headlineEm:'Keep what matters.', intro:'Lecture slides, assignment instructions, and repeat downloads pile up fast. Trayage helps you review your Downloads folder without making the decisions for you.',
 routineTitle:'A Downloads review between terms.', routineIntro:'Keep the work you need first. Then look at the files worth checking.',
 steps:[
  {label:'Keep coursework', title:'Save your work.', text:'Move assignments, research, and lecture materials you still need into your course folders in Finder. Trayage reviews files; it does not sort them into class folders for you.'},
  {label:'Check repeats', title:'Compare copies.', text:'A syllabus or reading downloaded twice may be suggested as a possible duplicate. Check both names, contents, and locations before choosing a copy to remove.'},
  {label:'Review leftovers', title:'Look at large files.', text:'Old recordings and installers can take up space, but you may need them for an exam or offline work. Check each file before moving it to Trash.'}
 ],
 demoTitle:'Review a little at a time.', demoText:'Choose Downloads and use Trayage’s suggestions as a starting point. Open or reveal a file if you need to check it before deciding.', guidePath:'blog/clean-up-mac-downloads/', guideLabel:'Read the Mac Downloads cleanup guide', questionsTitle:'Questions before you tidy up.',
 questions:[
  {question:'How can I clean up Downloads without losing schoolwork?',answer:'First move important coursework into a course folder and check that it opens. Then review possible duplicates, installers, and large or older files. Age alone does not mean a file is safe to remove.'},
  {question:'Does Trayage organize my assignments automatically?',answer:'No. Trayage helps you review files; it does not move assignments into course folders. Use Finder to organize the materials you want to keep.'},
  {question:'Does Trayage upload my coursework?',answer:'No filenames or file contents are uploaded for file analysis. Review happens on your Mac. The direct edition connects to its licensing provider for trial and license checks.'}
 ], closingTitle:'A clearer Downloads folder for the next term.', closingText:'Start with free file review, and keep every decision in your hands.'
};
export default function(data) { return audienceLanding({...data, content}); }
