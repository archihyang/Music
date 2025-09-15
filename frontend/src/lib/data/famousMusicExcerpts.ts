// Famous Music Excerpts for Testing
// 유명 곡들의 악보 데이터 (테스트용)

export interface MusicExcerpt {
  id: string;
  title: string;
  composer: string;
  measures: any[]; // VexFlow notation data
  timeSignature: string;
  keySignature: string;
  tempo: number;
  description: string;
}

export const famousMusicExcerpts: MusicExcerpt[] = [
  {
    id: 'beethoven-ode-to-joy',
    title: 'Ode to Joy (환희의 송가)',
    composer: 'Ludwig van Beethoven',
    timeSignature: '4/4',
    keySignature: 'G',
    tempo: 120,
    description: '베토벤 교향곡 9번 4악장의 유명한 멜로디',
    measures: [
      {
        notes: [
          { keys: ['b/4'], duration: 'q' },
          { keys: ['b/4'], duration: 'q' },
          { keys: ['c/5'], duration: 'q' },
          { keys: ['d/5'], duration: 'q' }
        ]
      },
      {
        notes: [
          { keys: ['d/5'], duration: 'q' },
          { keys: ['c/5'], duration: 'q' },
          { keys: ['b/4'], duration: 'q' },
          { keys: ['a/4'], duration: 'q' }
        ]
      },
      {
        notes: [
          { keys: ['g/4'], duration: 'q' },
          { keys: ['g/4'], duration: 'q' },
          { keys: ['a/4'], duration: 'q' },
          { keys: ['b/4'], duration: 'q' }
        ]
      },
      {
        notes: [
          { keys: ['b/4'], duration: 'q.' },
          { keys: ['a/4'], duration: '8' },
          { keys: ['a/4'], duration: 'h' }
        ]
      }
    ]
  },
  
  {
    id: 'mozart-eine-kleine',
    title: 'Eine kleine Nachtmusik (아이네 클라이네)',
    composer: 'Wolfgang Amadeus Mozart',
    timeSignature: '4/4',
    keySignature: 'G',
    tempo: 140,
    description: '모차르트 세레나데 13번 1악장 시작 부분',
    measures: [
      {
        notes: [
          { keys: ['g/4'], duration: '8' },
          { keys: ['g/4'], duration: '8r' }, // 8분 쉼표
          { keys: ['d/4'], duration: '8' },
          { keys: ['g/4'], duration: '8r' },
          { keys: ['g/4'], duration: '8' },
          { keys: ['g/4'], duration: '8r' },
          { keys: ['d/4'], duration: '8' }
        ]
      },
      {
        notes: [
          { keys: ['g/4'], duration: 'q' },
          { keys: ['b/4'], duration: 'q' },
          { keys: ['d/5'], duration: 'q' },
          { keys: ['b/4'], duration: 'q' }
        ]
      },
      {
        notes: [
          { keys: ['g/5'], duration: 'h' },
          { keys: ['f#/5'], duration: 'q' },
          { keys: ['f#/5'], duration: 'q' }
        ]
      },
      {
        notes: [
          { keys: ['e/5'], duration: 'w' }
        ]
      }
    ]
  },
  
  {
    id: 'bach-minuet-g',
    title: 'Minuet in G (미뉴에트)',
    composer: 'Johann Sebastian Bach',
    timeSignature: '3/4',
    keySignature: 'G',
    tempo: 110,
    description: '바흐(페츨) 미뉴에트 G장조 시작 부분',
    measures: [
      {
        notes: [
          { keys: ['d/5'], duration: 'q' },
          { keys: ['g/4'], duration: '8' },
          { keys: ['a/4'], duration: '8' },
          { keys: ['b/4'], duration: '8' },
          { keys: ['c/5'], duration: '8' }
        ]
      },
      {
        notes: [
          { keys: ['d/5'], duration: 'q' },
          { keys: ['g/4'], duration: 'q' },
          { keys: ['g/4'], duration: 'q' }
        ]
      },
      {
        notes: [
          { keys: ['e/5'], duration: 'q' },
          { keys: ['c/5'], duration: '8' },
          { keys: ['d/5'], duration: '8' },
          { keys: ['e/5'], duration: '8' },
          { keys: ['f#/5'], duration: '8' }
        ]
      },
      {
        notes: [
          { keys: ['g/5'], duration: 'q' },
          { keys: ['g/4'], duration: 'q' },
          { keys: ['g/4'], duration: 'q' }
        ]
      }
    ]
  },
  
  {
    id: 'pachelbel-canon',
    title: 'Canon in D (캐논)',
    composer: 'Johann Pachelbel',
    timeSignature: '4/4',
    keySignature: 'D',
    tempo: 56,
    description: '파헬벨 캐논 주제 멜로디',
    measures: [
      {
        notes: [
          { keys: ['f#/5'], duration: 'h' },
          { keys: ['e/5'], duration: 'h' }
        ]
      },
      {
        notes: [
          { keys: ['d/5'], duration: 'h' },
          { keys: ['c#/5'], duration: 'h' }
        ]
      },
      {
        notes: [
          { keys: ['b/4'], duration: 'h' },
          { keys: ['a/4'], duration: 'h' }
        ]
      },
      {
        notes: [
          { keys: ['b/4'], duration: 'h' },
          { keys: ['c#/5'], duration: 'h' }
        ]
      }
    ]
  },
  
  {
    id: 'beatles-yesterday',
    title: 'Yesterday',
    composer: 'The Beatles (Paul McCartney)',
    timeSignature: '4/4',
    keySignature: 'F',
    tempo: 96,
    description: '비틀즈 Yesterday 도입부',
    measures: [
      {
        notes: [
          { keys: ['f/4'], duration: '8' },
          { keys: ['e/4'], duration: '8' },
          { keys: ['e/4'], duration: 'h' },
          { keys: ['e/4'], duration: 'q' }
        ]
      },
      {
        notes: [
          { keys: ['g/4'], duration: 'q' },
          { keys: ['a/4'], duration: '8' },
          { keys: ['b/4'], duration: '8' },
          { keys: ['c/5'], duration: '8' },
          { keys: ['d/5'], duration: '8' },
          { keys: ['e/5'], duration: '8' },
          { keys: ['c/5'], duration: '8' }
        ]
      },
      {
        notes: [
          { keys: ['d/5'], duration: 'q' },
          { keys: ['b/4'], duration: 'q' },
          { keys: ['b/4'], duration: 'h' }
        ]
      },
      {
        notes: [
          { keys: ['a/4'], duration: 'q' },
          { keys: ['g/4'], duration: 'q' },
          { keys: ['a/4'], duration: 'q' },
          { keys: ['b/4'], duration: 'q' }
        ]
      }
    ]
  },
  
  {
    id: 'led-zeppelin-stairway',
    title: 'Stairway to Heaven (Intro)',
    composer: 'Led Zeppelin (Jimmy Page)',
    timeSignature: '4/4',
    keySignature: 'Am',
    tempo: 72,
    description: '레드 제플린 Stairway to Heaven 어쿠스틱 인트로',
    measures: [
      {
        notes: [
          { keys: ['a/4'], duration: '8' },
          { keys: ['c/5'], duration: '8' },
          { keys: ['e/5'], duration: '8' },
          { keys: ['a/5'], duration: '8' },
          { keys: ['b/5'], duration: '8' },
          { keys: ['e/5'], duration: '8' },
          { keys: ['c/5'], duration: '8' },
          { keys: ['b/4'], duration: '8' }
        ]
      },
      {
        notes: [
          { keys: ['c/5'], duration: '8' },
          { keys: ['e/5'], duration: '8' },
          { keys: ['g/5'], duration: '8' },
          { keys: ['c/6'], duration: '8' },
          { keys: ['d/6'], duration: '8' },
          { keys: ['g/5'], duration: '8' },
          { keys: ['e/5'], duration: '8' },
          { keys: ['d/5'], duration: '8' }
        ]
      },
      {
        notes: [
          { keys: ['a/4'], duration: '8' },
          { keys: ['c/5'], duration: '8' },
          { keys: ['e/5'], duration: '8' },
          { keys: ['a/5'], duration: '8' },
          { keys: ['b/5'], duration: '8' },
          { keys: ['e/5'], duration: '8' },
          { keys: ['c/5'], duration: '8' },
          { keys: ['b/4'], duration: '8' }
        ]
      },
      {
        notes: [
          { keys: ['a/4'], duration: 'w' }
        ]
      }
    ]
  },
  
  {
    id: 'smoke-on-water',
    title: 'Smoke on the Water',
    composer: 'Deep Purple (Ritchie Blackmore)',
    timeSignature: '4/4',
    keySignature: 'Gm',
    tempo: 112,
    description: '딥 퍼플 Smoke on the Water 메인 리프',
    measures: [
      {
        notes: [
          { keys: ['g/4'], duration: 'q' },
          { keys: ['bb/4'], duration: 'q' },
          { keys: ['c/5'], duration: 'q' },
          { keys: ['g/4'], duration: 'q' }
        ]
      },
      {
        notes: [
          { keys: ['bb/4'], duration: 'q' },
          { keys: ['db/5'], duration: '8' },
          { keys: ['c/5'], duration: '8' },
          { keys: ['c/5'], duration: 'h' }
        ]
      },
      {
        notes: [
          { keys: ['g/4'], duration: 'q' },
          { keys: ['bb/4'], duration: 'q' },
          { keys: ['c/5'], duration: 'q' },
          { keys: ['bb/4'], duration: 'q' }
        ]
      },
      {
        notes: [
          { keys: ['g/4'], duration: 'w' }
        ]
      }
    ]
  },
  
  {
    id: 'hotel-california',
    title: 'Hotel California (Intro)',
    composer: 'Eagles (Don Felder)',
    timeSignature: '4/4',
    keySignature: 'Bm',
    tempo: 74,
    description: '이글스 Hotel California 어쿠스틱 인트로',
    measures: [
      {
        notes: [
          { keys: ['b/4'], duration: '16' },
          { keys: ['f#/5'], duration: '16' },
          { keys: ['b/5'], duration: '16' },
          { keys: ['f#/5'], duration: '16' },
          { keys: ['b/4'], duration: '16' },
          { keys: ['f#/5'], duration: '16' },
          { keys: ['b/5'], duration: '16' },
          { keys: ['f#/5'], duration: '16' },
          { keys: ['b/4'], duration: '16' },
          { keys: ['f#/5'], duration: '16' },
          { keys: ['b/5'], duration: '16' },
          { keys: ['f#/5'], duration: '16' },
          { keys: ['b/4'], duration: '16' },
          { keys: ['f#/5'], duration: '16' },
          { keys: ['b/5'], duration: '16' },
          { keys: ['f#/5'], duration: '16' }
        ]
      },
      {
        notes: [
          { keys: ['a/4'], duration: '16' },
          { keys: ['e/5'], duration: '16' },
          { keys: ['a/5'], duration: '16' },
          { keys: ['e/5'], duration: '16' },
          { keys: ['a/4'], duration: '16' },
          { keys: ['e/5'], duration: '16' },
          { keys: ['a/5'], duration: '16' },
          { keys: ['e/5'], duration: '16' },
          { keys: ['a/4'], duration: '16' },
          { keys: ['e/5'], duration: '16' },
          { keys: ['a/5'], duration: '16' },
          { keys: ['e/5'], duration: '16' },
          { keys: ['a/4'], duration: '16' },
          { keys: ['e/5'], duration: '16' },
          { keys: ['a/5'], duration: '16' },
          { keys: ['e/5'], duration: '16' }
        ]
      }
    ]
  },
  
  {
    id: 'blackbird',
    title: 'Blackbird',
    composer: 'The Beatles (Paul McCartney)',
    timeSignature: '4/4',
    keySignature: 'G',
    tempo: 94,
    description: '비틀즈 Blackbird 핑거스타일 인트로',
    measures: [
      {
        notes: [
          { keys: ['g/4'], duration: '8' },
          { keys: ['a/4'], duration: '8' },
          { keys: ['b/4'], duration: '8' },
          { keys: ['g/4'], duration: '8' },
          { keys: ['b/4'], duration: 'q' },
          { keys: ['a/4'], duration: 'q' }
        ]
      },
      {
        notes: [
          { keys: ['g/4'], duration: '8' },
          { keys: ['a/4'], duration: '8' },
          { keys: ['b/4'], duration: '8' },
          { keys: ['c/5'], duration: '8' },
          { keys: ['d/5'], duration: 'q' },
          { keys: ['c/5'], duration: 'q' }
        ]
      },
      {
        notes: [
          { keys: ['b/4'], duration: '8' },
          { keys: ['c/5'], duration: '8' },
          { keys: ['d/5'], duration: '8' },
          { keys: ['b/4'], duration: '8' },
          { keys: ['g/4'], duration: 'h' }
        ]
      },
      {
        notes: [
          { keys: ['a/4'], duration: 'q' },
          { keys: ['g/4'], duration: 'q' },
          { keys: ['f#/4'], duration: 'q' },
          { keys: ['e/4'], duration: 'q' }
        ]
      }
    ]
  },
  
  {
    id: 'tears-in-heaven',
    title: 'Tears in Heaven',
    composer: 'Eric Clapton',
    timeSignature: '4/4',
    keySignature: 'A',
    tempo: 80,
    description: '에릭 클랩튼 Tears in Heaven 메인 멜로디',
    measures: [
      {
        notes: [
          { keys: ['e/5'], duration: 'q.' },
          { keys: ['c#/5'], duration: '8' },
          { keys: ['a/4'], duration: 'q' },
          { keys: ['e/4'], duration: 'q' }
        ]
      },
      {
        notes: [
          { keys: ['f#/4'], duration: 'q' },
          { keys: ['g#/4'], duration: 'q' },
          { keys: ['a/4'], duration: 'h' }
        ]
      },
      {
        notes: [
          { keys: ['e/5'], duration: 'q.' },
          { keys: ['c#/5'], duration: '8' },
          { keys: ['a/4'], duration: 'q' },
          { keys: ['e/4'], duration: 'q' }
        ]
      },
      {
        notes: [
          { keys: ['f#/4'], duration: 'q' },
          { keys: ['e/4'], duration: 'q' },
          { keys: ['e/4'], duration: 'h' }
        ]
      }
    ]
  }
];

// 탭 악보 데이터 (기타 전용)
export interface GuitarTab {
  id: string;
  strings: number; // 6 for standard guitar
  tuning: string[]; // ['E', 'A', 'D', 'G', 'B', 'E']
  measures: TabMeasure[];
}

export interface TabMeasure {
  notes: TabNote[];
}

export interface TabNote {
  string: number; // 1-6 (high E to low E)
  fret: number; // 0-24
  duration: string; // 'w', 'h', 'q', '8', '16'
  technique?: 'hammer' | 'pull' | 'slide' | 'bend' | 'vibrato';
}

// 기타 탭 데이터 예시
export const guitarTabs: { [key: string]: GuitarTab } = {
  'smoke-on-water': {
    id: 'smoke-on-water-tab',
    strings: 6,
    tuning: ['E', 'A', 'D', 'G', 'B', 'E'],
    measures: [
      {
        notes: [
          { string: 4, fret: 0, duration: 'q' },
          { string: 4, fret: 3, duration: 'q' },
          { string: 4, fret: 5, duration: 'q' },
          { string: 4, fret: 0, duration: 'q' }
        ]
      },
      {
        notes: [
          { string: 4, fret: 3, duration: 'q' },
          { string: 4, fret: 6, duration: '8' },
          { string: 4, fret: 5, duration: '8' },
          { string: 4, fret: 5, duration: 'h' }
        ]
      },
      {
        notes: [
          { string: 4, fret: 0, duration: 'q' },
          { string: 4, fret: 3, duration: 'q' },
          { string: 4, fret: 5, duration: 'q' },
          { string: 4, fret: 3, duration: 'q' }
        ]
      },
      {
        notes: [
          { string: 4, fret: 0, duration: 'w' }
        ]
      }
    ]
  },
  
  'stairway-to-heaven': {
    id: 'stairway-tab',
    strings: 6,
    tuning: ['E', 'A', 'D', 'G', 'B', 'E'],
    measures: [
      {
        notes: [
          { string: 5, fret: 5, duration: '8' },
          { string: 4, fret: 7, duration: '8' },
          { string: 3, fret: 5, duration: '8' },
          { string: 2, fret: 6, duration: '8' },
          { string: 2, fret: 5, duration: '8' },
          { string: 3, fret: 5, duration: '8' },
          { string: 4, fret: 7, duration: '8' },
          { string: 3, fret: 8, duration: '8' }
        ]
      },
      {
        notes: [
          { string: 4, fret: 7, duration: '8' },
          { string: 3, fret: 5, duration: '8' },
          { string: 3, fret: 7, duration: '8' },
          { string: 2, fret: 6, duration: '8' },
          { string: 2, fret: 5, duration: '8' },
          { string: 3, fret: 7, duration: '8' },
          { string: 3, fret: 5, duration: '8' },
          { string: 3, fret: 7, duration: '8' }
        ]
      }
    ]
  },
  
  'blackbird': {
    id: 'blackbird-tab',
    strings: 6,
    tuning: ['E', 'A', 'D', 'G', 'B', 'E'],
    measures: [
      {
        notes: [
          { string: 3, fret: 0, duration: '8' },
          { string: 2, fret: 1, duration: '8' },
          { string: 1, fret: 0, duration: '8' },
          { string: 3, fret: 0, duration: '8' },
          { string: 1, fret: 0, duration: 'q' },
          { string: 2, fret: 1, duration: 'q' }
        ]
      },
      {
        notes: [
          { string: 3, fret: 0, duration: '8' },
          { string: 2, fret: 1, duration: '8' },
          { string: 1, fret: 0, duration: '8' },
          { string: 1, fret: 3, duration: '8' },
          { string: 1, fret: 5, duration: 'q' },
          { string: 1, fret: 3, duration: 'q' }
        ]
      }
    ]
  }
};

// VexFlow 렌더링을 위한 헬퍼 함수
export function convertToVexFlowNotation(excerpt: MusicExcerpt): any {
  return {
    clef: 'treble',
    keySignature: excerpt.keySignature,
    timeSignature: excerpt.timeSignature,
    measures: excerpt.measures.map(measure => ({
      notes: measure.notes.map(note => ({
        ...note,
        clef: 'treble',
        stem_direction: note.keys[0].split('/')[1] >= '5' ? -1 : 1
      }))
    }))
  };
}

// 탭 악보를 VexFlow TabStave로 변환
export function convertTabToVexFlow(tab: GuitarTab): any {
  return {
    numStrings: tab.strings,
    tuning: tab.tuning,
    measures: tab.measures.map(measure => ({
      notes: measure.notes.map(note => ({
        positions: [{
          str: note.string,
          fret: note.fret
        }],
        duration: note.duration
      }))
    }))
  };
}