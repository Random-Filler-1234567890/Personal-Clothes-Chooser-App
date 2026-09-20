import type { Category, ClothingItem, Fit, Formality, Season, Sleeve, Subcategory } from '@/src/types';

type SeedItem = Omit<ClothingItem, 'id' | 'createdAt' | 'wearCount' | 'favorite' | 'archived'>;

function item(
  name: string,
  category: Category,
  subcategory: Subcategory,
  colors: string[],
  formality: Formality,
  opts: Partial<Pick<SeedItem, 'pattern' | 'brand' | 'fit' | 'sleeve' | 'season' | 'notes'>> = {}
): SeedItem {
  return {
    name,
    category,
    subcategory,
    colors,
    formality,
    season: opts.season ?? 'all',
    fit: opts.fit,
    sleeve: opts.sleeve,
    pattern: opts.pattern,
    brand: opts.brand,
    notes: opts.notes,
  };
}

// Shoes
const shoes: SeedItem[] = [
  item('Black sneakers with white accents', 'shoes', 'sneakers', ['black', 'white'], 'casual'),
  item('Light grey sneakers, darker grey base', 'shoes', 'sneakers', ['light-grey', 'grey'], 'casual'),
  item('White leather sneakers', 'shoes', 'sneakers', ['white'], 'smart-casual'),
  item('Navy sneakers with white base', 'shoes', 'sneakers', ['navy', 'white'], 'casual'),
  item('Tobacco brown leather Birkenstocks', 'shoes', 'sandals', ['brown', 'tan'], 'casual', { season: 'warm' }),
];

// Socks
const socks: SeedItem[] = [
  item('White socks', 'socks', 'socks', ['white'], 'casual'),
  item('Black socks', 'socks', 'socks', ['black'], 'casual'),
];

// Pants — casual / athletic
const pantsCasual: SeedItem[] = [
  item('White loose pants', 'bottom', 'pants', ['white'], 'casual', { fit: 'loose' }),
  item('Black loose pants (1)', 'bottom', 'pants', ['black'], 'casual', { fit: 'loose' }),
  item('Black loose pants (2)', 'bottom', 'pants', ['black'], 'casual', { fit: 'loose' }),
  item('Black tight pants', 'bottom', 'pants', ['black'], 'casual', { fit: 'tight' }),
  item('Bright red loose pants', 'bottom', 'pants', ['red'], 'casual', { fit: 'loose' }),
  item('Brown loose pants', 'bottom', 'pants', ['brown'], 'casual', { fit: 'loose' }),
  item('Navy loose pants', 'bottom', 'pants', ['navy'], 'casual', { fit: 'loose' }),
  item('Navy tight pants', 'bottom', 'pants', ['navy'], 'casual', { fit: 'tight' }),
  item('Medium grey tight pants', 'bottom', 'pants', ['grey'], 'casual', { fit: 'tight' }),
  item('Light grey loose pants', 'bottom', 'pants', ['light-grey'], 'casual', { fit: 'loose' }),
];

// Pants — dressier
const pantsDressy: SeedItem[] = [
  item('Dark grey J.Crew stretch pants', 'bottom', 'chinos', ['dark-grey'], 'smart-casual', {
    brand: 'J.Crew',
    fit: 'regular',
  }),
  item('Dark blue jeans', 'bottom', 'jeans', ['denim'], 'casual', { fit: 'regular' }),
  item('Khaki-toned dark grey J.Crew stretch pants', 'bottom', 'chinos', ['khaki', 'dark-grey'], 'smart-casual', {
    brand: 'J.Crew',
    fit: 'regular',
  }),
  item('Tan khakis', 'bottom', 'chinos', ['tan'], 'smart-casual', { fit: 'regular' }),
];

// Shorts — casual
const shortsCasual: SeedItem[] = [
  item('Blue and white sky-print shorts', 'shorts', 'shorts', ['blue', 'white'], 'casual', {
    pattern: 'sky / cloud print',
  }),
  item('Slightly dark grey shorts', 'shorts', 'shorts', ['dark-grey'], 'casual'),
  item('Medium grey shorts', 'shorts', 'shorts', ['grey'], 'casual'),
  item('Black shorts (1)', 'shorts', 'shorts', ['black'], 'casual'),
  item('Black shorts (2)', 'shorts', 'shorts', ['black'], 'casual'),
  item('Light blue shorts', 'shorts', 'shorts', ['light-blue'], 'casual'),
  item('Tan / beige shorts', 'shorts', 'shorts', ['tan'], 'casual'),
];

// Shorts — dressier / athletic
const shortsDressyAthletic: SeedItem[] = [
  item('Dark brown khaki shorts', 'shorts', 'dress-shorts', ['dark-brown'], 'smart-casual'),
  item('Light brown khaki shorts', 'shorts', 'dress-shorts', ['light-brown'], 'smart-casual'),
  item('Light grey polyester shorts', 'shorts', 'dress-shorts', ['light-grey'], 'smart-casual'),
  item('White performance stretch shorts', 'shorts', 'shorts', ['white'], 'athletic'),
  item('Taupe athletic shorts, elastic waistband', 'shorts', 'shorts', ['taupe'], 'athletic'),
  item('Black athletic shorts', 'shorts', 'shorts', ['black'], 'athletic'),
];

// Short sleeve tees & graphic tees
const tees: SeedItem[] = [
  item('Dark grey Star Wars graphic tee', 'top', 'graphic-tee', ['dark-grey', 'white'], 'casual', {
    pattern: 'Star Wars graphic',
    sleeve: 'short',
  }),
  item('Medium grey tee, blue/green back graphic', 'top', 'graphic-tee', ['grey', 'blue', 'green'], 'casual', {
    pattern: 'blue/green graphic on back',
    sleeve: 'short',
  }),
  item('Black Batman graphic tee', 'top', 'graphic-tee', ['black'], 'casual', {
    pattern: 'Batman graphic',
    sleeve: 'short',
  }),
  item('Teal Mandalorian graphic tee', 'top', 'graphic-tee', ['teal', 'dark-green'], 'casual', {
    pattern: 'Mandalorian graphic',
    sleeve: 'short',
  }),
  item('White tee (1)', 'top', 'tshirt', ['white'], 'casual', { sleeve: 'short' }),
  item('Black tee (1)', 'top', 'tshirt', ['black'], 'casual', { sleeve: 'short' }),
  item('Bright green tee', 'top', 'tshirt', ['bright-green'], 'casual', { sleeve: 'short' }),
  item('Olive green tee (1)', 'top', 'tshirt', ['olive'], 'casual', { sleeve: 'short' }),
  item('Light purple tee', 'top', 'tshirt', ['light-purple'], 'casual', { sleeve: 'short' }),
  item('Dark red tee', 'top', 'tshirt', ['dark-red'], 'casual', { sleeve: 'short' }),
  item('Light pink tee', 'top', 'tshirt', ['light-pink'], 'casual', { sleeve: 'short' }),
  item('Olive green tee (2)', 'top', 'tshirt', ['olive'], 'casual', { sleeve: 'short' }),
  item('Black tee (2)', 'top', 'tshirt', ['black'], 'casual', { sleeve: 'short' }),
  item('White tee (2)', 'top', 'tshirt', ['white'], 'casual', { sleeve: 'short' }),
  item('Light blue Calvin Klein tee', 'top', 'tshirt', ['light-blue'], 'casual', {
    brand: 'Calvin Klein',
    sleeve: 'short',
  }),
  item('Green Calvin Klein tee', 'top', 'tshirt', ['green'], 'casual', { brand: 'Calvin Klein', sleeve: 'short' }),
  item('Grey Calvin Klein tee', 'top', 'tshirt', ['grey'], 'casual', { brand: 'Calvin Klein', sleeve: 'short' }),
  item('Black MIT equation graphic tee', 'top', 'graphic-tee', ['black'], 'casual', {
    pattern: 'MIT equation graphic',
    brand: 'MIT',
    sleeve: 'short',
  }),
  item('Cream tee', 'top', 'tshirt', ['cream'], 'casual', { sleeve: 'short' }),
  item('Black tee (3)', 'top', 'tshirt', ['black'], 'casual', { sleeve: 'short' }),
  item('Black tee (4)', 'top', 'tshirt', ['black'], 'casual', { sleeve: 'short' }),
  item('Black tee (5)', 'top', 'tshirt', ['black'], 'casual', { sleeve: 'short' }),
  item('Dark olive green tee (3)', 'top', 'tshirt', ['dark-olive'], 'casual', { sleeve: 'short' }),
  item('Light grey tee', 'top', 'tshirt', ['light-grey'], 'casual', { sleeve: 'short' }),
  item("Black tee, '2028' front / 'Grade 8' back graphic", 'top', 'graphic-tee', ['black', 'yellow'], 'casual', {
    pattern: "'2028' front graphic, 'Grade 8' back graphic",
    sleeve: 'short',
  }),
  item("Black 'Clue' graphic tee", 'top', 'graphic-tee', ['black', 'white'], 'casual', {
    pattern: "'Clue' text graphic, front and back",
    sleeve: 'short',
  }),
  item('Black tee, Arabic calligraphy + multicolor graphic', 'top', 'graphic-tee', ['black', 'white', 'red'], 'casual', {
    pattern: 'Arabic calligraphy front, multicolor hand/logo graphic',
    sleeve: 'short',
  }),
];

// Long sleeve
const longSleeve: SeedItem[] = [
  item('MIT Artemis rocket long sleeve tee', 'top', 'long-sleeve', [], 'casual', {
    brand: 'MIT',
    sleeve: 'long',
    notes: 'Ring-spun cotton. Color not captured yet — edit after adding a photo.',
  }),
];

// Dressier short sleeve: polos & button-ups
const dressyShortSleeve: SeedItem[] = [
  item('Brown melange knit quarter-zip polo', 'top', 'polo', ['brown'], 'smart-casual', { sleeve: 'short' }),
  item('Black embroidered structured polo', 'top', 'polo', ['black', 'white'], 'smart-casual', {
    pattern: 'small embroidered logo, top left',
    sleeve: 'short',
  }),
  item('Yellow linen button-up', 'top', 'button-up', ['yellow'], 'smart-casual', { sleeve: 'short', season: 'warm' }),
  item('Light blue tropical print button-up', 'top', 'button-up', ['light-blue', 'white'], 'smart-casual', {
    pattern: 'tropical beach scene, white palm trees',
    sleeve: 'short',
    season: 'warm',
  }),
  item('Blue and white striped button-up', 'top', 'button-up', ['blue', 'white'], 'smart-casual', {
    pattern: 'stripes',
    sleeve: 'short',
  }),
  item('Black micro dot button-up', 'top', 'button-up', ['black', 'white'], 'smart-casual', {
    pattern: 'all-over white micro dot',
    sleeve: 'short',
  }),
  item('Dark brown stripe button-up', 'top', 'button-up', ['dark-brown', 'off-white'], 'smart-casual', {
    pattern: 'vertical stripes on off-white',
    sleeve: 'short',
  }),
  item('White port city landscape button-down', 'top', 'button-up', ['white', 'blue'], 'smart-casual', {
    pattern: 'blue port city landscape along lower hem',
    sleeve: 'short',
  }),
  item('Pastel abstract relaxed-fit button-up', 'top', 'button-up', ['multicolor-pastel'], 'smart-casual', {
    pattern: 'abstract multicolor pastel wash',
    fit: 'relaxed',
    sleeve: 'short',
  }),
  item('Dark blue textured button-down', 'top', 'button-up', ['dark-blue'], 'smart-casual', { sleeve: 'short' }),
  item('White micro dot button-up', 'top', 'button-up', ['white', 'black'], 'smart-casual', {
    pattern: 'all-over black micro dot',
    sleeve: 'short',
  }),
];

// Belts
const belts: SeedItem[] = [
  item('Medium-brown reversible belt', 'belt', 'belt', ['brown'], 'smart-casual', {
    notes: 'Reversible, polished silver swivel buckle.',
  }),
  item('Deep chocolate brown leather belt', 'belt', 'belt', ['dark-brown'], 'smart-casual', {
    notes: 'Dark gunmetal frame.',
  }),
  item('All-black matte leather belt', 'belt', 'belt', ['black'], 'smart-casual', {
    notes: 'Matching dark hardware.',
  }),
  item('Espresso-brown woven braided belt', 'belt', 'belt', ['espresso-brown'], 'casual', {
    notes: 'Antique brass buckle.',
  }),
];

// Hoodies, sweaters & jackets
const outerwear: SeedItem[] = [
  item('Light grey performance sweater', 'outerwear', 'sweater', ['light-grey'], 'athletic'),
  item('Black lightweight hooded jacket', 'outerwear', 'hoodie', ['black'], 'casual'),
  item('Dark grey Yale crewneck sweatshirt', 'outerwear', 'sweatshirt', ['dark-grey'], 'casual', { brand: 'Yale' }),
  item('Black Calvin Klein Sport track jacket', 'outerwear', 'track-jacket', ['black'], 'athletic', {
    brand: 'Calvin Klein',
    notes: 'Stand collar, subtle chest panel detailing.',
  }),
  item('Olive khaki linen-blend overshirt', 'outerwear', 'overshirt', ['olive'], 'smart-casual'),
  item('Black Calvin Klein track jacket, white piping', 'outerwear', 'track-jacket', ['black', 'white'], 'casual', {
    brand: 'Calvin Klein',
  }),
  item('Charcoal/black Calvin Klein mock-neck fleece', 'outerwear', 'fleece', ['charcoal', 'black'], 'casual', {
    brand: 'Calvin Klein',
  }),
  item('Beige Michael Kors crewneck sweatshirt', 'outerwear', 'sweatshirt', ['beige'], 'casual', {
    brand: 'Michael Kors',
  }),
  item('Charcoal Calvin Klein crewneck sweatshirt', 'outerwear', 'sweatshirt', ['charcoal'], 'casual', {
    brand: 'Calvin Klein',
  }),
  item('Beige Yale varsity jacket', 'outerwear', 'varsity-jacket', ['beige', 'white'], 'smart-casual', {
    brand: 'Yale',
    pattern: 'white collegiate "Y" patch on chest',
  }),
  item('Black Calvin Klein zip-up athletic jacket', 'outerwear', 'track-jacket', ['black'], 'athletic', {
    brand: 'Calvin Klein',
    notes: 'Smooth, stretchy tech-fabric finish.',
  }),
  item('Black quilted puffer jacket', 'outerwear', 'puffer', ['black'], 'casual'),
  item('Black Calvin Klein full-zip activewear jacket', 'outerwear', 'track-jacket', ['black'], 'smart-casual', {
    brand: 'Calvin Klein',
    notes: 'Reserved for dressier occasions.',
  }),
];

// Sleepwear
const sleepwear: SeedItem[] = [
  item('Buffalo check pajama pants', 'sleepwear', 'pajama-pants', ['brown', 'beige', 'white'], 'athletic', {
    pattern: 'brown/beige/white buffalo check plaid',
  }),
];

// Formal: long sleeve dress shirts
const dressShirts: SeedItem[] = [
  item('Light blue/white micro-check dress shirt', 'top', 'dress-shirt', ['light-blue', 'white'], 'formal', {
    pattern: 'micro-check',
    sleeve: 'long',
  }),
  item('Black dress shirt', 'top', 'dress-shirt', ['black'], 'formal', { sleeve: 'long' }),
  item('White dress shirt', 'top', 'dress-shirt', ['white'], 'formal', { sleeve: 'long' }),
  item('White textured dress shirt', 'top', 'dress-shirt', ['white'], 'formal', { sleeve: 'long' }),
  item('Light blue textured dress shirt', 'top', 'dress-shirt', ['light-blue'], 'formal', { sleeve: 'long' }),
  item('Light blue dress shirt', 'top', 'dress-shirt', ['light-blue'], 'formal', { sleeve: 'long' }),
];

// Formal: suit, formal belt, ties
const formalWear: SeedItem[] = [
  item('Black suit blazer', 'outerwear', 'blazer', ['black'], 'formal'),
  item('Black suit pants', 'bottom', 'dress-pants', ['black'], 'formal', { fit: 'regular' }),
  item('Black formal belt', 'belt', 'belt', ['black'], 'formal'),
  item('Satin red tie', 'tie', 'tie', ['red'], 'formal'),
  item('Yellow micro weave tie', 'tie', 'tie', ['yellow'], 'formal'),
  item('Light purple micro weave tie', 'tie', 'tie', ['light-purple'], 'formal'),
  item('Dark magenta micro weave tie', 'tie', 'tie', ['dark-magenta'], 'formal'),
];

// Swimwear
const swimwear: SeedItem[] = [item('Black swim trunks', 'swimwear', 'swim-trunks', ['black'], 'casual', { season: 'warm' })];

export const closetSeed: SeedItem[] = [
  ...shoes,
  ...socks,
  ...pantsCasual,
  ...pantsDressy,
  ...shortsCasual,
  ...shortsDressyAthletic,
  ...tees,
  ...longSleeve,
  ...dressyShortSleeve,
  ...belts,
  ...outerwear,
  ...sleepwear,
  ...dressShirts,
  ...formalWear,
  ...swimwear,
];
