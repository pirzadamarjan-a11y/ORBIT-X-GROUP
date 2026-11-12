export const NASA_PLANETS_URL = 'https://science.nasa.gov/solar-system/planets/';
export const NASA_FACT_SHEET_URL =
  'https://nssdc.gsfc.nasa.gov/planetary/factsheet/';

export const SUN = {
  id: 'sun',
  name: 'Sun',
  symbol: '☉',
  type: 'G-type main-sequence star',
  tagline: 'The engine at the center of everything.',
  accent: '#ffcb6b',
  accent2: '#ff8a3d',
  diameter: '1.39 million km',
  stats: [
    { label: 'Diameter', value: '1.39 million km' },
    { label: 'Surface temp.', value: '≈5,500°C' },
    { label: 'Age', value: '≈4.6 billion years' },
    { label: 'Composition', value: '73% H · 25% He' },
    { label: 'Rotation', value: '≈25 days (equator)' },
    { label: 'Mass share', value: '99.86% of solar system' },
  ],
  description:
    'The Sun contains more than 99.8% of the mass in the solar system. Its gravity holds every planet in orbit, while fusion in its core converts about 600 million tonnes of hydrogen into helium every second.',
  note: 'Do not look directly at the Sun. This visualization is a simulation, not a live solar feed.',
};

export const PLANETS = [
  {
    id: 'mercury',
    name: 'Mercury',
    index: 1,
    symbol: '☿',
    type: 'Terrestrial planet',
    tagline: 'A scorched, cratered world racing around the Sun.',
    description:
      'Mercury is the smallest planet and the closest to the Sun. With almost no atmosphere to trap heat, it swings between some of the most extreme surface temperatures in the solar system.',
    accent: '#c7b9a7',
    accent2: '#83786d',
    gradient: 'linear-gradient(135deg, #a89e91, #5b544d 55%, #302d2a)',
    scene: {
      radius: 0.52,
      orbitRadius: 11,
      orbitSpeed: 0.22,
      spinSpeed: 0.085,
      tilt: 0.001,
      initialAngle: 1.9,
    },
    stats: [
      { label: 'Diameter', value: '4,879 km' },
      { label: 'Distance from Sun', value: '57.9 million km (0.39 AU)' },
      { label: 'Mean temperature', value: '167°C (surface range −173 to 427°C)' },
      { label: 'Length of day', value: '58.6 Earth days (sidereal)' },
      { label: 'Length of year', value: '88 Earth days' },
      { label: 'Known moons', value: '0' },
    ],
    quickStats: {
      gravity: '3.7 m/s² (0.38 g)',
      radius: '2,439.7 km',
      solarDay: '176 Earth days',
      orbitalSpeed: '47.4 km/s',
    },
    overview:
      'Mercury has a heavily cratered, Moon-like surface marked by ancient lava plains, cliffs and impact basins. It has no true atmosphere, only a tenuous exosphere, and NASA’s MESSENGER mission found water ice locked in permanently shadowed polar craters.',
    facts: [
      {
        title: 'A year shorter than a day',
        text: 'One Mercury solar day lasts about twice as long as its year because the planet turns slowly while racing around the Sun.',
      },
      {
        title: 'Extreme temperature swing',
        text: 'Sunlit surfaces can exceed 400°C, while the night side drops far below freezing within the same planetary day.',
      },
      {
        title: 'A giant iron core',
        text: 'Mercury’s metallic core makes up roughly 85% of its radius, a much larger fraction than Earth’s.',
      },
    ],
    discoveries: [
      {
        title: 'Ice at the poles',
        text: 'MESSENGER detected hydrogen-rich deposits consistent with water ice in polar craters that never receive direct sunlight.',
      },
      {
        title: 'Shrinking planet',
        text: 'Long cliffs called lobate scarps formed as Mercury’s interior cooled and the planet contracted over billions of years.',
      },
    ],
    surface:
      'Cratered highlands, smooth volcanic plains and long thrust faults cover a world with virtually no weathering or wind erosion. The Caloris basin is one of the largest impact structures on the planet.',
    atmosphere: {
      summary:
        'No substantial atmosphere. A surface-bound exosphere is supplied by solar wind interactions, micrometeorite impacts and outgassing.',
      composition: [
        { name: 'Oxygen', value: 42 },
        { name: 'Sodium', value: 29 },
        { name: 'Hydrogen', value: 22 },
        { name: 'Helium', value: 6 },
      ],
      note: 'Composition by number density; percentages are approximate.',
    },
    moons: {
      count: 0,
      label: 'No moons',
      text: 'Mercury has no natural satellites. Its gravity and proximity to the Sun make stable long-term orbits difficult.',
      notable: [],
    },
    rings: {
      present: false,
      text: 'No ring system has been detected around Mercury.',
    },
    exploration: [
      { year: '1974–75', name: 'Mariner 10', text: 'First spacecraft to visit Mercury; mapped about 45% of the surface.' },
      { year: '2011–15', name: 'MESSENGER', text: 'First orbiter; mapped the entire planet and discovered polar ice deposits.' },
      { year: '2018–', name: 'BepiColombo', text: 'ESA/JAXA mission that arrived in Mercury orbit in 2026 after multiple gravity assists.' },
    ],
    source: NASA_FACT_SHEET_URL,
  },
  {
    id: 'venus',
    name: 'Venus',
    index: 2,
    symbol: '♀',
    type: 'Terrestrial planet',
    tagline: 'A runaway greenhouse beneath golden clouds.',
    description:
      'Venus is similar in size to Earth, yet it is the hottest planet in the solar system. A dense carbon-dioxide atmosphere and sulfuric-acid clouds create a runaway greenhouse effect.',
    accent: '#e9c58d',
    accent2: '#b77b3e',
    gradient: 'linear-gradient(135deg, #f4d7a0, #c49555 48%, #6f4b25)',
    scene: {
      radius: 0.92,
      orbitRadius: 15.4,
      orbitSpeed: 0.166,
      spinSpeed: -0.045,
      tilt: 0.05,
      initialAngle: 4.2,
    },
    stats: [
      { label: 'Diameter', value: '12,104 km' },
      { label: 'Distance from Sun', value: '108.2 million km (0.72 AU)' },
      { label: 'Mean temperature', value: '464°C' },
      { label: 'Length of day', value: '243 Earth days (retrograde)' },
      { label: 'Length of year', value: '224.7 Earth days' },
      { label: 'Known moons', value: '0' },
    ],
    quickStats: {
      gravity: '8.87 m/s² (0.90 g)',
      radius: '6,051.8 km',
      solarDay: '116.8 Earth days',
      orbitalSpeed: '35.0 km/s',
    },
    overview:
      'Venus rotates backward and so slowly that its day is longer than its year. At the surface, atmospheric pressure is about 92 times Earth’s, and the clouds are made of sulfuric acid. Beneath them lies a volcanic landscape of plains, highlands and thousands of volcanoes.',
    facts: [
      {
        title: 'Hotter than Mercury',
        text: 'Venus is farther from the Sun than Mercury, but its greenhouse atmosphere keeps it hotter than any other planet.',
      },
      {
        title: 'Backward spin',
        text: 'Venus rotates in the opposite direction to most planets, so the Sun rises in the west if viewed from the surface.',
      },
      {
        title: 'Super-rotating atmosphere',
        text: 'The upper cloud deck circles the planet in about four Earth days, far faster than the solid planet rotates.',
      },
    ],
    discoveries: [
      {
        title: 'A resurfaced world',
        text: 'Radar mapping suggests much of Venus’s surface was reshaped by volcanism within the last few hundred million years.',
      },
      {
        title: 'Possible active volcanism',
        text: 'Recent reanalysis of Magellan radar data identified surface changes consistent with ongoing volcanic activity.',
      },
    ],
    surface:
      'Mostly volcanic plains with highland regions such as Ishtar Terra and Aphrodite Terra. Surface rocks are hot enough to glow faintly. There is no liquid water; the surface is extremely dry.',
    atmosphere: {
      summary:
        'Dense CO₂ atmosphere with clouds of sulfuric acid. The greenhouse effect is driven by carbon dioxide and trace gases.',
      composition: [
        { name: 'Carbon dioxide', value: 96.5 },
        { name: 'Nitrogen', value: 3.5 },
        { name: 'Sulfur dioxide', value: 0.015 },
      ],
      pressure: '≈92 bar at the surface',
    },
    moons: {
      count: 0,
      label: 'No moons',
      text: 'Venus has no natural satellites, despite frequent searches and many passing asteroids.',
      notable: [],
    },
    rings: {
      present: false,
      text: 'No rings have been detected around Venus.',
    },
    exploration: [
      { year: '1970–82', name: 'Venera 7–14', text: 'Soviet landers returned the first images from another planet’s surface.' },
      { year: '1990–94', name: 'Magellan', text: 'Radar mapped about 98% of the surface through the clouds.' },
      { year: '2020s', name: 'VERITAS & EnVision', text: 'Planned radar orbiters will study the surface and climate evolution.' },
    ],
    source: NASA_FACT_SHEET_URL,
  },
  {
    id: 'earth',
    name: 'Earth',
    index: 3,
    symbol: '⊕',
    type: 'Terrestrial planet',
    tagline: 'The only known world with life.',
    description:
      'Earth is an ocean world with a protective magnetic field, a nitrogen–oxygen atmosphere and active plate tectonics. It is the only place in the universe where life is confirmed to exist.',
    accent: '#5fa8ff',
    accent2: '#2bd3b5',
    gradient: 'linear-gradient(135deg, #79c9ff, #1770c9 48%, #0b3a62)',
    scene: {
      radius: 1.0,
      orbitRadius: 20.4,
      orbitSpeed: 0.132,
      spinSpeed: 0.16,
      tilt: 0.41,
      initialAngle: 0.3,
    },
    stats: [
      { label: 'Diameter', value: '12,742 km' },
      { label: 'Distance from Sun', value: '149.6 million km (1 AU)' },
      { label: 'Mean temperature', value: '15°C' },
      { label: 'Length of day', value: '23 hours 56 minutes' },
      { label: 'Length of year', value: '365.25 days' },
      { label: 'Known moons', value: '1' },
    ],
    quickStats: {
      gravity: '9.81 m/s² (1.00 g)',
      radius: '6,371 km',
      solarDay: '24 hours',
      orbitalSpeed: '29.8 km/s',
    },
    overview:
      'About 71% of Earth’s surface is covered by water. The planet’s atmosphere and magnetic field shield the surface from much of the solar wind and cosmic radiation. Plate tectonics continuously recycle its crust and help regulate the carbon cycle over geological timescales.',
    facts: [
      {
        title: 'A dynamic magnetosphere',
        text: 'Earth’s rotating liquid-iron outer core generates a magnetic field that deflects charged particles from the solar wind.',
      },
      {
        title: 'Plate tectonics',
        text: 'Earth is the only planet where large-scale plate tectonics is confirmed, recycling crust and shaping continents.',
      },
      {
        title: 'The Goldilocks orbit',
        text: 'Earth orbits where sunlight allows liquid water to remain stable on the surface, a key ingredient for known life.',
      },
    ],
    discoveries: [
      {
        title: 'A living atmosphere',
        text: 'Oxygen at 21% is largely maintained by photosynthesis, making Earth’s atmosphere chemically distinctive.',
      },
      {
        title: 'Deep ocean frontier',
        text: 'The deep ocean remains one of the least explored environments on Earth, with many species still undiscovered.',
      },
    ],
    surface:
      'Continents, ocean basins, polar ice sheets, mountain ranges and vast plains. Earth’s surface is shaped by water, weather, biology and plate movement on short and long timescales.',
    atmosphere: {
      summary:
        'Nitrogen–oxygen atmosphere with a stratospheric ozone layer. The atmosphere moderates temperature and protects the surface.',
      composition: [
        { name: 'Nitrogen', value: 78.08 },
        { name: 'Oxygen', value: 20.95 },
        { name: 'Argon', value: 0.93 },
        { name: 'Carbon dioxide', value: 0.04 },
      ],
      pressure: '≈1.01 bar at sea level',
    },
    moons: {
      count: 1,
      label: '1 moon',
      text: 'The Moon stabilizes Earth’s axial tilt and drives ocean tides.',
      notable: [{ name: 'Moon', note: '3,475 km diameter · about 384,400 km away' }],
    },
    rings: {
      present: false,
      text: 'Earth has no rings. Some artificial satellites orbit in ring-like belts, but no natural ring system exists.',
    },
    exploration: [
      { year: '1972', name: 'Apollo 17', text: 'The most recent crewed Moon landing; collected 110.5 kg of lunar samples.' },
      { year: '1990–', name: 'Earth observation fleet', text: 'Satellites monitor climate, weather, oceans and land change continuously.' },
      { year: 'ISS', name: 'International Space Station', text: 'A continuously crewed orbital laboratory since 2000.' },
    ],
    source: NASA_FACT_SHEET_URL,
  },
  {
    id: 'mars',
    name: 'Mars',
    index: 4,
    symbol: '♂',
    type: 'Terrestrial planet',
    tagline: 'A cold desert with a water-carved past.',
    description:
      'Mars is a cold, dusty world with the largest volcano and one of the largest canyon systems in the solar system. Robotic explorers are investigating evidence of ancient rivers, lakes and habitable environments.',
    accent: '#ef8e61',
    accent2: '#a83d24',
    gradient: 'linear-gradient(135deg, #eea37b, #b94e2d 50%, #5c2417)',
    scene: {
      radius: 0.72,
      orbitRadius: 25.4,
      orbitSpeed: 0.104,
      spinSpeed: 0.15,
      tilt: 0.44,
      initialAngle: 2.8,
    },
    stats: [
      { label: 'Diameter', value: '6,779 km' },
      { label: 'Distance from Sun', value: '227.9 million km (1.52 AU)' },
      { label: 'Mean temperature', value: '−65°C' },
      { label: 'Length of day', value: '24 hours 37 minutes' },
      { label: 'Length of year', value: '687 Earth days' },
      { label: 'Known moons', value: '2' },
    ],
    quickStats: {
      gravity: '3.71 m/s² (0.38 g)',
      radius: '3,389.5 km',
      solarDay: '24 hours 40 minutes',
      orbitalSpeed: '24.1 km/s',
    },
    overview:
      'Mars has a thin carbon-dioxide atmosphere, polar ice caps and the solar system’s tallest volcano, Olympus Mons. Rovers and orbiters have found minerals and landforms that require liquid water to form, indicating a wetter early climate.',
    facts: [
      {
        title: 'Olympus Mons',
        text: 'This shield volcano rises about 21.9 km above its surrounding plains, roughly two and a half times the height of Mount Everest.',
      },
      {
        title: 'Valles Marineris',
        text: 'The canyon system stretches more than 4,000 km, roughly the width of the United States.',
      },
      {
        title: 'A thin atmosphere',
        text: 'Surface pressure is less than 1% of Earth’s, so liquid water is not stable at the surface today.',
      },
    ],
    discoveries: [
      {
        title: 'Ancient lakebeds',
        text: 'Curiosity found mudstones and chemical evidence consistent with long-lived ancient lakes in Gale Crater.',
      },
      {
        title: 'Perseverance and Ingenuity',
        text: 'Perseverance is caching samples for future return; Ingenuity became the first powered aircraft to fly on another planet.',
      },
    ],
    surface:
      'Rust-colored iron-oxide dust, basalt plains, giant shield volcanoes, polar caps and dry river valleys. Seasonal dust storms can spread across the entire planet.',
    atmosphere: {
      summary:
        'Thin carbon-dioxide atmosphere with suspended dust; about 1% as dense as Earth’s at the surface.',
      composition: [
        { name: 'Carbon dioxide', value: 95.1 },
        { name: 'Nitrogen', value: 2.6 },
        { name: 'Argon', value: 1.9 },
        { name: 'Oxygen', value: 0.17 },
      ],
      pressure: '≈0.006 bar (average surface)',
    },
    moons: {
      count: 2,
      label: '2 moons',
      text: 'Phobos and Deimos are small, irregular bodies likely captured from the asteroid belt or formed from impact debris.',
      notable: [
        { name: 'Phobos', note: '≈22.5 km mean diameter · orbits in 7.7 hours' },
        { name: 'Deimos', note: '≈12.4 km mean diameter · orbits in 30.3 hours' },
      ],
    },
    rings: {
      present: false,
      text: 'Mars has no rings; its small moons would not produce a stable, visible ring under current conditions.',
    },
    exploration: [
      { year: '1976', name: 'Viking 1 & 2', text: 'First successful Mars landers; searched for signs of life.' },
      { year: '2012', name: 'Curiosity', text: 'Found evidence of ancient freshwater lakes and organic molecules.' },
      { year: '2021–', name: 'Perseverance', text: 'Exploring Jezero Crater and caching samples for a future return mission.' },
    ],
    source: NASA_FACT_SHEET_URL,
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    index: 5,
    symbol: '♃',
    type: 'Gas giant',
    tagline: 'The solar system’s giant storm engine.',
    description:
      'Jupiter is the largest planet in the solar system and a gas giant with a powerful magnetic field. Its atmosphere is a turbulent mix of hydrogen and helium, organized into colorful bands and storms, including the Great Red Spot.',
    accent: '#e8c39b',
    accent2: '#b1764f',
    gradient: 'linear-gradient(135deg, #f1d5b5, #b9845d 45%, #6c4330)',
    scene: {
      radius: 2.75,
      orbitRadius: 36.8,
      orbitSpeed: 0.064,
      spinSpeed: 0.28,
      tilt: 0.05,
      initialAngle: 5.2,
    },
    stats: [
      { label: 'Diameter', value: '139,820 km' },
      { label: 'Distance from Sun', value: '778.5 million km (5.20 AU)' },
      { label: 'Mean temperature', value: '−110°C (cloud tops)' },
      { label: 'Length of day', value: '9 hours 56 minutes' },
      { label: 'Length of year', value: '11.9 Earth years' },
      { label: 'Known moons', value: '95 confirmed' },
    ],
    quickStats: {
      gravity: '24.79 m/s² (2.53 g)',
      radius: '69,911 km',
      solarDay: '9 hours 56 minutes',
      orbitalSpeed: '13.1 km/s',
    },
    overview:
      'Jupiter is more massive than all the other planets combined. Its rapid rotation stretches cloud systems into bands, and its magnetosphere is the largest planetary structure in the solar system. A faint ring system surrounds it, discovered by Voyager 1.',
    facts: [
      {
        title: 'A colossal storm',
        text: 'The Great Red Spot is a long-lived anticyclonic storm wider than Earth; observations show it has been shrinking over decades.',
      },
      {
        title: 'Fastest rotation',
        text: 'Jupiter rotates once in under 10 hours, faster than any other planet, flattening it slightly at the poles.',
      },
      {
        title: 'Ocean moons',
        text: 'Europa probably hides a global salt-water ocean beneath an icy crust, making it a major target in the search for life.',
      },
    ],
    discoveries: [
      {
        title: 'A magnetic powerhouse',
        text: 'Jupiter’s magnetic field is thousands of times stronger than Earth’s and drives brilliant auroras at its poles.',
      },
      {
        title: 'Juno’s polar storms',
        text: 'NASA’s Juno spacecraft revealed clusters of cyclones and complex polar structure invisible from Earth.',
      },
    ],
    surface:
      'No solid surface. Pressure and density increase until hydrogen becomes metallic deep inside. The visible “surface” is the top of a deep, dynamic cloud deck.',
    atmosphere: {
      summary:
        'Hydrogen–helium atmosphere with ammonia and water clouds. Banded winds reach hundreds of kilometers per hour.',
      composition: [
        { name: 'Hydrogen', value: 90 },
        { name: 'Helium', value: 10 },
        { name: 'Methane', value: 0.3 },
        { name: 'Other trace gases', value: 0.2 },
      ],
    },
    moons: {
      count: 95,
      label: '95 confirmed moons',
      text: 'Jupiter’s four largest moons—Io, Europa, Ganymede and Callisto—were discovered by Galileo in 1610. New small moons continue to be announced.',
      notable: [
        { name: 'Ganymede', note: 'Largest moon in the solar system; larger than Mercury' },
        { name: 'Europa', note: 'Icy moon with a probable subsurface ocean' },
        { name: 'Io', note: 'Most volcanically active body known' },
      ],
    },
    rings: {
      present: true,
      text: 'Jupiter has three faint ring components made mainly of dust from small moons and impacts. They are difficult to see from Earth.',
    },
    exploration: [
      { year: '1979', name: 'Voyager 1 & 2', text: 'Imaged the Great Red Spot and discovered Jupiter’s ring system.' },
      { year: '1995–2003', name: 'Galileo', text: 'First Jupiter orbiter; measured atmospheric composition and studied its moons.' },
      { year: '2016–', name: 'Juno', text: 'Probing Jupiter’s interior, gravity field and polar atmosphere.' },
    ],
    source: NASA_FACT_SHEET_URL,
  },
  {
    id: 'saturn',
    name: 'Saturn',
    index: 6,
    symbol: '♄',
    type: 'Gas giant',
    tagline: 'A ringed world of ice and quiet storms.',
    description:
      'Saturn is famous for its dazzling rings, but it is also a gas giant with a complex atmosphere, dozens of moons and some of the most intriguing ocean worlds in the solar system.',
    accent: '#f0dbae',
    accent2: '#b9955f',
    gradient: 'linear-gradient(135deg, #f8ecc6, #d7bc83 45%, #8d6d43)',
    scene: {
      radius: 2.35,
      orbitRadius: 47.5,
      orbitSpeed: 0.047,
      spinSpeed: 0.24,
      tilt: 0.47,
      initialAngle: 2.2,
    },
    stats: [
      { label: 'Diameter', value: '116,460 km' },
      { label: 'Distance from Sun', value: '1.43 billion km (9.58 AU)' },
      { label: 'Mean temperature', value: '−140°C (cloud tops)' },
      { label: 'Length of day', value: '10 hours 42 minutes' },
      { label: 'Length of year', value: '29.4 Earth years' },
      { label: 'Known moons', value: '274 (2025 count)' },
    ],
    quickStats: {
      gravity: '10.44 m/s² (1.06 g)',
      radius: '58,232 km',
      solarDay: '10 hours 33 minutes',
      orbitalSpeed: '9.7 km/s',
    },
    overview:
      'Saturn’s ring system is made of countless pieces of water ice and rocky debris, ranging from dust grains to boulders. The planet is less dense than water overall. Its moon Titan has a thick atmosphere and lakes of liquid hydrocarbons, while Enceladus vents water-rich plumes from a subsurface ocean.',
    facts: [
      {
        title: 'Rings built from ice',
        text: 'The main rings are mostly water ice. Their total mass is about half that of Enceladus, spread across a span wider than Earth-Moon distance.',
      },
      {
        title: 'Titan’s methane cycle',
        text: 'Titan has rivers, lakes and seas of liquid methane and ethane—an active cycle unlike any other moon known.',
      },
      {
        title: 'A hexagon at the pole',
        text: 'A persistent six-sided jet stream encircles Saturn’s north pole, a striking result of atmospheric dynamics.',
      },
    ],
    discoveries: [
      {
        title: 'Ocean plumes on Enceladus',
        text: 'Cassini flew through geysers of water vapor and ice particles venting from Enceladus’s south polar region.',
      },
      {
        title: 'Ring rain',
        text: 'Cassini showed material from the rings falling into Saturn’s atmosphere, gradually altering the planet’s upper atmosphere.',
      },
    ],
    surface:
      'No solid surface. Saturn’s visible clouds are arranged in muted bands. Deeper inside, hydrogen and helium become increasingly compressed, with a dense core region beneath.',
    atmosphere: {
      summary:
        'Hydrogen–helium atmosphere with ammonia hazes. Winds near the equator can exceed 1,600 km/h.',
      composition: [
        { name: 'Hydrogen', value: 96.3 },
        { name: 'Helium', value: 3.2 },
        { name: 'Methane', value: 0.4 },
        { name: 'Other trace gases', value: 0.1 },
      ],
    },
    moons: {
      count: 274,
      label: '274 confirmed moons (2025)',
      text: 'Saturn has the largest known moon count in the solar system. The count keeps growing as small irregular moons are detected.',
      notable: [
        { name: 'Titan', note: 'Larger than Mercury; thick nitrogen atmosphere' },
        { name: 'Enceladus', note: 'Icy ocean world with active water plumes' },
        { name: 'Mimas', note: 'Small moon with a giant Herschel crater' },
      ],
    },
    rings: {
      present: true,
      text: 'A spectacular system of seven main ring groups spanning about 282,000 km, made mostly of ice particles. The rings are extremely thin compared with their width.',
    },
    exploration: [
      { year: '2004–17', name: 'Cassini–Huygens', text: 'Orbited Saturn for 13 years, landed Huygens on Titan and discovered Enceladus’s plumes.' },
      { year: '2027', name: 'Dragonfly (planned)', text: 'NASA rotorcraft mission designed to explore Titan’s chemistry and habitability.' },
    ],
    source: NASA_FACT_SHEET_URL,
  },
  {
    id: 'uranus',
    name: 'Uranus',
    index: 7,
    symbol: '♅',
    type: 'Ice giant',
    tagline: 'The tilted blue-green ice giant.',
    description:
      'Uranus is an ice giant that orbits on its side, likely tipped by an ancient collision. Its blue-green color comes from methane absorbing red wavelengths in an atmosphere dominated by hydrogen and helium.',
    accent: '#a7eff3',
    accent2: '#53aebd',
    gradient: 'linear-gradient(135deg, #d0fbfc, #80d4dc 45%, #367c8b)',
    scene: {
      radius: 1.55,
      orbitRadius: 58.2,
      orbitSpeed: 0.033,
      spinSpeed: -0.19,
      tilt: 1.71,
      initialAngle: 0.8,
    },
    stats: [
      { label: 'Diameter', value: '50,724 km' },
      { label: 'Distance from Sun', value: '2.87 billion km (19.2 AU)' },
      { label: 'Mean temperature', value: '−195°C' },
      { label: 'Length of day', value: '17.2 hours (retrograde)' },
      { label: 'Length of year', value: '84 Earth years' },
      { label: 'Known moons', value: '28' },
    ],
    quickStats: {
      gravity: '8.87 m/s² (0.89 g)',
      radius: '25,362 km',
      solarDay: '17 hours 14 minutes',
      orbitalSpeed: '6.8 km/s',
    },
    overview:
      'Uranus has the most extreme axial tilt of any planet at about 98°, so its poles take turns facing the Sun through the long Uranian year. It was the first planet discovered with a telescope, by William Herschel in 1781. Only Voyager 2 has visited.',
    facts: [
      {
        title: 'A sideways planet',
        text: 'Uranus’s axis is tilted about 98°, likely by a massive impact early in its history. Seasons last about 21 Earth years.',
      },
      {
        title: 'Faint rings',
        text: 'Uranus has 13 known rings made of dark particles. They were discovered from Earth in 1977 before Voyager 2 saw them close up.',
      },
      {
        title: 'Shakespearean moons',
        text: 'Many of Uranus’s moons are named after characters from the works of William Shakespeare and Alexander Pope.',
      },
    ],
    discoveries: [
      {
        title: 'An unlikely magnetic field',
        text: 'Uranus’s magnetic field is tilted and offset from its rotation axis, unlike a simple bar magnet.',
      },
      {
        title: 'The missing heat glow',
        text: 'Uranus emits far less internal heat than Neptune, contributing to its relatively featureless appearance.',
      },
    ],
    surface:
      'No solid surface. A deep hydrogen–helium envelope surrounds a water-ammonia-methane “ice” mantle and a rocky core. The visible clouds are cold and faint.',
    atmosphere: {
      summary:
        'Hydrogen–helium atmosphere with methane, which absorbs red light and gives the planet its cyan hue.',
      composition: [
        { name: 'Hydrogen', value: 82.5 },
        { name: 'Helium', value: 15.2 },
        { name: 'Methane', value: 2.3 },
      ],
    },
    moons: {
      count: 28,
      label: '28 known moons',
      text: 'Uranus’s moons are small and dark, with diverse geology. Miranda shows enormous cliffs and fractured terrain.',
      notable: [
        { name: 'Titania', note: 'Largest moon; icy surface with canyons' },
        { name: 'Miranda', note: 'Fractured moon with Verona Rupes cliffs' },
        { name: 'Ariel', note: 'Bright icy surface with valleys' },
      ],
    },
    rings: {
      present: true,
      text: 'Thirteen known narrow, dark rings. They are made of particles ranging from dust to boulder-sized objects and are difficult to observe.',
    },
    exploration: [
      { year: '1781', name: 'William Herschel', text: 'Discovered Uranus using a telescope, the first planet found in the modern era.' },
      { year: '1986', name: 'Voyager 2', text: 'The only spacecraft to visit Uranus; discovered 10 moons and imaged its rings.' },
      { year: 'future', name: 'Uranus Orbiter and Probe', text: 'A high-priority concept mission recommended by planetary scientists.' },
    ],
    source: NASA_FACT_SHEET_URL,
  },
  {
    id: 'neptune',
    name: 'Neptune',
    index: 8,
    symbol: '♆',
    type: 'Ice giant',
    tagline: 'A deep-blue world of supersonic winds.',
    description:
      'Neptune is the most distant planet and the windiest, with storms powerful enough to tear across its atmosphere at supersonic speeds. It was discovered through mathematics before it was directly observed.',
    accent: '#6a9bff',
    accent2: '#2949b8',
    gradient: 'linear-gradient(135deg, #8bb8ff, #3f6be0 50%, #182b70)',
    scene: {
      radius: 1.5,
      orbitRadius: 68.5,
      orbitSpeed: 0.024,
      spinSpeed: 0.22,
      tilt: 0.49,
      initialAngle: 3.9,
    },
    stats: [
      { label: 'Diameter', value: '49,244 km' },
      { label: 'Distance from Sun', value: '4.50 billion km (30.1 AU)' },
      { label: 'Mean temperature', value: '−200°C' },
      { label: 'Length of day', value: '16.1 hours' },
      { label: 'Length of year', value: '164.8 Earth years' },
      { label: 'Known moons', value: '16' },
    ],
    quickStats: {
      gravity: '11.15 m/s² (1.14 g)',
      radius: '24,622 km',
      solarDay: '16 hours 6 minutes',
      orbitalSpeed: '5.4 km/s',
    },
    overview:
      'Neptune is an ice giant with a hydrogen–helium atmosphere and methane that absorbs red light, giving it a deep blue color. It was predicted mathematically from irregularities in Uranus’s orbit and found by Johann Galle in 1846. Voyager 2 flew past in 1989.',
    facts: [
      {
        title: 'Supersonic winds',
        text: 'Winds on Neptune can reach about 2,100 km/h, faster than the speed of sound and the strongest measured in the solar system.',
      },
      {
        title: 'A mathematical discovery',
        text: 'Urbain Le Verrier calculated Neptune’s likely position from Uranus’s orbital wobble; it was found within a degree.',
      },
      {
        title: 'A captured moon',
        text: 'Triton orbits Neptune backward and is thought to be a captured Kuiper Belt object.',
      },
    ],
    discoveries: [
      {
        title: 'Transient dark storms',
        text: 'Voyager 2 saw the Great Dark Spot in 1989. Hubble later observed other dark vortices appearing and disappearing.',
      },
      {
        title: 'Triton’s geysers',
        text: 'Voyager 2 detected nitrogen geysers erupting from Triton’s icy surface, evidence of active geology in deep cold.',
      },
    ],
    surface:
      'No solid surface. Neptune’s interior is likely a hot, dense fluid of water, ammonia and methane over a rocky core. Its weather is driven by internal heat.',
    atmosphere: {
      summary:
        'Hydrogen–helium atmosphere with methane and faint haze. Rapid atmospheric motions persist despite weak sunlight.',
      composition: [
        { name: 'Hydrogen', value: 80 },
        { name: 'Helium', value: 19 },
        { name: 'Methane', value: 1.5 },
      ],
    },
    moons: {
      count: 16,
      label: '16 known moons',
      text: 'Most of Neptune’s moons are small and irregular. Triton is by far the largest and has a young, icy surface.',
      notable: [
        { name: 'Triton', note: 'Retrograde orbit; probable captured Kuiper Belt object' },
        { name: 'Proteus', note: 'Irregularly shaped, among the darkest moons known' },
        { name: 'Nereid', note: 'Highly eccentric orbit' },
      ],
    },
    rings: {
      present: true,
      text: 'Neptune has five known main rings and several faint dust bands. The rings are dark and contain clumps or arcs.',
    },
    exploration: [
      { year: '1846', name: 'Discovery', text: 'Johann Galle observed Neptune based on Urbain Le Verrier’s prediction.' },
      { year: '1989', name: 'Voyager 2', text: 'The only close encounter; revealed dark storms, rings and Triton’s geysers.' },
      { year: 'future', name: 'Neptune Odyssey', text: 'A proposed flagship mission concept to orbit Neptune and study Triton.' },
    ],
    source: NASA_FACT_SHEET_URL,
  },
];

export const PLANET_BY_ID = Object.fromEntries(PLANETS.map((planet) => [planet.id, planet]));

export const getPlanet = (id) => PLANET_BY_ID[id] ?? PLANETS[0];
