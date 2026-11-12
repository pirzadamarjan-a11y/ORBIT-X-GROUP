export const QUIZ_DIFFICULTIES = [
  {
    id: 'easy',
    label: 'Cadet',
    description: 'Solar system fundamentals and headline facts.',
    accent: '#5fe7ff',
    icon: '01',
  },
  {
    id: 'medium',
    label: 'Navigator',
    description: 'Planetary science, atmospheres and orbital mechanics.',
    accent: '#8f83ff',
    icon: '02',
  },
  {
    id: 'hard',
    label: 'Flight Director',
    description: 'Deep-space missions, moons and observational astronomy.',
    accent: '#ffc978',
    icon: '03',
  },
];

export const QUESTIONS = [
  {
    id: 'q01',
    difficulty: 'easy',
    question: 'Which planet is the largest in our solar system?',
    options: ['Mars', 'Jupiter', 'Saturn', 'Neptune'],
    answer: 1,
    explanation:
      'Jupiter is the largest planet, with a diameter of about 139,820 km—more than 11 times Earth’s diameter.',
  },
  {
    id: 'q02',
    difficulty: 'easy',
    question: 'Which planet is known as the Red Planet?',
    options: ['Earth', 'Venus', 'Mars', 'Mercury'],
    answer: 2,
    explanation:
      'Iron-oxide minerals in the dust and rocks give Mars its characteristic reddish color.',
  },
  {
    id: 'q03',
    difficulty: 'easy',
    question: 'What is Earth’s only natural satellite?',
    options: ['Titan', 'The Moon', 'Phobos', 'Europa'],
    answer: 1,
    explanation:
      'The Moon is Earth’s only natural satellite and the largest natural satellite relative to its planet’s size.',
  },
  {
    id: 'q04',
    difficulty: 'easy',
    question: 'Which planet orbits closest to the Sun?',
    options: ['Mercury', 'Venus', 'Earth', 'Mars'],
    answer: 0,
    explanation: 'Mercury completes an orbit at an average distance of about 57.9 million km from the Sun.',
  },
  {
    id: 'q05',
    difficulty: 'easy',
    question: 'Which planet is famous for its bright, prominent ring system?',
    options: ['Jupiter', 'Uranus', 'Saturn', 'Neptune'],
    answer: 2,
    explanation:
      'Saturn’s rings are made mostly of water ice and are the most prominent in the solar system, though the other giant planets also have faint rings.',
  },
  {
    id: 'q06',
    difficulty: 'easy',
    question: 'What object lies at the center of our solar system?',
    options: ['Earth', 'The Sun', 'Jupiter', 'The Milky Way’s black hole'],
    answer: 1,
    explanation:
      'The Sun contains more than 99.8% of the solar system’s mass and its gravity governs the orbits of the planets.',
  },
  {
    id: 'q07',
    difficulty: 'easy',
    question: 'Which planet rotates almost on its side?',
    options: ['Neptune', 'Uranus', 'Mars', 'Venus'],
    answer: 1,
    explanation:
      'Uranus has an axial tilt of about 98°, likely caused by a giant impact early in its history.',
  },
  {
    id: 'q08',
    difficulty: 'easy',
    question: 'Olympus Mons, the largest volcano in the solar system, is on which planet?',
    options: ['Venus', 'Mars', 'Mercury', 'Earth'],
    answer: 1,
    explanation:
      'Olympus Mons on Mars rises about 21.9 km above surrounding plains—roughly two and a half times the height of Mount Everest.',
  },
  {
    id: 'q09',
    difficulty: 'easy',
    question: 'Which galaxy contains the solar system?',
    options: ['Andromeda', 'The Milky Way', 'Triangulum', 'Whirlpool'],
    answer: 1,
    explanation:
      'The solar system lies within the Milky Way, a barred spiral galaxy roughly 100,000 light-years across.',
  },
  {
    id: 'q10',
    difficulty: 'easy',
    question: 'Which force keeps the planets in orbit around the Sun?',
    options: ['Magnetism', 'Gravity', 'Friction', 'Air pressure'],
    answer: 1,
    explanation:
      'Gravity attracts the planets toward the Sun, while their orbital velocity keeps them moving around it in curved paths.',
  },
  {
    id: 'q11',
    difficulty: 'medium',
    question: 'Which planet has the hottest average surface temperature?',
    options: ['Mercury', 'Venus', 'Mars', 'Jupiter'],
    answer: 1,
    explanation:
      'Venus is hotter than Mercury because its dense carbon-dioxide atmosphere creates a powerful greenhouse effect, keeping the surface around 464°C.',
  },
  {
    id: 'q12',
    difficulty: 'medium',
    question: 'Which planet is farthest from the Sun?',
    options: ['Neptune', 'Uranus', 'Saturn', 'Pluto'],
    answer: 0,
    explanation:
      'Neptune is the eighth planet and the farthest of the eight planets from the Sun. Pluto is classified as a dwarf planet.',
  },
  {
    id: 'q13',
    difficulty: 'medium',
    question: 'What is Jupiter’s Great Red Spot?',
    options: [
      'An impact crater on Mercury',
      'A long-lived storm on Jupiter',
      'A volcano on Mars',
      'An ocean on Europa',
    ],
    answer: 1,
    explanation:
      'The Great Red Spot is a giant anticyclonic storm in Jupiter’s atmosphere. It is wider than Earth and has been observed for centuries.',
  },
  {
    id: 'q14',
    difficulty: 'medium',
    question: 'Where is the main asteroid belt?',
    options: [
      'Between Earth and Mars',
      'Between Mars and Jupiter',
      'Beyond Neptune',
      'Inside Mercury’s orbit',
    ],
    answer: 1,
    explanation:
      'The main asteroid belt lies between the orbits of Mars and Jupiter. It contains rocky and metallic bodies left over from the early solar system.',
  },
  {
    id: 'q15',
    difficulty: 'medium',
    question: 'What is the Sun’s primary source of energy?',
    options: ['Nuclear fission', 'Chemical burning', 'Nuclear fusion', 'Gravitational collapse'],
    answer: 2,
    explanation:
      'The Sun fuses hydrogen nuclei into helium in its core. The energy released travels outward and reaches Earth as sunlight.',
  },
  {
    id: 'q16',
    difficulty: 'medium',
    question: 'About how long does sunlight take to travel from the Sun to Earth?',
    options: ['8 seconds', '8 minutes', '8 hours', '8 days'],
    answer: 1,
    explanation:
      'Light travels 1 AU in about 8 minutes and 20 seconds, so sunlight is always a little over eight minutes old when it reaches Earth.',
  },
  {
    id: 'q17',
    difficulty: 'medium',
    question: 'Which gas makes up most of the Martian atmosphere?',
    options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Methane'],
    answer: 1,
    explanation:
      'Mars’s thin atmosphere is about 95% carbon dioxide. Its surface pressure is less than 1% of Earth’s.',
  },
  {
    id: 'q18',
    difficulty: 'medium',
    question: 'What causes the phases of the Moon?',
    options: [
      'Earth’s shadow covering the Moon',
      'The Moon produces its own changing light',
      'The changing angle between Earth, the Moon and the Sun',
      'Clouds in Earth’s atmosphere',
    ],
    answer: 2,
    explanation:
      'We see different portions of the Moon’s sunlit half as it orbits Earth. Phases are caused by geometry, not Earth’s shadow.',
  },
  {
    id: 'q19',
    difficulty: 'medium',
    question: 'How long is one year on Mercury?',
    options: ['88 Earth days', '365 Earth days', '687 Earth days', '12 Earth years'],
    answer: 0,
    explanation:
      'Mercury completes one orbit around the Sun in about 88 Earth days. Its day, however, is even longer.',
  },
  {
    id: 'q20',
    difficulty: 'medium',
    question: 'On which planet is a day longer than its year?',
    options: ['Venus', 'Mars', 'Saturn', 'Mercury'],
    answer: 0,
    explanation:
      'Venus rotates on its axis about once every 243 Earth days, while it orbits the Sun in about 225 Earth days.',
  },
  {
    id: 'q21',
    difficulty: 'hard',
    question: 'Which is Saturn’s largest moon?',
    options: ['Titan', 'Enceladus', 'Mimas', 'Iapetus'],
    answer: 0,
    explanation:
      'Titan is larger than Mercury and has a thick nitrogen atmosphere with lakes and rivers of liquid hydrocarbons.',
  },
  {
    id: 'q22',
    difficulty: 'hard',
    question: 'Which Jovian moon is a prime target in the search for a subsurface ocean?',
    options: ['Io', 'Europa', 'Ganymede', 'Callisto'],
    answer: 1,
    explanation:
      'Europa’s icy shell likely covers a global salt-water ocean. NASA’s Europa Clipper mission is designed to study its habitability.',
  },
  {
    id: 'q23',
    difficulty: 'hard',
    question: 'Triton, a large icy moon with nitrogen geysers, orbits which planet?',
    options: ['Saturn', 'Uranus', 'Neptune', 'Jupiter'],
    answer: 2,
    explanation:
      'Triton orbits Neptune in a retrograde direction, suggesting it was captured from the Kuiper Belt.',
  },
  {
    id: 'q24',
    difficulty: 'hard',
    question: 'What is the Kuiper Belt?',
    options: [
      'A belt of asteroids between Mars and Jupiter',
      'A region of icy bodies beyond Neptune',
      'A cloud of gas inside the Sun',
      'The ring system of Saturn',
    ],
    answer: 1,
    explanation:
      'The Kuiper Belt is a broad region of icy small bodies beyond Neptune. Pluto, Arrokoth and many dwarf planets are Kuiper Belt objects.',
  },
  {
    id: 'q25',
    difficulty: 'hard',
    question: 'What is an exoplanet?',
    options: [
      'A planet orbiting another star',
      'A moon outside the solar system',
      'A dwarf planet with rings',
      'An asteroid that enters Earth’s atmosphere',
    ],
    answer: 0,
    explanation:
      'Exoplanets are planets that orbit stars other than the Sun. Thousands have been confirmed using transit and other detection methods.',
  },
  {
    id: 'q26',
    difficulty: 'hard',
    question: 'What region is Voyager 1 currently exploring?',
    options: ['Low Earth orbit', 'Interstellar space', 'A high Martian orbit', 'Inside the Sun’s corona'],
    answer: 1,
    explanation:
      'Voyager 1 crossed the heliopause in 2012 and is now in interstellar space, making measurements of particles and magnetic fields beyond the solar wind.',
  },
  {
    id: 'q27',
    difficulty: 'hard',
    question: 'What is a black hole’s event horizon?',
    options: [
      'The boundary beyond which nothing can return',
      'The surface of a neutron star',
      'The edge of the Milky Way',
      'The first image ever captured by a telescope',
    ],
    answer: 0,
    explanation:
      'The event horizon is the boundary around a black hole where escape velocity exceeds the speed of light. It is not a solid surface.',
  },
  {
    id: 'q28',
    difficulty: 'hard',
    question: 'What kind of light is the James Webb Space Telescope designed primarily to observe?',
    options: ['Visible light only', 'Infrared light', 'Radio waves', 'X-rays'],
    answer: 1,
    explanation:
      'Webb observes infrared light, which can pass through cosmic dust and reveals distant, cool and early-universe objects.',
  },
  {
    id: 'q29',
    difficulty: 'hard',
    question: 'Why does Uranus appear blue-green?',
    options: [
      'Methane in its atmosphere absorbs red light',
      'It is covered by liquid water',
      'Its clouds are made of copper',
      'It reflects only Earth’s light',
    ],
    answer: 0,
    explanation:
      'Methane absorbs red wavelengths while blue-green light is scattered and reflected, giving Uranus its cyan tint.',
  },
  {
    id: 'q30',
    difficulty: 'hard',
    question: 'Which statement about Neptune’s winds is correct?',
    options: [
      'They are the slowest in the solar system',
      'They are among the fastest measured in the solar system',
      'They only occur at the planet’s poles',
      'Neptune has no atmosphere to produce winds',
    ],
    answer: 1,
    explanation:
      'Neptune’s winds can reach about 2,100 km/h, among the fastest measured in the solar system.',
  },
];

export const QUESTIONS_BY_DIFFICULTY = QUIZ_DIFFICULTIES.reduce((acc, difficulty) => {
  acc[difficulty.id] = QUESTIONS.filter((question) => question.difficulty === difficulty.id);
  return acc;
}, {});

export const QUESTIONS_PER_ROUND = 8;
