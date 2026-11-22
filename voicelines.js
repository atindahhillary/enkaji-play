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
// Sanau said one Maa line for each English + Kiswahili pair; a Kiswahili key points to its English partner's Maa clip (<key>_maa).
const MAA_OF = { p_hongera: 'p_welldone', p_jaribu: 'p_tryagain' };
// Story pages are recorded too (Part 3 in English, Part 4 in Kiswahili); keys are built from the story id and page.
const STORY_LINE_KEY = (storyId, page, lang) => `s_${storyId.replace(/-/g, '')}_${page + 1}_${lang}`;

// ---------- Recording script, round 2: every remaining game line ----------
// Whole sentences where a line is fixed; short joining pieces, numbers and words where a line changes
// every round. Keys come from the text (x_<words>), so a recorded clip plugs in by name.
// The site joins pieces in order (see composeKeys in sound.js): "Mama needs" + "thirty" + "four" + "sticks for the fire."
const VOICE_SCRIPT2 = [
  { part: 'Part 5. Game sentences (say it in English, then say it in Maa)', maa: true, lines: [
    'Eeh! A perfect copy.', 'Look at the herd this morning. Now they come home.', 'Oh no! Which cow did not come home?', 'That one is home. Look again!',
    'You found the brown cow!', 'You found the white cow!', 'You found the black cow!', 'You found the red cow!', 'You found the grey cow!',
    'Say the pattern out loud with me.', 'Make your own collar. Every collar is beautiful!', 'Show your collar to Mama!',
    'Here is your coin back.', 'Now press Pay Ruth.', 'Your code worked! That is what programmers do!', 'The cow is still thirsty. Add more steps.',
    'That is beans. Find the beans basket.', 'That is maize. Find the maize basket.', 'That is stones. Find the stones basket.',
    'Tap the cow to fill each cup. Then press stop.', 'Exactly! You stopped at the right time!', 'Pour some back.',
    'Which cup has more milk?', 'Which cup has less milk?', 'Yes! That cup has more milk.', 'Yes! That cup has less milk.', 'Look again. Compare the milk.',
    'Almost!', 'You played it just like Mama!', 'Count the cows again.',
  ] },
  { part: 'Part 6. Joining pieces (English, one short piece at a time, no Maa)', lines: [
    'Mama needs', 'sticks for the fire.', 'cups of milk.', 'Not yet. We need', 'more.', 'Too many! Mama asked for', 'Karibu!', 'is', 'shillings.',
    'Please find the', 'shuka', 'That is', 'starts with', 'Find the picture that starts with the letter', 'Which picture starts with the letter', 'Yes!', 'is for',
    'tens and', 'ones make', 'ones.', 'There are', 'cows in the boma.', 'more cows come home!', 'cows go to the river to drink.', 'plus', 'take away',
  ] },
  { part: 'Part 7. Numbers in English', lines: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'] },
  { part: 'Part 8. English words: colours, letters, pictures and market things', lines: [
    'red', 'orange', 'green', 'blue', 'sky blue', 'yellow', 'white', 'black', 'brown', 'grey',
    'C', 'G', 'H', 'T', 'D', 'M', 'B', 'S', 'W', 'F', 'L',
    'cow', 'goat', 'hut', 'tree', 'drum', 'maize', 'beads', 'sun', 'water', 'fire', 'cup', 'lamb',
    'sweet, pipi', 'onion', 'tomato', 'mandazi', 'banana', 'salt', 'egg', 'tea leaves', 'roast maize', 'cup of milk', 'cup of sugar',
  ] },
  { part: 'Part 9. Kiswahili words, numbers and syllables', lang: 'sw', lines: [
    'Hesabu tena.', 'Asante sana!', 'Hiyo ni', 'Tafadhali tafuta shuka', 'Jenga neno:', 'Vijiti', 'na',
    'moja', 'mbili', 'tatu', 'nne', 'tano', 'sita', 'saba', 'nane', 'tisa', 'kumi', 'ishirini', 'thelathini', 'arobaini', 'hamsini', 'sitini', 'sabini', 'themanini', 'tisini',
    'nyekundu', 'rangi ya chungwa', 'kijani', 'bluu', 'samawati', 'njano', 'nyeupe', 'nyeusi',
    'mama', 'baba', 'maji', 'jua', 'moto', 'mbuzi', 'tofali', 'mahindi', 'shanga', 'kikombe', 'ngoma',
    'ma', 'ba', 'ji', 'ju', 'a', 'mo', 'to', 'shu', 'ka', 'ngo', 'mbu', 'zi', 'fa', 'li', 'hi', 'ndi', 'sha', 'nga', 'ki', 'ko', 'mbe', 'pi', 'lo', 'ne', 'ru', 'se', 'wa', 'bo',
  ] },
];
// Words a line is matched on: lower case, punctuation dropped.
const VOICE_WORDS = t => (t.toLowerCase().replace(/[’']/g, '').match(/[a-z0-9]+/g) || []);
const VOICE_KEY2 = t => 'x_' + VOICE_WORDS(t).join('_');
