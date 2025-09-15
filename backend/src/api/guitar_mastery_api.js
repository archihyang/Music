/**
 * Guitar Mastery System API Endpoints
 * 기타 마스터리 시스템 API
 */

const express = require('express');
const router = express.Router();

// 곡 추천 엔드포인트
router.get('/songs/recommendations', async (req, res) => {
  try {
    const { genre, artist, guitarist, difficulty, limit = 10 } = req.query;
    
    // TODO: 데이터베이스에서 필터링된 곡 가져오기
    const recommendations = getMockSongRecommendations({ genre, artist, guitarist, difficulty, limit });
    
    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    });
  } catch (error) {
    console.error('Song recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get song recommendations'
    });
  }
});

// 장르별 곡 목록
router.get('/songs/by-genre/:genre', async (req, res) => {
  try {
    const { genre } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const songs = getMockSongsByGenre(genre, page, limit);
    
    res.json({
      success: true,
      data: songs,
      genre,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Songs by genre error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get songs by genre'
    });
  }
});

// 기타리스트별 곡 목록
router.get('/songs/by-guitarist/:guitarist', async (req, res) => {
  try {
    const { guitarist } = req.params;
    const songs = getMockSongsByGuitarist(guitarist);
    
    res.json({
      success: true,
      data: songs,
      guitarist
    });
  } catch (error) {
    console.error('Songs by guitarist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get songs by guitarist'
    });
  }
});

// 연습 모듈 목록
router.get('/practice-modules', async (req, res) => {
  try {
    const { category, difficulty, limit = 20 } = req.query;
    const modules = getMockPracticeModules({ category, difficulty, limit });
    
    res.json({
      success: true,
      data: modules,
      count: modules.length
    });
  } catch (error) {
    console.error('Practice modules error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get practice modules'
    });
  }
});

// 연습 모듈 카테고리별 목록
router.get('/practice-modules/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const modules = getMockModulesByCategory(category);
    
    res.json({
      success: true,
      data: modules,
      category
    });
  } catch (error) {
    console.error('Modules by category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get modules by category'
    });
  }
});

// 학습 경로 목록
router.get('/learning-paths', async (req, res) => {
  try {
    const { level, category } = req.query;
    const paths = getMockLearningPaths({ level, category });
    
    res.json({
      success: true,
      data: paths,
      count: paths.length
    });
  } catch (error) {
    console.error('Learning paths error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get learning paths'
    });
  }
});

// 사용자 진도 조회
router.get('/user/:userId/progress', async (req, res) => {
  try {
    const { userId } = req.params;
    const progress = getMockUserProgress(userId);
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('User progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user progress'
    });
  }
});

// 사용자 진도 업데이트
router.post('/user/:userId/progress', async (req, res) => {
  try {
    const { userId } = req.params;
    const { songId, moduleId, progressType, status, completionPercentage } = req.body;
    
    // TODO: 데이터베이스에 진도 저장
    
    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: {
        userId,
        songId,
        moduleId,
        progressType,
        status,
        completionPercentage
      }
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update progress'
    });
  }
});

// 인기 곡 목록
router.get('/songs/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const songs = getMockPopularSongs(limit);
    
    res.json({
      success: true,
      data: songs,
      count: songs.length
    });
  } catch (error) {
    console.error('Popular songs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get popular songs'
    });
  }
});

// Mock 데이터 함수들 (실제 구현시 데이터베이스 쿼리로 대체)
function getMockSongRecommendations({ genre, artist, guitarist, difficulty, limit }) {
  const songs = [
    {
      id: '1',
      title: 'Stairway to Heaven',
      artist: 'Led Zeppelin',
      guitarist: 'Jimmy Page',
      genre: 'Classic Rock',
      difficulty: '고급',
      year: 1971,
      techniques: ['Fingerpicking', 'Arpeggios', 'Solo'],
      tempo: 72,
      key: 'Am',
      youtubeUrl: 'https://www.youtube.com/watch?v=QkF3oxzBGPI',
      thumbnail: '🎸',
      rating: 4.9,
      plays: '2.1M'
    },
    {
      id: '2',
      title: 'Hotel California',
      artist: 'Eagles',
      guitarist: 'Don Felder, Joe Walsh',
      genre: 'Classic Rock',
      difficulty: '중급',
      year: 1976,
      techniques: ['Arpeggios', 'Harmony', 'Solo'],
      tempo: 75,
      key: 'Bm',
      youtubeUrl: 'https://www.youtube.com/watch?v=EqPtz5qN7HM',
      thumbnail: '🎵',
      rating: 4.8,
      plays: '3.2M'
    },
    {
      id: '3',
      title: 'Comfortably Numb',
      artist: 'Pink Floyd',
      guitarist: 'David Gilmour',
      genre: 'Progressive Rock',
      difficulty: '고급',
      year: 1979,
      techniques: ['Bending', 'Vibrato', 'Phrasing'],
      tempo: 63,
      key: 'Bm',
      youtubeUrl: 'https://www.youtube.com/watch?v=x-xTttimcNk',
      thumbnail: '🎶',
      rating: 4.7,
      plays: '1.8M'
    },
    {
      id: '4',
      title: 'Sweet Child O Mine',
      artist: "Guns N' Roses",
      guitarist: 'Slash',
      genre: 'Hard Rock',
      difficulty: '중급',
      year: 1987,
      techniques: ['Alternate Picking', 'Bending', 'Solo'],
      tempo: 125,
      key: 'D',
      youtubeUrl: 'https://www.youtube.com/watch?v=1w7OgIMMRc4',
      thumbnail: '🎤',
      rating: 4.6,
      plays: '2.9M'
    },
    {
      id: '5',
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      guitarist: 'Brian May',
      genre: 'Progressive Rock',
      difficulty: '고급',
      year: 1975,
      techniques: ['Harmony', 'Orchestration', 'Solo'],
      tempo: 72,
      key: 'Bb',
      youtubeUrl: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
      thumbnail: '👑',
      rating: 4.9,
      plays: '4.1M'
    }
  ];
  
  let filtered = songs;
  if (genre) filtered = filtered.filter(s => s.genre === genre);
  if (artist) filtered = filtered.filter(s => s.artist.includes(artist));
  if (guitarist) filtered = filtered.filter(s => s.guitarist && s.guitarist.includes(guitarist));
  if (difficulty) filtered = filtered.filter(s => s.difficulty === difficulty);
  
  return filtered.slice(0, parseInt(limit));
}

function getMockSongsByGenre(genre, page, limit) {
  const allSongs = getMockSongRecommendations({ genre, limit: 100 });
  const start = (page - 1) * limit;
  return allSongs.slice(start, start + limit);
}

function getMockSongsByGuitarist(guitarist) {
  return getMockSongRecommendations({ guitarist, limit: 20 });
}

function getMockPracticeModules({ category, difficulty, limit }) {
  const modules = [
    {
      id: '1',
      name: '기본 손풀기 운동',
      category: 'warmup',
      subcategory: 'finger_exercises',
      difficulty: '초급',
      duration: 10,
      description: '손가락 독립성과 힘을 기르는 기본 운동',
      goals: ['손가락 독립성 향상', '근력 강화', '정확성 개선'],
      techniques: ['Finger Independence', 'Strength Building']
    },
    {
      id: '2',
      name: '믹솔리디안 스케일 패턴',
      category: 'scale',
      subcategory: 'modal',
      difficulty: '중급',
      duration: 15,
      description: '믹솔리디안 모드의 5가지 포지션 마스터',
      goals: ['모달 이해', '즉흥 연주 능력', '프렛보드 숙달'],
      scale: 'Mixolydian',
      key: 'G',
      tempo: 120
    },
    {
      id: '3',
      name: 'Blues Licks Collection',
      category: 'phrase',
      subcategory: 'blues',
      difficulty: '중급',
      duration: 20,
      description: 'B.B. King, Eric Clapton 스타일 블루스 프레이즈',
      goals: ['블루스 프레이징', '벤딩 테크닉', '표현력 향상'],
      techniques: ['Bending', 'Vibrato', 'Blues Phrasing']
    },
    {
      id: '4',
      name: 'Sweep Picking 기초',
      category: 'technique',
      subcategory: 'advanced',
      difficulty: '고급',
      duration: 25,
      description: '3현, 5현 스윕 피킹 아르페지오 패턴',
      goals: ['스윕 피킹 마스터', '속도 향상', '정확성'],
      techniques: ['Sweep Picking', 'Arpeggios'],
      tempo: 100
    },
    {
      id: '5',
      name: 'Jazz Chord Progressions',
      category: 'chord',
      subcategory: 'jazz',
      difficulty: '고급',
      duration: 30,
      description: 'ii-V-I 진행과 변형들',
      goals: ['재즈 화성 이해', '코드 보이싱', '컴핑'],
      techniques: ['Jazz Chords', 'Voice Leading', 'Comping']
    }
  ];
  
  let filtered = modules;
  if (category) filtered = filtered.filter(m => m.category === category);
  if (difficulty) filtered = filtered.filter(m => m.difficulty === difficulty);
  
  return filtered.slice(0, parseInt(limit));
}

function getMockModulesByCategory(category) {
  return getMockPracticeModules({ category, limit: 50 });
}

function getMockLearningPaths({ level, category }) {
  const paths = [
    {
      id: '1',
      name: '블루스 기타 마스터',
      description: 'BB King부터 Stevie Ray Vaughan까지, 블루스 기타의 모든 것',
      level: '중급',
      category: 'Blues',
      duration: 90, // days
      modules: ['3', '5', '8', '12'],
      songs: ['15', '23', '31', '42'],
      goals: ['12-bar 블루스 마스터', '블루스 스케일 완벽 이해', '벤딩과 비브라토 숙달']
    },
    {
      id: '2',
      name: '록 리드 기타 완성',
      description: 'Page, Hendrix, Van Halen의 테크닉을 마스터하기',
      level: '고급',
      category: 'Rock',
      duration: 120,
      modules: ['4', '7', '11', '15'],
      songs: ['1', '4', '8', '12'],
      goals: ['고급 솔로 테크닉', '톤 메이킹', '즉흥 연주 능력']
    },
    {
      id: '3',
      name: '어쿠스틱 핑거스타일',
      description: 'Tommy Emmanuel 스타일의 핑거스타일 기타',
      level: '고급',
      category: 'Acoustic',
      duration: 180,
      modules: ['6', '9', '13', '17'],
      songs: ['18', '25', '33', '41'],
      goals: ['독립적인 베이스라인', '멜로디와 하모니 동시 연주', '퍼커시브 테크닉']
    }
  ];
  
  let filtered = paths;
  if (level) filtered = filtered.filter(p => p.level === level);
  if (category) filtered = filtered.filter(p => p.category === category);
  
  return filtered;
}

function getMockUserProgress(userId) {
  return {
    userId,
    currentSongs: [
      {
        songId: '1',
        title: 'Stairway to Heaven',
        status: 'in_progress',
        completionPercentage: 65,
        lastPracticeDate: '2025-01-29'
      }
    ],
    currentModules: [
      {
        moduleId: '2',
        name: '믹솔리디안 스케일 패턴',
        status: 'in_progress',
        completionPercentage: 40,
        lastPracticeDate: '2025-01-29'
      }
    ],
    completedSongs: 12,
    completedModules: 8,
    totalPracticeTime: 4320, // minutes
    currentStreak: 5
  };
}

function getMockPopularSongs(limit) {
  return getMockSongRecommendations({ limit }).sort((a, b) => b.year - a.year);
}

// YouTube URL 처리 및 전사 요청
router.post('/transcribe', async (req, res) => {
  try {
    const { youtubeUrl, options = {} } = req.body;
    
    if (!youtubeUrl) {
      return res.status(400).json({
        success: false,
        error: 'YouTube URL is required'
      });
    }
    
    // TODO: AI 서비스로 전사 요청
    const transcriptionId = `trans_${Date.now()}`;
    
    // 즉시 응답 반환 (비동기 처리)
    res.json({
      success: true,
      transcriptionId,
      status: 'processing',
      estimatedTime: 120, // seconds
      message: 'Transcription started. Check progress via WebSocket.'
    });
    
    // TODO: 실제 AI 서비스 호출
    // mockTranscriptionProcess(transcriptionId, youtubeUrl, options);
    
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start transcription'
    });
  }
});

// 전사 상태 조회
router.get('/transcribe/:transcriptionId', async (req, res) => {
  try {
    const { transcriptionId } = req.params;
    
    // TODO: 실제 상태 조회
    const mockStatus = getMockTranscriptionStatus(transcriptionId);
    
    res.json({
      success: true,
      data: mockStatus
    });
  } catch (error) {
    console.error('Transcription status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transcription status'
    });
  }
});

// 음악 이론 분석
router.post('/analyze/theory', async (req, res) => {
  try {
    const { midiData, options = {} } = req.body;
    
    if (!midiData) {
      return res.status(400).json({
        success: false,
        error: 'MIDI data is required'
      });
    }
    
    // TODO: music21 서비스로 분석 요청
    const analysis = getMockMusicTheoryAnalysis(midiData);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Music theory analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze music theory'
    });
  }
});

// 댓글 시스템
router.get('/songs/:songId/comments', async (req, res) => {
  try {
    const { songId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const comments = getMockComments(songId, page, limit);
    
    res.json({
      success: true,
      data: comments,
      songId,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Comments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get comments'
    });
  }
});

router.post('/songs/:songId/comments', async (req, res) => {
  try {
    const { songId } = req.params;
    const { content, userId, userName } = req.body;
    
    if (!content || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Content and userId are required'
      });
    }
    
    // TODO: 데이터베이스에 댓글 저장
    const newComment = {
      id: `comment_${Date.now()}`,
      songId,
      userId,
      userName: userName || 'Anonymous',
      content,
      timestamp: new Date().toISOString(),
      likes: 0
    };
    
    res.json({
      success: true,
      data: newComment,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment'
    });
  }
});

// 파일 업로드 처리
router.post('/upload/audio', async (req, res) => {
  try {
    // TODO: multer 미들웨어로 파일 업로드 처리
    // TODO: AI 서비스로 전사 요청
    
    res.json({
      success: true,
      message: 'Audio file uploaded successfully',
      transcriptionId: `trans_${Date.now()}`,
      status: 'processing'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload audio file'
    });
  }
});

// Mock 함수들
function getMockTranscriptionStatus(transcriptionId) {
  return {
    transcriptionId,
    status: 'completed',
    progress: 100,
    result: {
      tabData: {
        measures: [
          {
            notes: 'e|--3--3--3--3--|\nB|--0--0--0--0--|\nG|--0--0--0--0--|\nD|--0--0--0--0--|\nA|--2--2--2--2--|\nE|--3--3--3--3--|',
            chord: 'G',
            timing: [0, 0.5, 1.0, 1.5]
          },
          {
            notes: 'e|--2--2--2--2--|\nB|--3--3--3--3--|\nG|--2--2--2--2--|\nD|--0--0--0--0--|\nA|--x--x--x--x--|\nE|--x--x--x--x--|',
            chord: 'D',
            timing: [2.0, 2.5, 3.0, 3.5]
          }
        ],
        bpm: 120,
        key: 'G',
        timeSignature: '4/4'
      },
      audioUrl: '/static/transcribed_audio.wav',
      midiUrl: '/static/transcribed_midi.mid'
    },
    completedAt: new Date().toISOString()
  };
}

function getMockMusicTheoryAnalysis(midiData) {
  return {
    key: {
      tonic: 'G',
      mode: 'Major',
      confidence: 0.89
    },
    chords: [
      { name: 'G', position: 0, duration: 2.0, confidence: 0.92 },
      { name: 'D', position: 2.0, duration: 2.0, confidence: 0.88 },
      { name: 'Em', position: 4.0, duration: 2.0, confidence: 0.85 },
      { name: 'C', position: 6.0, duration: 2.0, confidence: 0.90 }
    ],
    scales: [
      { name: 'G Major Pentatonic', confidence: 0.91 },
      { name: 'G Major', confidence: 0.85 },
      { name: 'E Minor Pentatonic', confidence: 0.78 }
    ],
    techniques: [
      { name: 'Strumming', confidence: 0.95, positions: [0, 2, 4, 6] },
      { name: 'Fingerpicking', confidence: 0.32, positions: [] }
    ],
    tempo: {
      bpm: 120,
      confidence: 0.94,
      variations: [{ position: 0, bpm: 118 }, { position: 4, bpm: 122 }]
    },
    structure: {
      sections: [
        { name: 'Intro', start: 0, end: 8, chords: ['G', 'D'] },
        { name: 'Verse', start: 8, end: 24, chords: ['G', 'D', 'Em', 'C'] }
      ]
    }
  };
}

function getMockComments(songId, page, limit) {
  const allComments = [
    {
      id: 'comment_1',
      songId,
      userId: 'user_1',
      userName: 'GuitarMaster92',
      content: '이 곡의 솔로 부분이 정말 어려워요. 특히 벤딩 부분에서 음정을 정확히 맞추기가 힘드네요.',
      timestamp: '2025-01-29T10:30:00Z',
      likes: 12,
      replies: [
        {
          id: 'reply_1',
          userId: 'user_2',
          userName: 'BluesKing',
          content: '벤딩은 많은 연습이 필요해요. 천천히 시작해서 점차 속도를 올려보세요!',
          timestamp: '2025-01-29T11:15:00Z',
          likes: 5
        }
      ]
    },
    {
      id: 'comment_2',
      songId,
      userId: 'user_3',
      userName: 'RockStar2025',
      content: '탭이 정말 정확하게 나왔네요! AI 전사 기능이 생각보다 훨씬 좋습니다.',
      timestamp: '2025-01-29T09:45:00Z',
      likes: 8,
      replies: []
    },
    {
      id: 'comment_3',
      songId,
      userId: 'user_4',
      userName: 'AcousticLover',
      content: '원곡과 비교해서 들어보니 거의 비슷하게 전사되었어요. 대단한 기술이네요!',
      timestamp: '2025-01-29T08:20:00Z',
      likes: 15,
      replies: []
    }
  ];
  
  const start = (page - 1) * limit;
  return allComments.slice(start, start + limit);
}

module.exports = router;