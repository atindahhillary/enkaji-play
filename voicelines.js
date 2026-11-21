// Lines for Sanau to record, in the order of the recording script (voice/script.html).
// Each recorded line is saved as voice/<key>.mp3. Once a key is in SANAU_LINES (data.js),
// any matching text is played in Sanau's voice instead of the phone's text-to-speech.
// Maa words use the MAA keys, so they plug straight into the existing Maa word list.
const VOICE_SCRIPT = [
  { part: 'Part 1. Maa words (say each word once, clearly)', lines: [
    ['hello', 'Takwenya!', 'Maa'], ['iko', 'Iko', 'Maa'], ['supa', 'Supa!', 'Maa'], ['supaAll', 'Entasupai!', 'Maa'],
    ['good', 'Sidai oleng!', 'Maa'], ['thanks', 'Ashe oleng', 'Maa'], ['look', 'Tadua!', 'Maa'], ['come', 'Wou!', 'Maa'],
    ['yes', 'Ee', 'Maa'], ['bye', 'Sere', 'Maa'], ['mother', 'Yeyo', 'Maa'], ['koko', 'Koko', 'Maa'], ['child', 'Enkerai', 'Maa'],
    ['house', 'Enkaji', 'Maa'], ['enkang', 'Enkang', 'Maa'], ['water', 'Enkare', 'Maa'], ['milk', 'Kule', 'Maa'],
    ['beads', 'Isaen', 'Maa'], ['calf', 'Enkashe', 'Maa'], ['cattle', 'Inkishu', 'Maa'], ['white', 'Naibor', 'Maa'], ['black', 'Narok', 'Maa'],
  ] },
  { part: 'Part 2. Praise and game instructions (English and Kiswahili)', lines: [
    ['p_welldone', 'Well done!', 'en'], ['p_hongera', 'Hongera!', 'sw'], ['p_tryagain', 'Try again, you can!', 'en'],
    ['p_jaribu', 'Jaribu tena, unaweza!', 'sw'], ['p_pole', 'Pole! Nearly there.', 'en'], ['p_asante', 'Asante sana! Karibu tena!', 'sw'],
    ['p_sawa', 'Sawa sawa! Exactly right.', 'en'], ['p_aii', 'Aii, that is too much!', 'en'], ['p_listen', 'Listen again carefully.', 'en'],
    ['p_lookcolours', 'Look at my tower. Remember the colours!', 'en'], ['p_buildit', 'Now you build it! Bottom brick first.', 'en'],
    ['p_coming', 'The cows are coming home. Watch!', 'en'], ['p_countme', 'Touch each cow and count with me.', 'en'],
    ['p_howmanyhome', 'So, how many cows came home?', 'en'], ['p_howmanynow', 'How many cows are in the boma now?', 'en'],
    ['p_beadnext', 'Which bead comes next?', 'en'], ['p_harvest', 'Help Mama sort the harvest! Put each one in its own basket.', 'en'],
    ['p_drumlisten', 'Listen to Mama’s drum.', 'en'], ['p_yourturn', 'Your turn! Play it back.', 'en'],
    ['p_thirsty', 'The cow is thirsty! Give her steps to reach the water.', 'en'], ['p_bug', 'Pole! A bug. Fix the code and run again.', 'en'],
    ['p_jenga', 'Jenga neno.', 'sw'], ['p_sikiliza', 'Karibu! Sikiliza tena.', 'sw'], ['p_starts', 'Which picture starts with this letter?', 'en'],
    ['p_letsplay', 'Let’s play and learn!', 'en'],
  ] },
];
// Story pages are recorded too (Part 3 in English, Part 4 in Kiswahili); keys are built from the story id and page.
const STORY_LINE_KEY = (storyId, page, lang) => `s_${storyId.replace(/-/g, '')}_${page + 1}_${lang}`;
