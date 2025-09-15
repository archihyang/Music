/**
 * Guitar Mastery System Database Models
 * 전문 기타 학습 시스템 데이터베이스 모델
 */

const { DataTypes } = require('sequelize');

// 곡 정보 모델
const SongModel = (sequelize) => {
  return sequelize.define('Song', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    artist: {
      type: DataTypes.STRING,
      allowNull: false
    },
    guitarist: {
      type: DataTypes.STRING
    },
    year: {
      type: DataTypes.INTEGER
    },
    genre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    subgenre: {
      type: DataTypes.STRING
    },
    difficulty: {
      type: DataTypes.ENUM('초급', '중급', '고급', '마스터'),
      defaultValue: '중급'
    },
    youtubeUrl: {
      type: DataTypes.STRING
    },
    spotifyUrl: {
      type: DataTypes.STRING
    },
    duration: {
      type: DataTypes.INTEGER // 초 단위
    },
    tempo: {
      type: DataTypes.INTEGER // BPM
    },
    key: {
      type: DataTypes.STRING // 조성
    },
    tuning: {
      type: DataTypes.STRING,
      defaultValue: 'Standard'
    },
    techniques: {
      type: DataTypes.JSON, // ['Bending', 'Tapping', 'Sweep Picking']
      defaultValue: []
    },
    scales: {
      type: DataTypes.JSON, // 사용된 스케일들
      defaultValue: []
    },
    chordProgressions: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    signature: {
      type: DataTypes.STRING,
      defaultValue: '4/4'
    },
    hasTab: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    tabPath: {
      type: DataTypes.STRING
    },
    popularity: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  }, {
    tableName: 'songs',
    timestamps: true
  });
};

// 연습 모듈 모델
const PracticeModuleModel = (sequelize) => {
  return sequelize.define('PracticeModule', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM(
        'warmup',
        'technique',
        'scale',
        'chord',
        'phrase',
        'improvisation',
        'theory',
        'ear_training'
      ),
      allowNull: false
    },
    subcategory: {
      type: DataTypes.STRING
    },
    difficulty: {
      type: DataTypes.ENUM('초급', '중급', '고급', '마스터'),
      defaultValue: '중급'
    },
    duration: {
      type: DataTypes.INTEGER // 예상 소요 시간(분)
    },
    description: {
      type: DataTypes.TEXT
    },
    goals: {
      type: DataTypes.JSON, // 학습 목표
      defaultValue: []
    },
    exercises: {
      type: DataTypes.JSON, // 구체적인 연습 내용
      defaultValue: []
    },
    tempo: {
      type: DataTypes.INTEGER
    },
    key: {
      type: DataTypes.STRING
    },
    scale: {
      type: DataTypes.STRING
    },
    techniques: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    prerequisites: {
      type: DataTypes.JSON, // 선수 모듈 ID들
      defaultValue: []
    },
    videoUrl: {
      type: DataTypes.STRING
    },
    tabPath: {
      type: DataTypes.STRING
    },
    audioPath: {
      type: DataTypes.STRING
    },
    popularity: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'practice_modules',
    timestamps: true
  });
};

// 아티스트 정보 모델
const ArtistModel = (sequelize) => {
  return sequelize.define('Artist', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    realName: {
      type: DataTypes.STRING
    },
    birthYear: {
      type: DataTypes.INTEGER
    },
    country: {
      type: DataTypes.STRING
    },
    genres: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    bands: {
      type: DataTypes.JSON, // 소속 밴드들
      defaultValue: []
    },
    style: {
      type: DataTypes.TEXT // 연주 스타일 설명
    },
    signatureGear: {
      type: DataTypes.JSON, // 주요 장비
      defaultValue: []
    },
    influences: {
      type: DataTypes.JSON, // 영향받은 아티스트
      defaultValue: []
    },
    signatureSongs: {
      type: DataTypes.JSON, // 대표곡들
      defaultValue: []
    },
    techniques: {
      type: DataTypes.JSON, // 주요 테크닉
      defaultValue: []
    },
    biography: {
      type: DataTypes.TEXT
    },
    imageUrl: {
      type: DataTypes.STRING
    },
    websiteUrl: {
      type: DataTypes.STRING
    },
    era: {
      type: DataTypes.STRING // '1970s', '1980s', etc
    }
  }, {
    tableName: 'artists',
    timestamps: true
  });
};

// 사용자 진도 모델
const UserProgressModel = (sequelize) => {
  return sequelize.define('UserProgress', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    songId: {
      type: DataTypes.UUID,
      references: {
        model: 'songs',
        key: 'id'
      }
    },
    moduleId: {
      type: DataTypes.UUID,
      references: {
        model: 'practice_modules',
        key: 'id'
      }
    },
    progressType: {
      type: DataTypes.ENUM('song', 'module'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'completed', 'mastered'),
      defaultValue: 'not_started'
    },
    completionPercentage: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    practiceTime: {
      type: DataTypes.INTEGER, // 총 연습 시간(초)
      defaultValue: 0
    },
    lastPracticeDate: {
      type: DataTypes.DATE
    },
    startedDate: {
      type: DataTypes.DATE
    },
    completedDate: {
      type: DataTypes.DATE
    },
    accuracy: {
      type: DataTypes.FLOAT // 정확도 (0-100)
    },
    tempo: {
      type: DataTypes.INTEGER // 현재 연습 템포
    },
    notes: {
      type: DataTypes.TEXT // 사용자 메모
    },
    difficulty: {
      type: DataTypes.STRING // 현재 난이도
    },
    sections: {
      type: DataTypes.JSON, // 구간별 진도
      defaultValue: {}
    },
    achievements: {
      type: DataTypes.JSON, // 달성한 목표들
      defaultValue: []
    }
  }, {
    tableName: 'user_progress',
    timestamps: true,
    indexes: [
      {
        fields: ['userId', 'songId'],
        unique: true,
        where: {
          songId: {
            [DataTypes.Op.ne]: null
          }
        }
      },
      {
        fields: ['userId', 'moduleId'],
        unique: true,
        where: {
          moduleId: {
            [DataTypes.Op.ne]: null
          }
        }
      }
    ]
  });
};

// 학습 경로 모델
const LearningPathModel = (sequelize) => {
  return sequelize.define('LearningPath', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    level: {
      type: DataTypes.ENUM('초급', '중급', '고급', '마스터'),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING // 'Blues', 'Jazz', 'Rock', etc
    },
    duration: {
      type: DataTypes.INTEGER // 예상 소요 기간(일)
    },
    modules: {
      type: DataTypes.JSON, // 포함된 모듈 ID와 순서
      defaultValue: []
    },
    songs: {
      type: DataTypes.JSON, // 포함된 곡 ID와 순서
      defaultValue: []
    },
    prerequisites: {
      type: DataTypes.JSON, // 선수 학습 경로
      defaultValue: []
    },
    goals: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    imageUrl: {
      type: DataTypes.STRING
    },
    popularity: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'learning_paths',
    timestamps: true
  });
};

// 사용자 통계 모델
const UserStatsModel = (sequelize) => {
  return sequelize.define('UserStats', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true
    },
    totalPracticeTime: {
      type: DataTypes.INTEGER, // 초
      defaultValue: 0
    },
    streak: {
      type: DataTypes.INTEGER, // 연속 연습 일수
      defaultValue: 0
    },
    longestStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastPracticeDate: {
      type: DataTypes.DATE
    },
    songsCompleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    songsMastered: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    modulesCompleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    modulesMastered: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    favoriteGenre: {
      type: DataTypes.STRING
    },
    favoriteArtist: {
      type: DataTypes.STRING
    },
    skillLevels: {
      type: DataTypes.JSON, // 기술별 레벨
      defaultValue: {
        rhythm: 0,
        lead: 0,
        fingerstyle: 0,
        theory: 0,
        earTraining: 0,
        sightReading: 0,
        improvisation: 0
      }
    },
    achievements: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    weeklyGoal: {
      type: DataTypes.INTEGER, // 주간 목표 연습 시간(분)
      defaultValue: 180 // 3시간
    },
    weeklyProgress: {
      type: DataTypes.INTEGER, // 이번 주 연습 시간(분)
      defaultValue: 0
    }
  }, {
    tableName: 'user_stats',
    timestamps: true
  });
};

module.exports = {
  SongModel,
  PracticeModuleModel,
  ArtistModel,
  UserProgressModel,
  LearningPathModel,
  UserStatsModel
};