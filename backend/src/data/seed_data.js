/**
 * Guitar Mastery System - Seed Data
 * 70-80년대 클래식 록 중심 초기 데이터
 */

const seedSongs = [
  // Led Zeppelin
  {
    title: 'Stairway to Heaven',
    artist: 'Led Zeppelin',
    guitarist: 'Jimmy Page',
    year: 1971,
    genre: 'Classic Rock',
    subgenre: 'Progressive Rock',
    difficulty: '고급',
    youtubeUrl: 'https://www.youtube.com/watch?v=QkF3oxziCNI',
    duration: 482,
    tempo: 72,
    key: 'Am',
    tuning: 'Standard',
    techniques: ['Fingerpicking', 'Arpeggios', 'Bending', 'Hammer-on', 'Pull-off', 'Solo'],
    scales: ['A Natural Minor', 'A Minor Pentatonic', 'A Dorian'],
    chordProgressions: ['Am-G#°-C/G-D/F#-Fmaj7-G-Am'],
    signature: '4/4',
    tags: ['masterpiece', 'must-learn', 'iconic-solo', 'fingerstyle-intro']
  },
  {
    title: 'Whole Lotta Love',
    artist: 'Led Zeppelin',
    guitarist: 'Jimmy Page',
    year: 1969,
    genre: 'Hard Rock',
    subgenre: 'Blues Rock',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=HQmmM_qwG4k',
    duration: 334,
    tempo: 87,
    key: 'E',
    tuning: 'Standard',
    techniques: ['Riff', 'Bending', 'Vibrato', 'Palm Muting'],
    scales: ['E Blues', 'E Minor Pentatonic'],
    tags: ['classic-riff', 'heavy', 'blues-rock']
  },
  {
    title: 'Black Dog',
    artist: 'Led Zeppelin',
    guitarist: 'Jimmy Page',
    year: 1971,
    genre: 'Hard Rock',
    difficulty: '고급',
    youtubeUrl: 'https://www.youtube.com/watch?v=yBuub4Xe1mw',
    duration: 296,
    tempo: 136,
    key: 'A',
    tuning: 'Standard',
    techniques: ['Complex Rhythm', 'Syncopation', 'Riff'],
    scales: ['A Blues', 'A Mixolydian'],
    tags: ['complex-timing', 'signature-riff']
  },

  // Pink Floyd
  {
    title: 'Comfortably Numb',
    artist: 'Pink Floyd',
    guitarist: 'David Gilmour',
    year: 1979,
    genre: 'Progressive Rock',
    difficulty: '고급',
    youtubeUrl: 'https://www.youtube.com/watch?v=x-xTttimcNk',
    duration: 382,
    tempo: 63,
    key: 'Bm',
    tuning: 'Standard',
    techniques: ['Bending', 'Vibrato', 'Sustain', 'Phrasing', 'Solo'],
    scales: ['B Minor Pentatonic', 'B Natural Minor', 'B Dorian'],
    chordProgressions: ['Bm-A-G-Em-Bm'],
    tags: ['epic-solo', 'emotional', 'must-learn', 'gilmour-tone']
  },
  {
    title: 'Shine On You Crazy Diamond',
    artist: 'Pink Floyd',
    guitarist: 'David Gilmour',
    year: 1975,
    genre: 'Progressive Rock',
    difficulty: '고급',
    youtubeUrl: 'https://www.youtube.com/watch?v=cWGE9Gi0bB0',
    duration: 811,
    tempo: 66,
    key: 'Gm',
    tuning: 'Standard',
    techniques: ['Sustained Notes', 'Bending', 'Slide', 'Volume Swells'],
    scales: ['G Minor Pentatonic', 'G Dorian', 'G Blues'],
    tags: ['atmospheric', 'progressive', 'long-form']
  },
  {
    title: 'Wish You Were Here',
    artist: 'Pink Floyd',
    guitarist: 'David Gilmour',
    year: 1975,
    genre: 'Progressive Rock',
    difficulty: '초급',
    youtubeUrl: 'https://www.youtube.com/watch?v=IXdNnw99-Ic',
    duration: 334,
    tempo: 60,
    key: 'G',
    tuning: 'Standard',
    techniques: ['Strumming', 'Fingerpicking', 'Acoustic'],
    scales: ['G Major'],
    chordProgressions: ['Em-G-Em-G-Em-A-Em-A-G'],
    tags: ['acoustic', 'beginner-friendly', 'campfire-song']
  },

  // Eagles
  {
    title: 'Hotel California',
    artist: 'Eagles',
    guitarist: 'Don Felder, Joe Walsh',
    year: 1976,
    genre: 'Classic Rock',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=BciS5krYL80',
    duration: 391,
    tempo: 75,
    key: 'Bm',
    tuning: 'Standard',
    techniques: ['Arpeggios', 'Harmony', 'Dual Guitar', 'Solo'],
    scales: ['B Natural Minor', 'B Harmonic Minor'],
    chordProgressions: ['Bm-F#-A-E-G-D-Em-F#'],
    tags: ['iconic-intro', 'dual-guitar', 'harmony-solo', 'must-learn']
  },
  {
    title: 'Life in the Fast Lane',
    artist: 'Eagles',
    guitarist: 'Joe Walsh',
    year: 1976,
    genre: 'Rock',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=4tcXblWojdM',
    duration: 286,
    tempo: 108,
    key: 'E',
    tuning: 'Standard',
    techniques: ['Slide', 'Riff', 'Blues Licks'],
    scales: ['E Blues', 'E Mixolydian'],
    tags: ['slide-guitar', 'joe-walsh', 'blues-rock']
  },

  // Queen
  {
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    guitarist: 'Brian May',
    year: 1975,
    genre: 'Progressive Rock',
    difficulty: '고급',
    youtubeUrl: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
    duration: 354,
    tempo: 72,
    key: 'Bb',
    tuning: 'Standard',
    techniques: ['Orchestration', 'Harmony', 'Solo', 'Classical Influence'],
    scales: ['Bb Major', 'Eb Major', 'F Major'],
    tags: ['epic', 'operatic', 'complex-arrangement']
  },
  {
    title: 'Killer Queen',
    artist: 'Queen',
    guitarist: 'Brian May',
    year: 1974,
    genre: 'Glam Rock',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=2ZBtPf7FOoM',
    duration: 180,
    tempo: 102,
    key: 'F',
    tuning: 'Standard',
    techniques: ['Jazz Chords', 'Vibrato', 'Harmonics'],
    scales: ['F Major', 'C Major'],
    tags: ['jazzy', 'sophisticated', 'brian-may']
  },

  // Deep Purple
  {
    title: 'Smoke on the Water',
    artist: 'Deep Purple',
    guitarist: 'Ritchie Blackmore',
    year: 1972,
    genre: 'Hard Rock',
    difficulty: '초급',
    youtubeUrl: 'https://www.youtube.com/watch?v=zUwEIt9ez7M',
    duration: 340,
    tempo: 116,
    key: 'Gm',
    tuning: 'Standard',
    techniques: ['Power Chords', 'Riff', 'Blues Scale'],
    scales: ['G Blues', 'G Minor Pentatonic'],
    tags: ['iconic-riff', 'beginner-essential', 'must-know']
  },
  {
    title: 'Highway Star',
    artist: 'Deep Purple',
    guitarist: 'Ritchie Blackmore',
    year: 1972,
    genre: 'Hard Rock',
    difficulty: '고급',
    youtubeUrl: 'https://www.youtube.com/watch?v=Wr9ie2J2690',
    duration: 368,
    tempo: 170,
    key: 'G',
    tuning: 'Standard',
    techniques: ['Fast Alternate Picking', 'Neoclassical', 'Sweep Picking'],
    scales: ['G Harmonic Minor', 'G Mixolydian', 'A Harmonic Minor'],
    tags: ['speed', 'neoclassical', 'virtuoso']
  },

  // AC/DC
  {
    title: 'Back in Black',
    artist: 'AC/DC',
    guitarist: 'Angus Young',
    year: 1980,
    genre: 'Hard Rock',
    difficulty: '초급',
    youtubeUrl: 'https://www.youtube.com/watch?v=pAgnJDJN4VA',
    duration: 255,
    tempo: 91,
    key: 'E',
    tuning: 'Standard',
    techniques: ['Power Chords', 'Palm Muting', 'Riff'],
    scales: ['E Minor Pentatonic'],
    tags: ['classic-riff', 'rhythm-guitar', 'angus-young']
  },
  {
    title: 'Thunderstruck',
    artist: 'AC/DC',
    guitarist: 'Angus Young',
    year: 1990,
    genre: 'Hard Rock',
    difficulty: '중급',
    youtubeUrl: 'https://www.youtube.com/watch?v=v2AC41dglnM',
    duration: 292,
    tempo: 133,
    key: 'B',
    tuning: 'Standard',
    techniques: ['Pull-offs', 'Hammer-ons', 'Fast Picking'],
    scales: ['B Minor Pentatonic', 'B Blues'],
    tags: ['iconic-intro', 'technical', 'crowd-pleaser']
  },

  // Black Sabbath
  {
    title: 'Iron Man',
    artist: 'Black Sabbath',
    guitarist: 'Tony Iommi',
    year: 1970,
    genre: 'Heavy Metal',
    difficulty: '초급',
    youtubeUrl: 'https://www.youtube.com/watch?v=8aQRq9hhekA',
    duration: 335,
    tempo: 76,
    key: 'E',
    tuning: 'Standard',
    techniques: ['Heavy Riff', 'Power Chords', 'Bending'],
    scales: ['E Minor Pentatonic', 'E Blues'],
    tags: ['metal-classic', 'doom', 'heavy']
  },
  {
    title: 'Paranoid',
    artist: 'Black Sabbath',
    guitarist: 'Tony Iommi',
    year: 1970,
    genre: 'Heavy Metal',
    difficulty: '초급',
    youtubeUrl: 'https://www.youtube.com/watch?v=0qanF-91aJo',
    duration: 172,
    tempo: 163,
    key: 'Em',
    tuning: 'Standard',
    techniques: ['Power Chords', 'Fast Rhythm', 'Palm Muting'],
    scales: ['E Minor Pentatonic'],
    tags: ['speed-metal', 'classic', 'simple-effective']
  }
];

const seedPracticeModules = [
  // Warmup Modules
  {
    name: '기본 손풀기 - 크로매틱 운동',
    category: 'warmup',
    subcategory: 'chromatic',
    difficulty: '초급',
    duration: 10,
    description: '1-2-3-4 크로매틱 패턴으로 손가락 독립성 향상',
    goals: ['손가락 독립성', '정확한 프레팅', '좌우손 협응'],
    exercises: [
      '1-2-3-4 ascending pattern',
      '4-3-2-1 descending pattern',
      'Skip patterns: 1-3-2-4',
      'All 6 strings coverage'
    ],
    tempo: 60,
    techniques: ['Finger Independence', 'Coordination']
  },
  {
    name: 'Spider Exercise 변형',
    category: 'warmup',
    subcategory: 'advanced',
    difficulty: '중급',
    duration: 15,
    description: '손가락 스트레칭과 독립성을 위한 스파이더 운동',
    goals: ['손가락 확장', '독립성', '근력 강화'],
    exercises: [
      '1-2-3-4 diagonal movement',
      'Cross-string patterns',
      'Wide stretches'
    ],
    tempo: 80,
    techniques: ['Stretching', 'Independence']
  },

  // Scale Modules
  {
    name: 'Minor Pentatonic - 5 Positions',
    category: 'scale',
    subcategory: 'pentatonic',
    difficulty: '초급',
    duration: 20,
    description: 'Am Pentatonic 5개 포지션 완벽 마스터',
    goals: ['프렛보드 시각화', '포지션 연결', '즉흥 연주 기초'],
    exercises: [
      'Position 1 (5th fret)',
      'Position 2 (8th fret)',
      'Position 3 (10th fret)',
      'Position 4 (12th fret)',
      'Position 5 (15th fret)',
      'Connecting positions'
    ],
    key: 'Am',
    scale: 'Minor Pentatonic',
    tempo: 100
  },
  {
    name: 'Mixolydian Mode 완전정복',
    category: 'scale',
    subcategory: 'modal',
    difficulty: '중급',
    duration: 25,
    description: 'Rock과 Blues에 필수적인 믹솔리디안 모드',
    goals: ['모달 이해', '프레이징', 'Dominant 7th 활용'],
    exercises: [
      'G Mixolydian patterns',
      '3-notes-per-string',
      'Modal sequences',
      'Chord tone targeting'
    ],
    key: 'G',
    scale: 'Mixolydian',
    tempo: 120,
    techniques: ['Modal Playing', 'Phrasing']
  },
  {
    name: 'Harmonic Minor 네오클래시컬',
    category: 'scale',
    subcategory: 'exotic',
    difficulty: '고급',
    duration: 30,
    description: 'Yngwie Malmsteen 스타일 하모닉 마이너',
    goals: ['네오클래시컬 테크닉', '고속 주법', '이국적 사운드'],
    exercises: [
      'A Harmonic Minor positions',
      'Pedal point licks',
      'Diminished arpeggios',
      'Classical sequences'
    ],
    key: 'A',
    scale: 'Harmonic Minor',
    tempo: 140,
    techniques: ['Sweep Picking', 'Alternate Picking', 'Legato']
  },

  // Technique Modules
  {
    name: 'Bending 마스터 클래스',
    category: 'technique',
    subcategory: 'expression',
    difficulty: '중급',
    duration: 20,
    description: 'David Gilmour, BB King 스타일 벤딩',
    goals: ['정확한 음정', '표현력', '비브라토 결합'],
    exercises: [
      'Half-step bends',
      'Whole-step bends',
      'Bend and release',
      'Pre-bends',
      'Double-stop bends',
      'Vibrato on bent notes'
    ],
    techniques: ['Bending', 'Vibrato', 'Intonation']
  },
  {
    name: 'Legato 테크닉 집중훈련',
    category: 'technique',
    subcategory: 'legato',
    difficulty: '중급',
    duration: 25,
    description: 'Hammer-on과 Pull-off 완벽 마스터',
    goals: ['부드러운 연주', '속도 향상', '음량 균일성'],
    exercises: [
      'Basic hammer-on/pull-off',
      'Triplet patterns',
      'Cross-string legato',
      'Legato runs'
    ],
    tempo: 100,
    techniques: ['Hammer-on', 'Pull-off', 'Legato']
  },
  {
    name: 'Sweep Picking 입문',
    category: 'technique',
    subcategory: 'advanced',
    difficulty: '고급',
    duration: 30,
    description: '3현, 5현 스윕 아르페지오',
    goals: ['스윕 피킹 기초', '정확한 동작', '뮤팅'],
    exercises: [
      'Minor triad sweeps',
      'Major triad sweeps',
      '5-string patterns',
      'Economy picking transitions'
    ],
    tempo: 80,
    techniques: ['Sweep Picking', 'Arpeggios', 'Muting']
  },

  // Phrase Modules
  {
    name: 'Classic Rock Licks - Page & Clapton',
    category: 'phrase',
    subcategory: 'rock',
    difficulty: '중급',
    duration: 30,
    description: 'Jimmy Page와 Eric Clapton의 시그니처 릭',
    goals: ['클래식 록 스타일', '프레이징', '톤 메이킹'],
    exercises: [
      'Page pentatonic runs',
      'Clapton blues box',
      'Classic turnarounds',
      'Signature endings'
    ],
    key: 'A',
    techniques: ['Bending', 'Vibrato', 'Phrasing']
  },
  {
    name: 'Blues Masters - BB & Albert King',
    category: 'phrase',
    subcategory: 'blues',
    difficulty: '중급',
    duration: 25,
    description: 'BB King과 Albert King의 블루스 프레이즈',
    goals: ['블루스 표현', '콜 앤 리스폰스', '감정 전달'],
    exercises: [
      'BB box patterns',
      'Albert King bends',
      'Blues turnarounds',
      'Call and response phrases'
    ],
    key: 'Bb',
    techniques: ['Blues Phrasing', 'String Bending', 'Vibrato']
  },
  {
    name: '70년대 하드록 리프 모음',
    category: 'phrase',
    subcategory: 'riff',
    difficulty: '중급',
    duration: 35,
    description: 'Led Zeppelin, Deep Purple, AC/DC 리프',
    goals: ['리프 마스터', '리듬 감각', '파워 코드'],
    exercises: [
      'Whole Lotta Love riff',
      'Smoke on the Water',
      'Back in Black',
      'Black Dog rhythm'
    ],
    techniques: ['Riffing', 'Power Chords', 'Palm Muting']
  },

  // Chord Modules
  {
    name: 'CAGED System 완벽 이해',
    category: 'chord',
    subcategory: 'system',
    difficulty: '초급',
    duration: 40,
    description: '프렛보드 전체를 이해하는 CAGED 시스템',
    goals: ['코드 폼 연결', '프렛보드 마스터', '코드 전환'],
    exercises: [
      'C form positions',
      'A form positions',
      'G form positions',
      'E form positions',
      'D form positions',
      'Connecting forms'
    ],
    techniques: ['Chord Forms', 'Fretboard Knowledge']
  },
  {
    name: 'Jazz Chord Voicings',
    category: 'chord',
    subcategory: 'jazz',
    difficulty: '고급',
    duration: 45,
    description: '재즈 기타 코드 보이싱과 컴핑',
    goals: ['재즈 화성', '보이스 리딩', '컴핑 리듬'],
    exercises: [
      'Drop 2 voicings',
      'Drop 3 voicings',
      'Shell voicings',
      'ii-V-I progressions',
      'Rhythm patterns'
    ],
    techniques: ['Jazz Chords', 'Voice Leading', 'Comping']
  },

  // Theory Modules
  {
    name: '모드(Mode) 이론과 실전',
    category: 'theory',
    subcategory: 'modal',
    difficulty: '중급',
    duration: 50,
    description: '7가지 모드의 이론과 실제 활용',
    goals: ['모달 이론', '특성음 이해', '실전 적용'],
    exercises: [
      'Ionian characteristics',
      'Dorian applications',
      'Phrygian flavor',
      'Lydian brightness',
      'Mixolydian rock/blues',
      'Aeolian (natural minor)',
      'Locrian usage'
    ],
    techniques: ['Modal Theory', 'Application']
  },
  {
    name: '코드 진행 분석',
    category: 'theory',
    subcategory: 'harmony',
    difficulty: '중급',
    duration: 40,
    description: '유명곡의 코드 진행 분석과 이해',
    goals: ['화성 분석', '진행 패턴', '작곡 응용'],
    exercises: [
      'I-IV-V progressions',
      'ii-V-I in major and minor',
      'Circle of fifths',
      'Modal interchange',
      'Secondary dominants'
    ],
    techniques: ['Harmony Analysis', 'Chord Functions']
  },

  // Improvisation Modules
  {
    name: 'Blues 즉흥연주 기초',
    category: 'improvisation',
    subcategory: 'blues',
    difficulty: '중급',
    duration: 45,
    description: '12마디 블루스 위에서 즉흥연주',
    goals: ['블루스 즉흥', '콜 앤 리스폰스', '프레이징'],
    exercises: [
      'Blues scale application',
      'Chord tone targeting',
      'Question and answer',
      'Building solos',
      'Dynamics and space'
    ],
    key: 'A',
    techniques: ['Improvisation', 'Blues', 'Phrasing']
  },
  {
    name: 'Modal Jam - Dorian과 Mixolydian',
    category: 'improvisation',
    subcategory: 'modal',
    difficulty: '고급',
    duration: 50,
    description: 'Santana와 Grateful Dead 스타일 모달 잼',
    goals: ['모달 즉흥', '장시간 솔로', '테마 개발'],
    exercises: [
      'Dorian vamps',
      'Mixolydian grooves',
      'Modal interplay',
      'Building intensity',
      'Thematic development'
    ],
    techniques: ['Modal Improvisation', 'Extended Soloing']
  }
];

const seedArtists = [
  {
    name: 'Jimmy Page',
    realName: 'James Patrick Page',
    birthYear: 1944,
    country: 'England',
    genres: ['Rock', 'Hard Rock', 'Blues Rock', 'Folk Rock'],
    bands: ['Led Zeppelin', 'The Yardbirds', 'The Firm'],
    style: 'Blues 기반의 혁신적인 리프와 오케스트레이션, 다양한 기타 사용과 스튜디오 테크닉의 대가',
    signatureGear: ['Gibson Les Paul', 'Gibson EDS-1275', 'Fender Telecaster', 'Marshall Amps'],
    influences: ['Scotty Moore', 'James Burton', 'B.B. King', 'Otis Rush'],
    signatureSongs: ['Stairway to Heaven', 'Whole Lotta Love', 'Kashmir', 'Black Dog'],
    techniques: ['Alternate Tunings', 'Bow Playing', 'Theremin', 'Studio Production'],
    era: '1970s'
  },
  {
    name: 'David Gilmour',
    realName: 'David Jon Gilmour',
    birthYear: 1946,
    country: 'England',
    genres: ['Progressive Rock', 'Psychedelic Rock', 'Blues'],
    bands: ['Pink Floyd'],
    style: '감정적이고 멜로디컬한 솔로, 완벽한 벤딩과 비브라토, 공간감 있는 프레이징',
    signatureGear: ['Fender Stratocaster (Black Strat)', 'Hiwatt Amps', 'Big Muff', 'Univibe'],
    influences: ['Hank Marvin', 'Pete Seeger', 'Leadbelly', 'B.B. King'],
    signatureSongs: ['Comfortably Numb', 'Shine On You Crazy Diamond', 'Time', 'Money'],
    techniques: ['Bending', 'Sustain', 'Volume Swells', 'Slide Guitar'],
    era: '1970s'
  },
  {
    name: 'Ritchie Blackmore',
    realName: 'Richard Hugh Blackmore',
    birthYear: 1945,
    country: 'England',
    genres: ['Hard Rock', 'Heavy Metal', 'Neo-Classical'],
    bands: ['Deep Purple', 'Rainbow', "Blackmore's Night"],
    style: '클래시컬 영향을 받은 네오클래시컬 록의 선구자, 빠른 스케일 런과 하모닉 마이너 사용',
    signatureGear: ['Fender Stratocaster', 'Marshall Major Amps', 'ENGL Amps'],
    influences: ['Bach', 'Beethoven', 'Django Reinhardt', 'Scotty Moore'],
    signatureSongs: ['Smoke on the Water', 'Highway Star', 'Burn', "Stargazer"],
    techniques: ['Neo-Classical Runs', 'Harmonic Minor', 'Fast Picking', 'Classical Phrasing'],
    era: '1970s'
  },
  {
    name: 'Tony Iommi',
    realName: 'Anthony Frank Iommi',
    birthYear: 1948,
    country: 'England',
    genres: ['Heavy Metal', 'Doom Metal', 'Hard Rock'],
    bands: ['Black Sabbath', 'Heaven & Hell'],
    style: '헤비메탈의 창시자, 다운튜닝과 무거운 리프, 손가락 사고 후 독특한 주법 개발',
    signatureGear: ['Gibson SG', 'Laney Amps', 'Custom Light Gauge Strings'],
    influences: ['Django Reinhardt', 'Joe Pass', 'John Mayall'],
    signatureSongs: ['Iron Man', 'Paranoid', 'War Pigs', 'Sweet Leaf'],
    techniques: ['Down Tuning', 'Heavy Riffs', 'Power Chords', 'Dark Atmospheres'],
    era: '1970s'
  },
  {
    name: 'Brian May',
    realName: 'Brian Harold May',
    birthYear: 1947,
    country: 'England',
    genres: ['Rock', 'Progressive Rock', 'Glam Rock'],
    bands: ['Queen'],
    style: '오케스트라 같은 기타 하모니, 홈메이드 기타 Red Special, 동전 피크 사용',
    signatureGear: ['Red Special (Homemade)', 'Vox AC30', 'Sixpence Coin Pick'],
    influences: ['Hank Marvin', 'Jeff Beck', 'Jimi Hendrix', 'Rory Gallagher'],
    signatureSongs: ['Bohemian Rhapsody', 'We Will Rock You', 'Brighton Rock', 'Killer Queen'],
    techniques: ['Guitar Orchestration', 'Harmonies', 'Delay Effects', 'Coin Picking'],
    era: '1970s'
  },
  {
    name: 'Eric Clapton',
    realName: 'Eric Patrick Clapton',
    birthYear: 1945,
    country: 'England',
    genres: ['Blues', 'Blues Rock', 'Rock', 'Pop Rock'],
    bands: ['Cream', 'The Yardbirds', 'Derek and the Dominos', 'Blind Faith'],
    style: '블루스의 전설, "Woman Tone", 감정적인 벤딩과 비브라토',
    signatureGear: ['Fender Stratocaster (Blackie)', 'Gibson Les Paul', 'Marshall JTM45'],
    influences: ['B.B. King', 'Freddie King', 'Albert King', 'Robert Johnson'],
    signatureSongs: ['Layla', 'Crossroads', 'Wonderful Tonight', 'Tears in Heaven'],
    techniques: ['Blues Phrasing', 'Woman Tone', 'Finger Vibrato', 'Emotional Bending'],
    era: '1970s'
  },
  {
    name: 'Angus Young',
    realName: 'Angus McKinnon Young',
    birthYear: 1955,
    country: 'Scotland/Australia',
    genres: ['Hard Rock', 'Blues Rock', "Rock 'n' Roll"],
    bands: ['AC/DC'],
    style: '에너지 넘치는 무대 퍼포먼스, 단순하지만 강력한 리프, 블루스 기반 솔로',
    signatureGear: ['Gibson SG', 'Marshall Plexi', 'Marshall JCM800'],
    influences: ['Chuck Berry', 'Muddy Waters', 'B.B. King', 'Freddie King'],
    signatureSongs: ['Back in Black', 'Thunderstruck', 'Highway to Hell', 'You Shook Me All Night Long'],
    techniques: ['Power Chords', 'Blues Licks', 'Vibrato', 'Stage Performance'],
    era: '1970s-1980s'
  },
  {
    name: 'Joe Walsh',
    realName: 'Joseph Fidler Walsh',
    birthYear: 1947,
    country: 'USA',
    genres: ['Rock', 'Hard Rock', 'Country Rock'],
    bands: ['Eagles', 'James Gang', 'Barnstorm'],
    style: '독특한 톤과 프레이징, 슬라이드 기타, 유머러스한 접근',
    signatureGear: ['Gibson Les Paul', 'Fender Stratocaster', 'Talk Box'],
    influences: ['Jimmy Page', 'Jeff Beck', 'Pete Townshend'],
    signatureSongs: ['Hotel California (Solo)', 'Life in the Fast Lane', "Life's Been Good", 'Rocky Mountain Way'],
    techniques: ['Slide Guitar', 'Talk Box', 'Unique Phrasing', 'Blues Rock'],
    era: '1970s'
  }
];

const seedLearningPaths = [
  {
    name: '클래식 록 기타 입문',
    description: '70-80년대 클래식 록의 필수 테크닉과 곡들을 마스터하는 과정',
    level: '초급',
    category: 'Classic Rock',
    duration: 60,
    modules: ['chromatic-warmup', 'pentatonic-basics', 'power-chords', 'classic-riffs'],
    songs: ['Smoke on the Water', 'Back in Black', 'Iron Man', 'Wish You Were Here'],
    goals: [
      '기본 파워코드 마스터',
      '펜타토닉 스케일 5 포지션',
      '클래식 리프 10개 연주',
      '기본 벤딩과 비브라토'
    ]
  },
  {
    name: 'Led Zeppelin 완전정복',
    description: 'Jimmy Page의 모든 테크닉과 Led Zeppelin 대표곡 마스터',
    level: '고급',
    category: 'Artist Study',
    duration: 120,
    modules: ['page-techniques', 'alternate-tunings', 'acoustic-electric', 'studio-tricks'],
    songs: ['Stairway to Heaven', 'Whole Lotta Love', 'Black Dog', 'Kashmir', 'The Rain Song'],
    goals: [
      'Page 스타일 리프 마스터',
      '오픈 튜닝 활용',
      'Stairway to Heaven 완주',
      '스튜디오 이펙트 이해'
    ]
  },
  {
    name: 'Blues Rock 솔로잉 마스터',
    description: 'Clapton, Page, Gilmour 스타일의 블루스 록 솔로 테크닉',
    level: '중급',
    category: 'Blues Rock',
    duration: 90,
    modules: ['blues-scales', 'bending-masterclass', 'blues-phrasing', 'call-response'],
    songs: ['Comfortably Numb', 'Layla', 'Crossroads', 'Since I\'ve Been Loving You'],
    goals: [
      '완벽한 벤딩 인토네이션',
      '블루스 프레이징 마스터',
      'Call & Response 즉흥',
      '감정적 표현력 향상'
    ]
  },
  {
    name: 'Progressive Rock 기타 여정',
    description: 'Pink Floyd, Queen, Yes의 프로그레시브 록 마스터',
    level: '고급',
    category: 'Progressive Rock',
    duration: 150,
    modules: ['complex-timing', 'orchestration', 'effects-mastery', 'long-form-composition'],
    songs: ['Comfortably Numb', 'Bohemian Rhapsody', 'Shine On You Crazy Diamond', 'Time'],
    goals: [
      '복잡한 박자 이해',
      '기타 오케스트레이션',
      '이펙트 활용법',
      '긴 형식 구성력'
    ]
  },
  {
    name: '하드록 리듬 기타 부트캠프',
    description: 'AC/DC, Deep Purple 스타일의 타이트한 리듬 기타',
    level: '중급',
    category: 'Hard Rock',
    duration: 60,
    modules: ['power-chord-variations', 'palm-muting', 'rhythm-patterns', 'riff-writing'],
    songs: ['Back in Black', 'Highway to Hell', 'Smoke on the Water', 'Highway Star'],
    goals: [
      '타이트한 리듬 주법',
      '팜뮤팅 완벽 마스터',
      '리프 작곡 능력',
      '밴드 앙상블 이해'
    ]
  },
  {
    name: '네오클래시컬 속주 입문',
    description: 'Ritchie Blackmore와 Yngwie의 네오클래시컬 스타일',
    level: '고급',
    category: 'Neo-Classical',
    duration: 180,
    modules: ['harmonic-minor', 'sweep-picking', 'pedal-points', 'classical-sequences'],
    songs: ['Highway Star', 'Burn', 'Stargazer', 'Gates of Babylon'],
    goals: [
      '하모닉 마이너 마스터',
      '스윕 피킹 기초',
      '클래시컬 시퀀스',
      '고속 알터네이트 피킹'
    ]
  }
];

module.exports = {
  seedSongs,
  seedPracticeModules,
  seedArtists,
  seedLearningPaths
};